import express from "express"
import rateLimit from "express-rate-limit"
import { googleLogin, googleSignUp, login, logOut, resetPassword, sendOTP, signUp, verifyOTP, adminLogin } from "../controller/authController.js"

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

const authRouter = express.Router()
authRouter.post("/signup", authLimiter, signUp)
authRouter.post("/login", authLimiter, login)
authRouter.post("/admin-login", authLimiter, adminLogin)
authRouter.get("/logout", logOut)
authRouter.post("/sendotp", authLimiter, sendOTP)
authRouter.post("/verifyotp", authLimiter, verifyOTP)
authRouter.post("/resetpassword", authLimiter, resetPassword)
authRouter.post("/googlesignup", authLimiter, googleSignUp)
authRouter.post("/googlelogin", authLimiter, googleLogin)

export default authRouter