import express from "express";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

/* POST  /api/auth/register */
router.post("/register", authController.userRegisterController);

/* POST /api/auth/login */
router.post('/login',authController.userLoginController)

export default router;
