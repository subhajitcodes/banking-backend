import express from "express";

import auth from "../middlewares/auth.middleware.js";
import { createAccountController } from "../controllers/account.controller.js";

const router = express.Router();

/**
 * - POST /api/accounts/
 * - create a new account
 * - protected route
 */
router.post("/", auth.authMiddleware, createAccountController);

export default router;
