import express from "express";
import { chat, suggestions } from "../controller/supportController.js";

const router = express.Router();

router.post("/chat", chat);
router.get("/suggestions", suggestions);

export default router;
