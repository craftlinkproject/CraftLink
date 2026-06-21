// Import JWT library for token verification
import jwt from "jsonwebtoken";
// Import User model for database lookup
import User from "../model/userModel.js";
// ===================== Authentication Middleware ===================== //
/**
 * Authentication middleware for protected routes.
 * - Verifies JWT token from cookies
 * - Fetches user from database
 * - Attaches userId and user object to request
 * - Handles both 'id' and 'userId' properties in JWT payload
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      console.log("No token in request");
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Verify the JWT token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified for user:", decoded.userId || decoded.id);
    // Extract userId from token payload (supports both 'userId' and 'id')
    const userId = decoded.userId || decoded.id;
    // Fetch user from the database
    const user = await User.findById(userId);
    if (!user) {
      // User not found in database
      console.log("User not found for token:", userId);
      return res.status(401).json({ message: "User not found" });
    }
    // Attach userId and user object to the request for downstream handlers
    req.userId = user._id.toString();
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle invalid or expired token errors
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
export default authMiddleware;