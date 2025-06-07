import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from "../utils/verifyEmail.js";

export const registerUserController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "provide name, email and password",
        error: true,
        success: false,
      });
    }
    // Check if user already exists
    const user = await UserModel.findOne({ email: email });

    if (user) {
      return res.status(400).json({
        message: "User already exists with this email",
        error: true,
        success: false,
      });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit verification code
    let newUser = new UserModel({
      email,
      name,
      password: hashedPassword,
      otp: verifyCode,
      otp_expiry: new Date(Date.now() + 15 * 60 * 1000),
    });
    await newUser.save();
    // Send verification code via email
    await sendEmailFun({
      to: email,
      subject: "Verify Your Email",
      text: `Hello ${name},\n\nYour verification code is: ${verifyCode}\n\nPlease use this code to verify your email address.\n\nThank you!`,
      html: VerificationEmail(name, verifyCode),
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        email: newUser.email,
        id: newUser._id,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      error: false,
      message: "User registered successfully",
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
export const verifyEmailController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const isCodeValid = user.otp === otp;
    const isCodeExpired = user.otp_expiry > Date.now();

    if (isCodeValid && isCodeExpired) {
      user.verify_email = true;
      user.otp = null; // Clear the OTP after successful verification
      user.otp_expiry = null; // Clear the OTP expiry date
      await user.save();

      return res.status(200).json({
        message: "Email verified successfully",
        error: false,
        success: true,
      });
    } else if (!isCodeValid) {
      return res.status(400).json({
        message: "Invalid verification code",
        error: true,
        success: false,
      });
    } else if (isCodeExpired) {
      return res.status(400).json({
        message: "Verification code has expired",
        error: true,
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
