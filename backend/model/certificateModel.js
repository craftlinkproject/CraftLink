import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    language: {
      type: String,
      enum: ["ar", "en"],
      default: "en",
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Allow one AR + one EN certificate per user per course
certificateSchema.index({ user: 1, course: 1, language: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
