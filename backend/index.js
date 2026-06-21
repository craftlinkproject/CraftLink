import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import authRouter from "./route/authRoute.js";
import userRouter from "./route/userRoute.js";
import courseRouter from "./route/courseRoute.js";
import paymentRouter from "./route/paymentRouter.js";
import withdrawRouter from "./route/withdrawRouter.js";
import messageRouter from "./route/messageRoute.js";
import postRouter from "./route/postRoute.js";
import paymentWebhook from "./route/paymentWebhook.js";
import searchRoutes from "./route/searchRoutes.js";
import supportRoutes from "./route/supportRoutes.js";
import { initializeSocket } from "./sockets/index.js";
const app = express();
const port = Number(process.env.PORT) || 8000;
app.use(express.json());
app.use(cookieParser());
import net from "net";

const socket = net.createConnection(587, "smtp.gmail.com");

socket.on("connect", () => {
  console.log("SMTP PORT OPEN");
});

socket.on("error", (err) => {
  console.log("SMTP BLOCKED:", err.message);
});
const allowedOrigins = [
  "http://localhost:5173",
  "https://craft-link-eta.vercel.app",
];

app.use(cors({
  origin: ["http://localhost:5173", "https://craft-link-eta.vercel.app"],
  credentials: true,
}));
app.set("trust proxy", 1);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/course", courseRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/payment", paymentWebhook);
app.use("/api/withdrawal", withdrawRouter);
app.use("/api/message", messageRouter);
app.use("/api/post", postRouter);
app.use("/api", searchRoutes);
app.use("/api/support", supportRoutes);
app.get("/", (req, res) => res.send("Server Running 🚀"));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});
app.set("io", io);
initializeSocket(io);
import Certificate from "./model/certificateModel.js";

const startServer = async () => {
  try {
    await connectDb();
    console.log("DB Connected");

    // Sync indexes: drop old user_1_course_1 index, keep user_1_course_1_language_1
    try {
      await Certificate.syncIndexes();
      console.log("Certificate indexes synced");
    } catch (idxErr) {
      console.error("Index sync error:", idxErr.message);
    }

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server Running On Port ${port}`);
    });
    const shutdown = async (signal) => {
      console.log(`Received ${signal}`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          process.exit(0);
        });
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("DB Failed", err);
    process.exit(1);
  }
};
startServer();