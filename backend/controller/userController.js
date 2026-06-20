import User from "../model/userModel.js";
import Course from "../model/courseModel.js";
import Payment from "../model/paymentModel.js";
import Certificate from "../model/certificateModel.js";
import bcrypt from "bcryptjs";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not Found" })
    }
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: `GetCurrentUser error ${error}` })
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { description, name, photoUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { name, description, photoUrl },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `updateProfile error ${error}` });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Change password failed" });
  }
};

export const getPurchasedCourses = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }

    const payments = await Payment.find({ user: userId, status: { $in: ["success", "paid"] } }).populate(
      {
        path: "course",
        select: "title subTitle price thumbnail category level creator lecturesCount isPublished enrolledCraftsmen",
        populate: { path: "creator", select: "name photoUrl" },
      }
    );

    const courses = payments
      .filter((payment) => payment.course)
      .map((payment) => ({
        ...payment.course.toObject(),
        paidAmount: payment.amount,
        paymentId: payment._id,
        paymentAt: payment.createdAt,
      }))
      .sort((a, b) => new Date(b.paymentAt) - new Date(a.paymentAt));

    return res.status(200).json(courses || []);
  } catch (error) {
    console.error("getPurchasedCourses error:", error?.message || error);
    return res.status(500).json({ message: "Failed to load purchased courses" });
  }
};

// NEW: Get user balance endpoint for Profile display
export const getUserBalance = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("balance");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ success: true, balance: user.balance || 0 });
  } catch (error) {
    console.error("getUserBalance error:", error);
    res.status(500).json({ message: "Failed to get balance" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(q.trim(), "i");
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { description: regex },
      ],
    })
      .select("-password")
      .limit(20)
      .sort({ name: 1 });

    return res.status(200).json(users);
  } catch (error) {
    console.error("searchUsers error:", error);
    return res.status(500).json({ message: "Search failed" });
  }
};

export const getProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    if (!userId || !courseId) {
      return res.status(400).json({ message: "User ID and Course ID are required" });
    }

    const user = await User.findById(userId).select("progress");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const courseProgress = (user.progress && user.progress[courseId]) || {};
    return res.status(200).json(courseProgress);
  } catch (error) {
    console.error("getProgress error:", error?.message || error);
    return res.status(500).json({ message: "Failed to get progress" });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId, lectureId, secondsWatched } = req.body;

    if (!userId || !courseId || !lectureId || secondsWatched === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.progress) {
      user.progress = {};
    }

    if (!user.progress[courseId]) {
      user.progress[courseId] = {};
    }

    const currentWatched = user.progress[courseId][lectureId] || 0;

    // Only update if new time is greater (prevent seeking back)
    if (secondsWatched > currentWatched) {
      user.progress[courseId][lectureId] = secondsWatched;
      user.markModified("progress");
      await user.save();
    }

    return res.status(200).json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error("updateProgress error:", error?.message || error);
    return res.status(500).json({ message: "Failed to update progress" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Get user by id error",
      error: error.message,
    });
  }
};

// ==================== COURSE COMPLETION CERTIFICATES ====================

/**
 * Claim course completion certificates (Arabic + English) if progress >= 90%
 */
