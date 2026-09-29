# 🏦 Banking Backend API

A backend API for a banking system built with **Node.js, Express.js, MongoDB, and Mongoose**.

The project implements user authentication, bank account management, ledger-based balance calculation, fund transfers, transaction tracking, idempotency protection, and system-user controlled initial fund transfers.

---

## 🚀 Features

- User registration and login
- JWT-based authentication
- Cookie-based authentication
- Token blacklist-based logout
- System-user authorization
- Bank account creation
- Multiple accounts per user
- Account status management
- Ledger-based balance calculation
- Debit and credit ledger entries
- Account-to-account fund transfers
- Initial fund transactions
- MongoDB transactions for atomic financial operations
- Transaction status tracking
- Idempotency key support
- Password hashing using bcrypt
- Automatic cleanup of blacklisted tokens using MongoDB TTL
- Mongoose schema validation
- Database indexing

---

## 🛠️ Tech Stack

| Technology    | Purpose            |
| ------------- | ------------------ |
| Node.js       | JavaScript runtime |
| Express.js    | REST API framework |
| MongoDB       | Database           |
| Mongoose      | MongoDB ODM        |
| JWT           | Authentication     |
| bcryptjs      | Password hashing   |
| cookie-parser | Cookie handling    |

---

## 📁 Project Structure

```text
banking-backend/
│
├── src/
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   │
│   ├── middlewares/
│   │   └── auth.middleware.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── account.model.js
│   │   ├── transaction.model.js
│   │   ├── ledger.model.js
│   │   └── blackList.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   └── transaction.routes.js
│   │
│   ├── app.js
│   └── db.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

# 🏗️ Architecture

The backend follows a layered architecture:

```text
Client
   │
   ▼
Express Routes
   │
   ▼
Authentication Middleware
   │
   ▼
Controllers
   │
   ▼
Mongoose Models
   │
   ▼
MongoDB
```

The Express application exposes three main API modules:

```text
/api/auth
/api/accounts
/api/transactions
```

These routes are registered in `src/app.js`.

---

# 🔐 Authentication

The application uses **JWT-based authentication**.

During registration and login, a JWT containing the user's ID is generated with a **3-day expiration** and stored in a cookie named `token`.

### Authentication Flow

```text
Register / Login
       │
       ▼
   Generate JWT
       │
       ▼
   Token Cookie
       │
       ▼
Authenticated Request
       │
       ▼
Authentication Middleware
       │
       ├── Check token
       ├── Check blacklist
       ├── Verify JWT
       └── Find user
              │
              ▼
           req.user
```

The authentication middleware verifies the JWT and attaches the corresponding user to `req.user`.

---

# 👤 User Model

The user model contains:

- `email`
- `name`
- `password`
- `systemUser`
- timestamps

Email addresses are unique, trimmed, and converted to lowercase. Passwords are excluded from normal queries using `select: false`.

Passwords are hashed with `bcryptjs` before being stored in the database.

The model also provides a `comparePassword()` method for password verification.

---

# 🏦 Account System

Each account is associated with a user through a MongoDB ObjectId reference.

An account contains:

```text
user
status
currency
createdAt
updatedAt
```

Supported account statuses:

```text
ACTIVE
FROZEN
CLOSED
```

The default currency is `INR`.

---

# 💰 Ledger-Based Balance

The account model does not maintain a directly stored balance.

Instead, the balance is calculated from ledger entries:

```text
Balance = Total Credits - Total Debits
```

The calculation is performed using a MongoDB aggregation pipeline.

This makes the ledger the source of the account's balance.

---

# 📒 Ledger System

The ledger records individual financial movements.

Each ledger entry contains:

```text
account
amount
transaction
type
```

The ledger supports two entry types:

```text
CREDIT
DEBIT
```

Ledger fields are immutable, and the model explicitly prevents update and delete operations on ledger entries.

### Example

For a ₹1,000 transfer:

```text
Sender Account
      │
      └── DEBIT  ₹1,000

Receiver Account
      │
      └── CREDIT ₹1,000
```

The account balances are then derived from these ledger entries.

---

# 💸 Transaction System

Transactions represent money movement between accounts.

Each transaction contains:

```text
fromAccount
toAccount
amount
status
idempotencyKey
createdAt
updatedAt
```

Supported transaction states:

```text
PENDING
COMPLETED
FAILED
REVERSED
```

The `idempotencyKey` is required, indexed, and unique.

---

# 🔁 Idempotency

Every normal transaction requires an `idempotencyKey`.

Before processing a transaction, the backend checks whether the key has already been used. If an existing transaction is found, its current status determines the response.

This prevents the same request from being processed repeatedly.

### Example

```text
Client
  │
  │ Transfer ₹500
  ▼
Server
  │
  ├── Process transaction
  │
  │ Network timeout
  ▼
Client retries request
  │
  ▼
Same idempotencyKey
  │
  ▼
Server detects existing transaction
  │
  ▼
No duplicate transaction
```

---

# 🔄 Fund Transfer Flow

A normal account-to-account transfer follows this flow:

```text
1. Receive transaction request
            │
            ▼
2. Validate request
            │
            ▼
3. Find sender & receiver accounts
            │
            ▼
4. Check idempotency key
            │
            ▼
5. Check account status
            │
            ▼
6. Calculate sender balance
            │
            ▼
7. Check sufficient funds
            │
            ▼
8. Start MongoDB transaction
            │
            ▼
9. Create transaction
            │
            ▼
