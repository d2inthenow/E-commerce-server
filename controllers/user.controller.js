import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from "../utils/verifyEmail.js";
import generateAccessToken from "../utils/generatedAccessToken.js";
import generateRefreshToken from "../utils/generatedRefreshToken.js";

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

export const loginUserController = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is not active. Please contact support.",
        error: true,
        success: false,
      });
    }
    if (user.status === "Banned") {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
        error: true,
        success: false,
      });
    }

    if (!user.verify_email) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(400).json({
        message: "Invalid password",
        error: true,
        success: false,
      });
    }

    // Generate JWT token
    const accesstoken = await generateAccessToken(user._id);
    const refreshtoken = await generateRefreshToken(user._id);

    // Update last login date
    const updateUser = await UserModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
    });

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1 * 60 * 60 * 1000,
    };
    res.cookie("accesstoken", accesstoken, cookiesOption);
    res.cookie("refreshtoken", refreshtoken, cookiesOption);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Login successful",
      data: {
        accesstoken,
        refreshtoken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const logoutUserController = async (req, res) => {
  try {
    const userId = req.userId;

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 0,
    };
    res.clearCookie("accesstoken", "", cookiesOption);
    res.clearCookie("refreshtoken", "", cookiesOption);

    await UserModel.updateOne(
      { _id: req.userId },
      {
        refresh_token: "",
      }
    );
    return res.status(200).json({
      message: "Logout successful",
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