export const claimCertificate = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ message: "User ID and Course ID are required" });
    }

    // 1. Check if both certificates already exist
    const existingCerts = await Certificate.find({ user: userId, course: courseId });
    const hasAr = existingCerts.some(c => c.language === "ar");
    const hasEn = existingCerts.some(c => c.language === "en");

    if (hasAr && hasEn) {
      return res.status(200).json({
        message: "Certificates already claimed",
        certificates: existingCerts,
        alreadyClaimed: true,
      });
    }

    // 2. Fetch course and populated lectures
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lectures = course.lectures || [];
    if (lectures.length === 0) {
      return res.status(400).json({ message: "Course has no lectures" });
    }

    // 3. Fetch user progress
    const user = await User.findById(userId);
    const userProgress = user.progress?.[courseId] || {};

    let totalProgress = 0;
    lectures.forEach((lec) => {
      const watched = userProgress[lec._id.toString()] || 0;
      const total = lec.duration || 1;
      const pct = Math.min((watched / total) * 100, 100);
      totalProgress += pct;
    });

    const progressPercent = Math.round(totalProgress / lectures.length);

    // 4. Require at least 90% progress to claim certificate
    if (progressPercent < 90) {
      return res.status(400).json({
        message: `You must complete at least 90% of the course. Your current progress: ${progressPercent}%`,
      });
    }

    // 5. Generate shared certificate ID
    const randomChars = Math.random().toString(36).substr(2, 9).toUpperCase();
    const tsCode = Date.now().toString().slice(-4);
    const certificateId = `CL-CERT-${randomChars}-${tsCode}`;

    // 6. Create both certificates (Arabic + English)
    const languageOrder = ["ar", "en"];
    const certificates = [...existingCerts];

    for (const lang of languageOrder) {
      if (certificates.some(c => c.language === lang)) continue;

      const cert = new Certificate({
        certificateId,
        user: userId,
        course: courseId,
        language: lang,
      });

      try {
        await cert.save();
        await cert.populate({
          path: "course",
          select: "title category level thumbnail creator",
          populate: {
            path: "creator",
            select: "name",
          },
        });
        await cert.populate("user", "name photoUrl");
        certificates.push(cert);
      } catch (saveErr) {
        // If duplicate key error, the cert was already created by another request
        const existing = await Certificate.findOne({ user: userId, course: courseId, language: lang })
          .populate({
            path: "course",
            select: "title category level thumbnail creator",
            populate: { path: "creator", select: "name" },
          })
          .populate("user", "name photoUrl");
        if (existing) {
          certificates.push(existing);
        } else {
          throw saveErr;
        }
      }
    }

    return res.status(201).json({
      message: "Certificates successfully claimed!",
      certificates,
      alreadyClaimed: false,
    });
  } catch (error) {
    console.error("claimCertificate error:", error);
    return res.status(500).json({ message: error.message || "Failed to claim certificate" });
  }
};

/**
 * Get all certificates claimed by the authenticated user
 */
export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.userId;
    const certificates = await Certificate.find({ user: userId })
      .populate({
        path: "course",
        select: "title category level thumbnail creator",
        populate: {
          path: "creator",
          select: "name",
        },
      })
      .populate("user", "name photoUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json(certificates || []);
  } catch (error) {
    console.error("getUserCertificates error:", error);
    return res.status(500).json({ message: "Failed to load certificates" });
  }
};

/**
 * Validate / Fetch a certificate by its unique certificateId or MongoDB _id
 */
export const verifyCertificate = async (req, res) => {
  try {
    const { key } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(key);
    let query = {};
    if (isObjectId) {
      query = { $or: [{ _id: key }, { certificateId: key }] };
    } else {
      query = { certificateId: key };
    }

    const certificate = await Certificate.findOne(query)
      .populate({
        path: "course",
        select: "title category level thumbnail creator",
        populate: {
          path: "creator",
          select: "name",
        },
      })
      .populate("user", "name photoUrl role");

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found or invalid" });
    }

    return res.status(200).json({ valid: true, certificate });
  } catch (error) {
    console.error("verifyCertificate error:", error);
    return res.status(500).json({ message: "Failed to verify certificate" });
  }
};

/**
 * Get public certificates for a specific user ID
 */
export const getPublicCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const certificates = await Certificate.find({ user: id })
      .populate({
        path: "course",
        select: "title category level thumbnail creator",
        populate: {
          path: "creator",
          select: "name",
        },
      })
      .populate("user", "name photoUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json(certificates || []);
  } catch (error) {
    console.error("getPublicCertificates error:", error);
    return res.status(500).json({ message: "Failed to load public certificates" });
  }
};

