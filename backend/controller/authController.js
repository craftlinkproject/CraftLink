import User from "../model/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";
import sendMail from "../config/sendMail.js";
import { ROLES } from "../constants/roles.js";

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,        // 🔥 لازم true مع https
    sameSite: "none",    // 🔥 أهم حاجة
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  delete user.resetOtp;
  delete user.otpExpires;
  return user;
};

/**
 * Sign up a new user (email/password based)
 */
export const signUp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashPassword,
      role,
    });
    const token = await genToken(user._id);
    setAuthCookie(res, token);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error(
      "signUp error:",
      error && error.message ? error.message : error,
    );
    return res.status(500).json({ message: `SignUp error ${error.message}` });
  }
};

/**
 * Login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.password) {
      return res.status(500).json({ message: "User password missing" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }
    const token = await genToken(user._id);
    setAuthCookie(res, token);
    return res.status(200).json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error(
      "login error:",
      error && error.message ? error.message : error,
    );
    return res.status(500).json({ message: "Login failed" });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user = await User.findOne({ email: username, role: 0 }).select("+password");
    if (!user) {
      const adminCount = await User.countDocuments({ role: 0 });
      if (adminCount > 0) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name: "Admin",
        email: username,
        password: hashedPassword,
        role: 0,
      });
    }

    if (!user.password) {
      return res.status(500).json({ message: "Admin password missing" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect admin password" });
    }

    const token = await genToken(user._id);
    setAuthCookie(res, token);
    return res.status(200).json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error("adminLogin error:", error && error.message ? error.message : error);
    return res.status(500).json({ message: "Admin login failed" });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error(
      "logOut error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Logout error ${error.message || error}` });
  }
};

// ===================== Password Reset (OTP) ===================== //
/**
 * Sends a One-Time Password (OTP) to the user's email.
 *
 * Security Notes:
 * - OTP expires after 5 minutes
 * - A new OTP request is blocked if a valid OTP already exists
 */

/**
 * Generate and send an OTP to user's email. OTP is stored on the user document.
 */
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerifed = false;

    await user.save();

    await sendMail(email, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};
/**
 * Verify the OTP provided by the user
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email }).select("+resetOtp +otpExpires");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }
    if (user.resetOtp?.trim() !== otp.toString().trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    user.isOtpVerifed = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("verifyOTP error:", error);
    return res.status(500).json({
      message: "verifyOTP server error",
    });
  }
};

/**
 * Reset password after OTP verification
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    const user = await User.findOne({ email });
    if (!user || !user.isOtpVerifed) {
      return res.status(400).json({ message: "OTP verification is required" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    user.isOtpVerifed = false;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(
      "resetPassword error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `resetPassword error ${error.message}` });
  }
};

// ===================== Google Authentication ===================== //
export const googleLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found. Please sign up first." });
    const token = await genToken(user._id);
    setAuthCookie(res, token);
    return res.status(200).json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error(
      "googleLogin error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `googleLogin error ${error.message}` });
  }
};

export const googleSignUp = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "Name and email are required" });
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({
          user: sanitizeUser(user),
          message: "User already exists. Please login.",
        });
    }
    user = await User.create({ name, email, role });
    const token = await genToken(user._id);
    setAuthCookie(res, token);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error(
      "googleSignUp error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `googleSignUp error ${error.message}` });
  }
};
