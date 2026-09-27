import transactionModel from "../models/transaction.model.js";
import ledgerModel from "../models/ledger.model.js";
import accountModel from "../models/account.model.js";

/**
 * - Create new transaction
 */

export async function createTransactionController(req, res) {
  /**
   * - Validate Request
   */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Required details not found",
    });
  }

  const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  /**
   * - Validate Idempotency Key
   */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still in process",
      });
    }

    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed",
      });
    }

    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction was reversed please retry",
      });
    }
  }

  /**
   * - Check Account Status
   */

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both Account must be active to process a transaction",
    });
  }

  /**
   * - Derive sender balance from ledger
   */

  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient Balance.Current balance ${balance} Requested amount is ${amount}`,
    });
  }
  
}
