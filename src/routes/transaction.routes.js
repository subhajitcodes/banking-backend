import express from "express";
import { createTransactionController } from "../controllers/transaction.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

router.post("/", auth.authMiddleware, createTransactionController);

export default router;
