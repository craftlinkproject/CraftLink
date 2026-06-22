import express from "express";
import Payment from "../model/paymentModel.js";
import Course from "../model/courseModel.js";
import User from "../model/userModel.js";
import { createNotification } from "../controller/notificationController.js";

const router = express.Router();

router.post("/paymob-webhook", async (req, res) => {
  try {
    const data = req.body;
    console.log("Paymob webhook received:", JSON.stringify(data, null, 2));

    if (data.success === true) {
      const orderId = data.order.id;
      const transactionId = data.id;

      // Find payment by orderId
      const payment = await Payment.findOne({ orderId: String(orderId) });
      if (!payment) {
        console.log("Payment not found for orderId:", orderId);
        return res.sendStatus(200);
      }

      // Update payment status
      payment.status = "success";
      payment.transactionId = String(transactionId);
      payment.paymentResponse = data;
      await payment.save();

      // Enroll user in course
      const io = req.app.get("io");
      const courseUpdate = await Course.findByIdAndUpdate(
        payment.course,
        { $addToSet: { enrolledCraftsmen: payment.user } },
        { new: true }
      );
      console.log("Course enrollment success:", courseUpdate ? "yes" : "no");

      const userUpdate = await User.findByIdAndUpdate(
        payment.user,
        { $addToSet: { enrolledCourses: payment.course } },
        { new: true }
      );
      console.log("User enrollment success:", userUpdate ? "yes" : "no");

      // Notify course creator
      if (courseUpdate?.creator) {
        const enrolledUser = await User.findById(payment.user).select("name");
        createNotification({
          recipient: courseUpdate.creator,
          type: "enrollment",
          title: "New Enrollment",
          message: `${enrolledUser?.name || "A user"} enrolled in your course "${courseUpdate.title}"`,
          link: `/course/${courseUpdate.slug || courseUpdate._id}`,
          actor: payment.user,
          io,
        });
      }

      console.log("Webhook processed successfully for orderId:", orderId);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

export default router;
