import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from "../utils/verifyEmail.js";
import generateAccessToken from "../utils/generatedAccessToken.js";
import generateRefreshToken from "../utils/generatedRefreshToken.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import exp from "constants";

// Configuration cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
      text: `Hello ${newUser.name},\n\nYour verification code is: ${verifyCode}\n\nPlease use this code to verify your email address.\n\nThank you!`,
      html: VerificationEmail(newUser.name, verifyCode),
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
    const isCodeExpired = user.otp_expiry < Date.now();
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
    await UserModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
      refresh_token: refreshtoken,
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

//User avatar controller
export const userAvatarController = async (req, res) => {
  try {
    const userId = req.userId; // Lấy userId từ middleware xác thực
    const files = req.files;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", error: true });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No file uploaded", error: true });
    }

    // ===== Xử lý xoá ảnh cũ từ Cloudinary nếu có =====
    const oldImageUrl = req.query.img;
    if (oldImageUrl) {
      try {
        const parts = oldImageUrl.split("/upload/");
        if (parts.length === 2) {
          const filePath = parts[1];
          const publicIdWithExt = filePath.split("/").pop();
          const publicId = publicIdWithExt.split(".")[0];
          console.log("Deleting old avatar with publicId:", publicId);

          const result = await cloudinary.uploader.destroy(publicId);
          console.log("Cloudinary destroy result:", result);
        }
      } catch (err) {
        console.error("Failed to delete old avatar:", err.message);
      }
    }

    // ===== Upload ảnh mới lên Cloudinary =====
    const uploadOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };

    const uploadResult = await cloudinary.uploader.upload(
      files[0].path,
      uploadOptions
    );

    // Xóa file ảnh local sau khi upload
    try {
      fs.unlinkSync(files[0].path);
      console.log(`Deleted local file: ${files[0].path}`);
    } catch (err) {
      console.error(`Failed to delete local file: ${err.message}`);
    }

    // ===== Lưu avatar mới vào database =====
    user.avatar = uploadResult.secure_url;
    await user.save();

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
      userId: user._id,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
    });
  }
};

export const removeImageFromCloudinary = async (req, res) => {
  const imgUrl = req.query.img;
  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];
  const imageName = image.split(".")[0];

  if (imageName) {
    const result = await cloudinary.uploader.destroy(
      imageName,
      (error, result) => {
        if (error) {
          console.error("Cloudinary deletion error:", error);
        }
      }
    );

    if (result.result === "ok") {
      return res.status(200).json({
        message: "Image removed successfully",
      });
    } else {
      return res.status(500).json({
        message: "Failed to remove image",
      });
    }
  } else {
    return res.status(400).json({
      message: "Invalid image URL",
    });
  }
};

// Update user details controller
export const updateUserDetailsController = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, mobile, password } = req.body;

    const userExist = await UserModel.findById(userId);
    if (!userExist) {
      return res.status(404).send("User not found");
    }

    let verifyCode = "";
    if (email !== userExist.email) {
      verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit verification code
    }

    // Hash the password if provided
    let hashedPassword = "";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } else {
      hashedPassword = userExist.password; // Keep the existing password if not provided
    }

    if (email !== userExist.email) {
      const emailExists = await UserModel.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          message: "Email already in use",
          success: false,
          error: true,
        });
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        name: name,
        mobile: mobile,
        email: email,
        verify_email: email !== userExist.email ? false : true, // Set to false if a new email is provided
        password: hashedPassword,
        otp: verifyCode !== "" ? verifyCode : null, // Set new OTP if email is changed
        otp_expiry:
          verifyCode !== "" ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
      { new: true }
    );

    if (email !== userExist.email && verifyCode) {
      // Send verification code via email if email is changed
      await sendEmailFun({
        to: email,
        subject: "Verify Your Email",
        text: `Hello ${userExist.name},\n\nYour verification code is: ${verifyCode}\n\nPlease use this code to verify your email address.\n\nThank you!`,
        html: VerificationEmail(userExist.name, verifyCode),
      });
    }

    return res.status(200).json({
      message: "User details updated successfully",
      success: true,
      error: false,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// forgot password controller
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        message: "Please provide a valid email address",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.json({
        message: "If your email exists, a verification code has been sent.",
        success: true,
        error: false,
      });
    } else {
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = verifyCode;
      user.otp_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      await sendEmailFun({
        to: email,
        subject: "Reset Your Password",
        text: `Hello ${user.name},\n\nYour password reset code is: ${verifyCode}\n\nPlease use this code to reset your password.\n\nThank you!`,
        html: VerificationEmail(user.name, verifyCode),
      });

      return res.json({
        message: "Verification code sent to your email",
        success: true,
        error: false,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
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

    if (!email || !otp) {
      return res.status(400).json({
        message: "Please provide email and OTP",
        error: true,
        success: false,
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    }

    if (user.otp_expiry < Date.now()) {
      return res.status(400).json({
        message: "OTP has expired",
        error: true,
        success: false,
      });
    }

    user.otp = null; // Clear the OTP after successful verification
    user.otp_expiry = null; // Clear the OTP expiry date
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};

// reset password
export const resetPasswordController = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please provide email, new password and confirm password",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
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

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
        error: true,
        success: false,
      });
    }

    if (user.otp || user.otp_expiry) {
      return res.status(403).json({
        message: "Please verify OTP before resetting password",
        success: false,
        error: true,
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      message: "Password reset successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};

// refresh token
export const refreshTokenController = async (req, res) => {
  try {
    const refreshToken =
      req.cookies.refreshtoken || req?.headers?.authorization?.split(" ")[1];
    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token provided",
        error: true,
        success: false,
      });
    }

    const verifyToken = await jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );

    const userId = verifyToken?.id;
    if (!userId) {
      return res.status(403).json({
        message: "Invalid token payload",
        success: false,
        error: true,
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }
    const newAccessToken = await generateAccessToken(userId);

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    res.cookie("accesstoken", newAccessToken, cookiesOption);

    return res.status(200).json({
      message: "New access token refreshed successfully",
      success: true,
      error: false,
      data: {
        accesstoken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};

//get login user details
export const getLoginUserDetailsController = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findById(userId).select(
      "-password -otp -otp_expiry -refresh_token"
    );
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      success: true,
      error: false,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};
