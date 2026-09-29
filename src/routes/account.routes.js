import express from "express";

import auth from "../middlewares/auth.middleware.js";
import {
  createAccountController,
  getUserAccountController,
  getAccountBalanceController,
} from "../controllers/account.controller.js";

const router = express.Router();

/**
 * - POST /api/accounts/
 * - create a new account
 * - protected route
 */
router.post("/", auth.authMiddleware, createAccountController);

/**
 * - GET /api/accounts/
 * - Get all accounts of loggedin user
 * - Protected Route
 */
router.get("/", auth.authMiddleware, getUserAccountController);

/**
 * - GET /api/accounts/balance/:accountId
 */
router.get(
  "/balance/:accountId",
  auth.authMiddleware,
  getAccountBalanceController,
);
export default router;
