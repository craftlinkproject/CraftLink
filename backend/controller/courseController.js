import uploadOnCloudinary from "../config/cloudinary.js";
import Course from "../model/courseModel.js";
import Lecture from "../model/LectureModel.js";
import User from "../model/userModel.js";
import Payment from "../model/paymentModel.js";
import Review from "../model/reviewModel.js";
import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";
/**
 * Create a new course
 * @param {object} req - Express request (body: title, subTitle, description, category, level, price, thumbnail)
 * @param {object} res - Express response
 */

export const createCourse = async (req, res) => {
  try {
    const { title, subTitle, description, category, level, price, thumbnail } =
      req.body;
    if (!title || !category) {
      return res
        .status(400)
        .json({ message: "Title and category are required" });
    }
    const course = await Course.create({
      title,
      subTitle,
      description,
      category,
      level,
      price: price ? Number(price) : 0,
      thumbnail: thumbnail || "",
      creator: req.userId,
    });
    return res.status(201).json(course);
  } catch (error) {
    console.error(
      "createCourse error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Failed to create course: ${error.message}` });
  }
};

/**
 * Get all published courses with lectures populated
 */
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate({ path: "lectures", strictPopulate: false })
      .populate({
        path: "creator",
        select: "name photoUrl",
        strictPopulate: false,
      })
      .populate({
        path: "reviews",
        select: "rating",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(courses || []);
  } catch (error) {
    console.error("getPublishedCourses full error:", error);
    return res
      .status(500)
      .json({ message: `Failed to get published courses: ${error.message}` });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isPublished } = req.body;

    const course = await Course.findById(courseId)
      .populate("lectures")
      .populate("creator", "name photoUrl");

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.creator._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (isPublished) {
      if (
        !course.title ||
        !course.description ||
        course.price === undefined ||
        course.price === null
      ) {
        return res
          .status(400)
          .json({ message: "Complete course details before publishing" });
      }

      if (!course.lectures || course.lectures.length === 0) {
        return res
          .status(400)
          .json({ message: "Add at least one lecture before publishing" });
      }
    }

    course.isPublished = isPublished;
    await course.save();

    const updatedCourse = await Course.findById(courseId)
      .populate("creator", "name photoUrl")
      .populate("lectures");

    return res.status(200).json(updatedCourse);
  } catch (error) {
    console.error("togglePublishCourse error:", error);
    return res.status(500).json({ message: "Failed to update publish status" });
  }
};
/**
 * Get all courses created by the authenticated user
 * Requires authMiddleware to set req.userId
 */
export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }
    const courses = await Course.find({ creator: userId })
      .select(
        "title subTitle description category level price thumbnail lecturesCount isPublished creator",
      )
      .populate("creator", "name photoUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json(courses || []);
  } catch (error) {
    console.error(
      "getCreatorCourses error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Failed to get creator courses: ${error.message}` });
  }
};

/**
 * Get a single course by ID
 */
export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const course = await Course.findById(courseId)
      .populate("creator", "name photoUrl description ")
      .populate("lectures")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name photoUrl role",
        },
      });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error("getCourseById error:", error.message);
    return res.status(500).json({
      message: `Failed to get course: ${error.message}`,
    });
  }
};
/**
 * Edit an existing course
 * Can upload thumbnail to Cloudinary if provided
 */
export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const {
      title,
      subTitle,
      description,
      category,
      level,
      isPublished,
      price,
      thumbnail: thumbnailFromBody,
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.creator.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this course" });
    }

    let thumbnail = course.thumbnail;

    if (thumbnailFromBody) {
      thumbnail = thumbnailFromBody;
    }

    const updateData = {};

    if (title) updateData.title = title;
    if (subTitle) updateData.subTitle = subTitle;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (level) updateData.level = level;
    if (price !== undefined) updateData.price = price;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    if (thumbnail) updateData.thumbnail = thumbnail;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true }
    ).populate("lectures");

    return res.status(200).json(updatedCourse);

  } catch (error) {
    console.error("editCourse error:", error);
    return res.status(500).json({
      message: `Failed to edit course: ${error.message}`,
    });
  }
};

