import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      console.log("No token in request");
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified for user:", decoded.userId || decoded.id);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for token:", userId);
      return res.status(401).json({ success: false, message: "User not found" });
    }
    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 0) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

export const instructorOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 2 && req.user.role !== 0)) {
    return res.status(403).json({ success: false, message: "Instructor or Admin access required" });
  }
  next();
};

export const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
};

export default authMiddleware;
