import accountModel from "../models/account.model.js";

export async function createAccountController(req, res) {
  const user = req.user;

  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    message: "Account created successfully",
    account,
  });
}