/**
 * Delete a course by ID
 */
export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({ message: "Course removed successfully" });
  } catch (error) {
    console.error("removeCourse error:", error);
    return res.status(500).json({
      message: `Failed to delete course: ${error.message}`,
    });
  }
};

/**
 * Create a new lecture for a course
 * @param {object} req - Express request (params: courseId, body: lectureTitle, description, isPreviewFree, videoUrl)
 * @param {object} res - Express response
 */
export const createLecture = async (req, res) => {
  try {
    const { lectureTitle, description, isPreviewFree, videoUrl, duration } = req.body;
    const { courseId } = req.params;
    if (!lectureTitle) {
      return res.status(400).json({ message: "Lecture title is required" });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const lecture = await Lecture.create({
      lectureTitle,
      description: description || "",
      videoUrl: videoUrl || null,
      duration,
      isPreviewFree: isPreviewFree === "true" || isPreviewFree === true,
    });
    course.lectures.push(lecture._id);
    course.lecturesCount = course.lectures.length;
    await course.save();
    const populatedCourse =
      await Course.findById(courseId).populate("lectures");
    return res.status(201).json({
      message: "Lecture created successfully",
      lecture,
      lectures: populatedCourse.lectures,
    });
  } catch (error) {
    console.error(
      "createLecture error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Failed to create lecture: ${error.message}` });
  }
};

/**
 * Get all lectures for a course
 */
export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({
      lectures: course.lectures,
    });
  } catch (error) {
    console.error(
      "getCourseLecture error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Failed to get course lectures: ${error.message}` });
  }
};

/**
 * Edit an existing lecture
 */
export const editLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { lectureTitle, description, videoUrl, isPreviewFree, duration } = req.body;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }
    if (lectureTitle !== undefined) lecture.lectureTitle = lectureTitle;
    if (description !== undefined) lecture.description = description;
    if (videoUrl !== undefined) lecture.videoUrl = videoUrl;
    if (duration !== undefined) lecture.duration = duration;
    if (isPreviewFree !== undefined) lecture.isPreviewFree = isPreviewFree;
    await lecture.save();
    return res.status(200).json(lecture);
  } catch (error) {
    console.error(
      "editLecture error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Failed to edit lecture: ${error.message}` });
  }
};

/**
 * Delete a lecture by ID and remove from course
 */
export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const course = await Course.findOne({ lectures: lectureId });

    if (course) {
      course.lectures.pull(lectureId);
      course.lecturesCount = course.lectures.length;

      if (course.lectures.length === 0) {
        course.isPublished = false;
      }

      await course.save();
    }

    return res.status(200).json({ message: "Lecture removed successfully" });
  } catch (error) {
    console.error("removeLecture error:", error);
    return res.status(500).json({
      message: `Failed to remove lecture: ${error.message}`,
    });
  }
};
/**
 * Get creator information by user ID
 * Excludes password field
 */
export const getCreatorById = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(
      "getCreatorById error:",
      error && error.message ? error.message : error,
    );
    return res
      .status(500)
      .json({ message: `Failed to get creator: ${error.message}` });
  }
};
export const getInstructorCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const isOwner = req.userId === userId;

    const filter = { creator: userId };
    if (!isOwner) filter.isPublished = true;

    const courses = await Course.find(filter)
      .populate("creator", "name photoUrl")
      .select(
        "title subTitle description category enrolledCraftsmen level price thumbnail lectures isPublished creator enrolledCraftsmen"
      )
      .sort({ createdAt: -1 });

    const coursesWithLectureCount = courses.map((course) => ({
      ...course.toObject(),
      lecturesCount: course.lectures?.length || 0,
    }));

    res.status(200).json(coursesWithLectureCount);
  } catch (error) {
    console.error("getInstructorCourses error:", error);
    res.status(500).json({ message: "Failed to load instructor courses" });
  }
};

