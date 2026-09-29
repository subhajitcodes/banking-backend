import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import tokenBlackListModel from "../models/blackList.model.js";

/**
 * - user register controller
 * - POST /api/auth/register
 */
export async function userRegisterController(req, res) {
  const { email, password, name } = req.body;

  const isExist = await userModel.findOne({ email: email });

  if (isExist) {
    return res.status(422).json({
      message: "User already exists with email",
      status: "failed",
    });
  }

  const user = await userModel.create({ email, password, name });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(201).json({
    message: "User created successfully",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

/**
 * - user login controller
 * - POST /api/auth/register
 */

export async function userLoginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email: email }).select("password");

  if (!user) {
    return res.status(401).json({
      message: "Email or password is INVALID",
    });
  }

  const isValidPassword = user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Email or password is INVALID",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(200).json({
    message: "User LoggedIn successfully",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

/**
 * - USER logout controller
 * - POST /api/auth/logout
 */

export async function userLogoutController(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      message: "Token not found",
    });
  }

  await tokenBlackListModel.create({
    token: token,
  });
  res.clearCookie("token");

  return res.status(200).json({
    message: "User loggedout successfully",
  });
}
