import userModel from "../models/user.model.js";

import jwt from "jsonwebtoken";

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.header.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorize access , token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userId);

    req.user = user;

    next();
  } catch (e) {
    return res.status(401).json({
      message: "Unauthorize access , token is missing",
    });
  }
}

export default { authMiddleware };
