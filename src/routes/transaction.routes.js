import express from "express";
import {
  createTransactionController,
  createInitialFundsTransaction,
} from "../controllers/transaction.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

router.post("/", auth.authMiddleware, createTransactionController);

/**
 * - POST /api/transaction/system/initial-funds
 */

router.post(
  "/system/initial-funds",
  auth.authSystemUserMiddleware,
  createInitialFundsTransaction,
);

export default router;
