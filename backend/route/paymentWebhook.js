import express from "express";
import Payment from "../model/paymentModel.js";
import Course from "../model/courseModel.js";
import User from "../model/userModel.js";
import { createNotification } from "../controller/notificationController.js";

const router = express.Router();

router.post("/paymob-webhook", async (req, res) => {
  try {
    const data = req.body;
    console.log("\n=== PAYMOB WEBHOOK RECEIVED ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(data, null, 2));
    console.log("Body keys:", Object.keys(data || {}).join(", "));
    console.log("data.success:", data?.success);
    console.log("data.order:", data?.order);
    console.log("data.id (txn):", data?.id);
    console.log("data.hmac:", data?.hmac);
    console.log("data.type:", data?.type);

    if (data.success === true) {
      const orderId = data.order?.id;
      const transactionId = data.id;
      console.log(`Webhook: success=true, orderId="${orderId}", transactionId="${transactionId}"`);

      if (!orderId) {
        console.log("Webhook: No order.id in payload!");
        res.sendStatus(200);
        console.log("=== END WEBHOOK (no orderId) ===\n");
        return;
      }

      // Find payment by orderId
      const payment = await Payment.findOne({ orderId: String(orderId) });
      if (!payment) {
        console.log(`Webhook: Payment NOT FOUND for orderId="${orderId}"`);
        res.sendStatus(200);
        console.log("=== END WEBHOOK (payment not found) ===\n");
        return;
      }

      console.log(`Webhook: Found payment, current status="${payment.status}"`);

      // Update payment status
      payment.status = "success";
      payment.transactionId = String(transactionId);
      payment.paymentResponse = data;
      await payment.save();
      console.log(`Webhook: Payment "${orderId}" updated to "success" in DB`);

      // Enroll user in course
      const io = req.app.get("io");
      const courseUpdate = await Course.findByIdAndUpdate(
        payment.course,
        { $addToSet: { enrolledCraftsmen: payment.user } },
        { new: true }
      );
      console.log("Webhook: Course enrollment:", courseUpdate ? "yes" : "no");

      const userUpdate = await User.findByIdAndUpdate(
        payment.user,
        { $addToSet: { enrolledCourses: payment.course } },
        { new: true }
      );
      console.log("Webhook: User enrollment:", userUpdate ? "yes" : "no");

      // Notify course creator
      if (courseUpdate?.creator) {
        const enrolledUser = await User.findById(payment.user).select("name");
        const userName = enrolledUser?.name || "A user";
        const courseTitle = courseUpdate.title || "";
        createNotification({
          recipient: courseUpdate.creator,
          type: "enrollment",
          title: "New Enrollment",
          titleAr: "تسجيل جديد",
          message: `${userName} enrolled in your course "${courseTitle}"`,
          messageAr: `${userName} مسجل في كورس "${courseTitle}"`,
          link: `/course/${courseUpdate.slug || courseUpdate._id}`,
          actor: payment.user,
          io,
        });
      }

      console.log(`Webhook: Successfully processed for orderId="${orderId}"`);
    } else {
      console.log(`Webhook: success is NOT true (value=${data?.success}), ignoring...`);
    }

    console.log("=== END WEBHOOK ===\n");
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    console.log("=== END WEBHOOK (error) ===\n");
    res.sendStatus(500);
  }
});

export default router;
