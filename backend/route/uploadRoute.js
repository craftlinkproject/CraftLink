import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/video", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "craftlink/video" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    res.json({ url: result.secure_url, duration: result.duration });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: "Upload failed" });
  }
});

export default router;
