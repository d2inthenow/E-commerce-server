import { Router } from "express";
import {
  loginUserController,
  registerUserController,
  verifyEmailController,
  logoutUserController,
} from "../controllers/user.controller.js";

const userRouter = Router();
userRouter.post("/register", registerUserController);
userRouter.post("/verifyEmail", verifyEmailController);
userRouter.post("/login", loginUserController);
userRouter.get("/logout", logoutUserController);

export default userRouter;