export const getInstructorSales = async (req, res) => {
  try {
    const instructorId = req.userId;

    if (!instructorId || !mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor user ID" });
    }

    const courses = await Course.find({ creator: instructorId }).select(
      "_id title price enrolledCraftsmen"
    );

    const courseIds = courses.map((course) => course._id);

    const payments = await Payment.find({
      course: { $in: courseIds },
      status: { $in: ["success", "paid"] },
    });

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0,
    );

    const totalBuyers = Array.from(
      new Set(payments.map((payment) => String(payment.user)))
    ).length;

    const totalCourses = courses.length;
    const totalCourseBuyers = courses.reduce(
      (sum, course) => sum + (course.enrolledCraftsmen?.length || 0),
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalBuyers,
        totalCourses,
        totalCourseBuyers,
      }
    });
  } catch (error) {
    console.error("getInstructorSales error:", error);
    res.status(500).json({ message: "Failed to load instructor sales" });
  }
};

/**
 * Get comments for a lecture
 */
export const getLectureComments = async (req, res) => {
  try {
    const { lectureId } = req.params;

    if (!lectureId || !mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({ message: "Invalid Lecture ID" });
    }

    const lecture = await Lecture.findById(lectureId)
      .select("comments")
      .populate("comments.userId", "name photoUrl");

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    return res.status(200).json(lecture.comments || []);
  } catch (error) {
    console.error("getLectureComments error:", error);
    return res.status(500).json({ message: "Failed to load comments" });
  }
};

/**
 * Add comment to a lecture
 */
export const addLectureComment = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!lectureId || !mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({ message: "Invalid Lecture ID" });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const newComment = {
      userId,
      photoUrl: user.photoUrl,
      userName: user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    lecture.comments.push(newComment);
    await lecture.save();

    return res.status(201).json(newComment);
  } catch (error) {
    console.error("addLectureComment error:", error);
    return res.status(500).json({ message: "Failed to add comment" });
  }
};

/**
 * Add or update review for a course
 */
export const addCourseReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid Course ID" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user already reviewed this course
    let review = await Review.findOne({ user: userId, course: courseId });
    let isNewReview = false;

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment.trim();
      await review.save();
    } else {
      isNewReview = true;
      // Create new review
      review = await Review.create({
        user: userId,
        course: courseId,
        rating,
        comment: comment.trim(),
      });

      // Add review to course if it's not already there
      if (!course.reviews.includes(review._id)) {
        course.reviews.push(review._id);
        await course.save();
      }
    }

    // Populate user info for the returned review
    const populatedReview = await Review.findById(review._id).populate("user", "name photoUrl role");

    // Notify course creator on new review
    if (isNewReview && course.creator.toString() !== userId) {
      const io = req.app.get("io");
      createNotification({
        recipient: course.creator,
        type: "review",
        title: "New Review",
        titleAr: "تقييم جديد",
        message: `${populatedReview.user.name} left a ${rating}-star review on your course "${course.title}"`,
        messageAr: `${populatedReview.user.name} ترك تقييم ${rating} نجوم على كورس "${course.title}"`,
        link: `/course/${course.slug || course._id}`,
        actor: userId,
        io,
      });
    }

    return res.status(200).json({
      message: "Review submitted successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("addCourseReview error:", error);
    return res.status(500).json({ message: `Failed to submit review: ${error.message}` });
  }
};

/**
 * Get reviews for a course
 */
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid Course ID" });
    }

    const reviews = await Review.find({ course: courseId })
      .populate("user", "name photoUrl role")
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("getCourseReviews error:", error);
    return res.status(500).json({ message: "Failed to load course reviews" });
  }
};