10. Create DEBIT ledger entry
            │
            ▼
11. Create CREDIT ledger entry
            │
            ▼
12. Mark transaction COMPLETED
            │
            ▼
13. Commit MongoDB transaction
```

The debit and credit ledger entries are created using the same MongoDB session, followed by committing the transaction.

---

# 🏛️ System User

The user model includes a `systemUser` flag that identifies system users.

A separate authentication middleware verifies that the authenticated user is a system user before allowing access to the initial-funds endpoint.

### Initial Funds Flow

```text
System User
     │
     ▼
POST /api/transactions/system/initial-funds
     │
     ▼
Find target account
     │
     ▼
Find system user's account
     │
     ▼
Create transaction
     │
     ├── DEBIT system account
     │
     └── CREDIT target account
     │
     ▼
COMPLETED
```

Both ledger entries are created inside a MongoDB transaction.

---

# 🚪 Logout & Token Blacklisting

When a user logs out, the current JWT is added to the token blacklist and the authentication cookie is cleared.

The authentication middleware checks the blacklist before accepting a token.

Blacklisted tokens are automatically removed from MongoDB after approximately **3 days** using a TTL index.

```text
Logout
  │
  ▼
JWT added to blacklist
  │
  ▼
Cookie cleared
  │
  ▼
Future request with same JWT
  │
  ▼
Blacklist lookup
  │
  ▼
401 Unauthorized
```

---

# 📡 API Endpoints

## Authentication

**Base URL**

```text
/api/auth
```

| Method | Endpoint    | Description         |
| ------ | ----------- | ------------------- |
| POST   | `/register` | Register a new user |
| POST   | `/login`    | Login               |
| POST   | `/logout`   | Logout              |

---

## Accounts

**Base URL**

```text
/api/accounts
```

| Method | Endpoint              | Authentication | Description                   |
| ------ | --------------------- | -------------- | ----------------------------- |
| POST   | `/`                   | Required       | Create a new account          |
| GET    | `/`                   | Required       | Get logged-in user's accounts |
| GET    | `/balance/:accountId` | Required       | Get account balance           |

---

## Transactions

**Base URL**

```text
/api/transactions
```

| Method | Endpoint                | Authentication | Description          |
| ------ | ----------------------- | -------------- | -------------------- |
| POST   | `/`                     | Required       | Transfer money       |
| POST   | `/system/initial-funds` | System User    | Create initial funds |

---

# 🧪 API Examples

## Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Create Account

```http
POST /api/accounts/
```

Authentication is required.

---

## Transfer Money

```http
POST /api/transactions/
Content-Type: application/json
```

```json
{
  "fromAccount": "SOURCE_ACCOUNT_ID",
  "toAccount": "DESTINATION_ACCOUNT_ID",
  "amount": 500,
  "idempotencyKey": "unique-request-id-123"
}
```

---

## Create Initial Funds

```http
POST /api/transactions/system/initial-funds
Content-Type: application/json
```

```json
{
  "toAccount": "TARGET_ACCOUNT_ID",
  "amount": 10000,
  "idempotencyKey": "initial-fund-001"
}
```

This endpoint requires system-user authentication.

---

# ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
```

The database connection uses `MONGO_URI`, while JWT generation and verification use `JWT_SECRET`.
**Do not commit `.env` to GitHub.**

Add the following to `.gitignore`:

```text
.env
node_modules/
```

---

# ▶️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/subhajitcodes/banking-backend.git
cd banking-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env`:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
PORT=3000
```

### 4. Start the server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

> The exact npm scripts depend on the `package.json` configuration.

---

# 🗄️ Database Design

The main relationships can be represented as:

```text
              USER
               │
        ┌──────┴──────┐
        ▼             ▼
     ACCOUNT       ACCOUNT
        │             │
        └──────┬──────┘
               │
               ▼
          TRANSACTION
           /       \
          ▼         ▼
       DEBIT      CREDIT
          \         /
           ▼       ▼
             LEDGER
```

### Main Collections

```text
users
accounts
transactions
ledgers
tokenBlackLists
```

---

# 🔒 Security Mechanisms

The current implementation includes:

- Password hashing with bcrypt
- JWT authentication
- Cookie-based authentication
- Token blacklisting
- System-user authorization
- MongoDB transactions
- Immutable ledger records
- Unique idempotency keys
- Mongoose validation
- Database indexes
- Automatic blacklist token expiration

---

# 🔮 Future Improvements

This project is currently an educational/portfolio banking backend. Some areas that can be improved before production use include:

- Add rate limiting
- Add stronger password policies
- Configure secure cookie options
- Add centralized error-handling middleware
- Add dedicated request validation
- Add transaction history APIs
- Add pagination
- Add stronger account ownership validation
- Implement transaction reversal functionality
- Add audit logging
- Implement refresh-token authentication
- Add automated unit/integration tests
- Add Swagger/OpenAPI documentation
- Add structured logging
- Add fraud and abuse protection
- Use integer minor units or `Decimal128` for monetary values instead of JavaScript `Number`
- Improve concurrency handling around balance validation and transfers

---

# 📌 Project Status

**Status:** In Development

**Project Type:** Banking Backend API

**Architecture:** REST API

**Runtime:** Node.js

**Framework:** Express.js

**Database:** MongoDB

**ODM:** Mongoose

**Authentication:** JWT + Cookies

**Accounting Model:** Ledger-based

---

## 📄 License

This project is intended for **educational and portfolio purposes**.
