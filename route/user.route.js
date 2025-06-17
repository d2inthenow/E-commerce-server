import { Router } from "express";
import {
  loginUserController,
  registerUserController,
  verifyEmailController,
  logoutUserController,
  userAvatarController,
  removeImageFromCloudinary,
  updateUserDetailsController,
  forgotPasswordController,
  verifyForgotPasswordOtp,
  resetPasswordController,
  refreshTokenController,
  getLoginUserDetailsController,
} from "../controllers/user.controller.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/verifyEmail", verifyEmailController);
userRouter.post("/login", loginUserController);
userRouter.get("/logout", auth, logoutUserController);
userRouter.put(
  "/user-avatar",
  auth,
  upload.array("avatar"),
  userAvatarController
);
userRouter.delete("/deleteImage", auth, removeImageFromCloudinary);
userRouter.put("/:id", auth, updateUserDetailsController);
userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
userRouter.post("/reset-password", resetPasswordController);
userRouter.post("/refresh-token", refreshTokenController);
userRouter.get("/user-details", auth, getLoginUserDetailsController);

export default userRouter;
