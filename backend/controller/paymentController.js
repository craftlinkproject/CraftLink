// backend/controller/paymentController.js
import axios from "axios";
import Course from "../model/courseModel.js";
import User from "../model/userModel.js";
import Payment from "../model/paymentModel.js";
import Notification from "../model/NotificationModel.js";
import { createNotification } from "./notificationController.js";


const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = Number(process.env.PAYMOB_INTEGRATION_ID);
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || "https://craft-link-platform.vercel.app";

/* ================== HELPER FUNCTION ================== */
const enrollUserInCourse = async (userId, courseId, io) => {
  try {
    // Add user to course's enrolledCraftsmen
    const courseUpdate = await Course.findByIdAndUpdate(
      courseId,
      { $addToSet: { enrolledCraftsmen: userId } },
      { new: true }
    );
    console.log("Course enrollment success:", courseUpdate ? "yes" : "no");

    // Add course to user's enrolledCourses (if field exists)
    if (true) {
      const userUpdate = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledCourses: courseId } },
        { new: true }
      );
      console.log("User enrollment success:", userUpdate ? "yes" : "no");
    }

    // Notify course creator
    if (courseUpdate?.creator) {
      const enrolledUser = await User.findById(userId).select("name");
      const userName = enrolledUser?.name || "A user";
      const courseTitle = courseUpdate.title || "";
      await createNotification({
        recipient: courseUpdate.creator,
        type: "enrollment",
        title: "New Enrollment",
        titleAr: "تسجيل جديد",
        message: `${userName} enrolled in your course "${courseTitle}"`,
        messageAr: `${userName} مسجل في كورس "${courseTitle}"`,
        link: `/course/${courseUpdate.slug || courseUpdate._id}`,
        actor: userId,
        io,
      });
    }
  } catch (err) {
    console.error("Error in enrollUserInCourse:", err);
    throw err;
  }
};

/* ================== CREATE PAYMENT ================== */

const getAuthToken = async () => {
  try {
    console.log("Requesting auth token from Paymob...");
    const res = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    console.log("Auth token received successfully");
    return res.data.token;
  } catch (err) {
    console.error("getAuthToken error:", err.response?.status, err.response?.data || err.message);
    throw err;
  }
};

const createOrder = async (authToken, amount, userId, courseId) => {
  try {
    console.log("Creating order with amount:", amount, "cents:", amount * 100);
    const res = await axios.post(`${PAYMOB_API_URL}/ecommerce/orders`, {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amount * 100,
      currency: "EGP",
      items: [],
      metadata: { userId, courseId },
    });
    console.log("Order created successfully, ID:", res.data.id);
    return res.data.id;
  } catch (err) {
    console.error("createOrder error:", err.response?.status, err.response?.data || err.message);
    throw err;
  }
};

const createPaymentKey = async (authToken, orderId, amount) => {
  try {
    const redirectUrl = `${FRONTEND_URL}/payment-success?orderId=${orderId}`;
    console.log("Creating payment key with redirect URL:", redirectUrl);
    const res = await axios.post(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
      auth_token: authToken,
      amount_cents: amount * 100,
      expiration: 3600,
      order_id: orderId,
      currency: "EGP",
      integration_id: PAYMOB_INTEGRATION_ID,
      billing_data: {
        first_name: "Test",
        last_name: "User",
        email: "test@test.com",
        phone_number: "01000000000",
        country: "EG",
        city: "Cairo",
        street: "Test Street",
        building: "1",
        floor: "1",
        apartment: "1",
      },
      redirect_url: redirectUrl,
    });
    console.log("Payment key created successfully");
    return res.data.token;
  } catch (err) {
    console.error("createPaymentKey error:", err.response?.status, err.response?.data || err.message);
    throw err;
  }
};

const getOrderStatusFromPaymob = async (orderId) => {
  const authToken = await getAuthToken();
  const res = await axios.get(`${PAYMOB_API_URL}/ecommerce/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return res.data;
};
export const createPayment = async (req, res) => {
  try {
    const userId = req.userId; // Get from authMiddleware, not body
    const { amount, courseId } = req.body;

    console.log("=== CREATE PAYMENT REQUEST ===");
    console.log("userId:", userId);
    console.log("amount:", amount);
    console.log("courseId:", courseId);
    console.log("from request body:", req.body);

    if (!userId) {
      return res.status(400).json({ success: false, message: "Authentication required - userId not found" });
    }

    if (!amount || !courseId) {
      return res.status(400).json({ success: false, message: "Missing amount or courseId" });
    }

    // Validate amount and courseId types
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    try {
      const authToken = await getAuthToken();
      console.log("Auth token obtained");

      const orderId = await createOrder(authToken, amount, userId, courseId);
      console.log("Order created with ID:", orderId);

      const paymentKey = await createPaymentKey(authToken, orderId, amount);
      console.log("Payment key obtained");

      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

      const payment = await Payment.create({
        user: userId,
        course: courseId,
        amount,
        orderId: String(orderId),
        status: "pending",
      });

      console.log("Payment record created in DB - orderId:", String(orderId), "userId:", userId, "courseId:", courseId);

      res.json({ success: true, iframeUrl, orderId: String(orderId) });
    } catch (paymobErr) {
      console.error("Paymob API error:", paymobErr.response?.status, paymobErr.response?.data || paymobErr.message);
      res.status(paymobErr.response?.status || 500).json({
        success: false,
        message: paymobErr.response?.data?.message || paymobErr.message || "Payment creation failed",
        details: paymobErr.response?.data
      });
    }
  } catch (err) {
    console.error("createPayment error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Payment creation failed" });
  }
};

/* ================== VERIFY PAYMENT & AUTO-ENROLL ================== */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Missing orderId" });
    }

    const payment = await Payment.findOne({ orderId: String(orderId), user: userId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found or not authorized" });
    }

    // If payment is already marked as success (e.g., from webhook), return success immediately
    if (payment.status === "success") {
      // Ensure user is enrolled
      try {
        await enrollUserInCourse(userId, payment.course, req.app.get("io"));
      } catch (enrollErr) {
        console.error("Enrollment error in verifyPayment (success status):", enrollErr);
      }
      return res.status(200).json({
        success: true,
        course: payment.course,
        orderId: payment.orderId,
        message: "Payment verified successfully"
      });
    }

    // If payment is success/paid, enroll + credit + return success
    if (["paid", "success"].includes(payment.status)) {
      // Ensure enrollment
      await enrollUserInCourse(userId, payment.course, req.app.get("io"));

      // Credit trainer if not already (idempotent)
      const course = await Course.findById(payment.course).populate('creator');
      if (course?.creator?.role === 2) {
        await User.findByIdAndUpdate(course.creator._id,
          { $inc: { balance: payment.amount } },
          { new: true }
        );
        console.log(`✅ Credited ${payment.amount} EGP to trainer ${course.creator._id}`);
      }

      return res.json({
        success: true,
        course: payment.course,
        orderId: payment.orderId,
        message: "Payment verified & enrollment complete"
      });
    }



    // Payment is still pending in DB, check Paymob directly as fallback
    try {
      console.log("Payment still pending in DB, checking Paymob directly...");
      const paymobStatus = await checkPaymobOrderStatus(orderId);

      if (paymobStatus === "PAID") {
        console.log("Paymob confirms payment is PAID, updating database...");

        // Update payment status in database
        payment.status = "success";
        await payment.save();

        // Enroll user in course
        try {
          await enrollUserInCourse(userId, payment.course, req.app.get("io"));
        } catch (enrollErr) {
          console.error("Enrollment error in verifyPayment:", enrollErr);
          // Don't fail if enrollment has issues - payment is still successful
        }

        return res.status(200).json({
          success: true,
          course: payment.course,
          orderId: payment.orderId,
          message: "Payment verified successfully via Paymob"
        });
      }
    } catch (paymobErr) {
      console.error("Error checking Paymob status:", paymobErr);
      // Re-query payment from DB - webhook may have updated it during Paymob check
      const refreshed = await Payment.findOne({ orderId: String(orderId), user: userId });
      if (refreshed && ["paid", "success"].includes(refreshed.status)) {
        try {
          await enrollUserInCourse(userId, refreshed.course, req.app.get("io"));
        } catch (enrollErr) {
          console.error("Enrollment error in verifyPayment (catch success):", enrollErr);
        }
        return res.status(200).json({
          success: true,
          course: refreshed.course,
          orderId: refreshed.orderId,
          message: "Payment verified successfully"
        });
      }
    }

    // Final re-query before giving up - webhook may have fired during processing
    const finalCheck = await Payment.findOne({ orderId: String(orderId), user: userId });
    if (finalCheck && ["paid", "success"].includes(finalCheck.status)) {
      try {
        await enrollUserInCourse(userId, finalCheck.course, req.app.get("io"));
      } catch (enrollErr) {
        console.error("Enrollment error in verifyPayment (final check):", enrollErr);
      }
      return res.status(200).json({
        success: true,
        course: finalCheck.course,
        orderId: finalCheck.orderId,
        message: "Payment verified successfully"
      });
    }

    return res.status(200).json({
      success: false,
      course: (finalCheck || payment).course,
      status: (finalCheck || payment).status,
      message: "Payment not yet confirmed by Paymob. Please try again or contact support."
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

/* ================== CHECK PAYMOB ORDER STATUS ================== */
const checkPaymobOrderStatus = async (orderId) => {
  try {
    const authToken = await getAuthToken();
    const res = await axios.get(`${PAYMOB_API_URL}/ecommerce/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("Paymob order status response:", res.data.payment_status);
    return res.data.payment_status; // "PAID", "PENDING", etc.
  } catch (error) {
    console.error("Error checking Paymob order status:", error);
    throw error;
  }
};

/* ================== VERIFY PAYMOB TRANSACTION ================== */
export const verifyPaymobTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;
    console.log("Verifying Paymob transaction:", transactionId);

    if (!transactionId) {
      return res.status(400).json({ success: false, message: "Transaction ID required" });
    }

    // Query Paymob API to verify transaction
    const authToken = await getAuthToken();
    try {
      const verifyRes = await axios.get(
        `${PAYMOB_API_URL}/acceptance/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      const transaction = verifyRes.data;
      console.log("Paymob transaction response:", JSON.stringify(transaction, null, 2));

      if (transaction.success) {
        // Find payment by transactionId and update it
        let payment = await Payment.findOneAndUpdate(
          { transactionId: String(transactionId) },
          {
            status: "success",
            paymentResponse: transaction,
            transactionId: String(transactionId)
          },
          { new: true }
        );

        // Credit trainer if payment found
        if (payment) {
          try {
            const course = await Course.findById(payment.course).populate('creator');
            if (course?.creator?.role === 2) {
              await User.findByIdAndUpdate(course.creator._id,
                { $inc: { balance: payment.amount } },
                { new: true }
              );
              console.log(`Credited ${payment.amount} EGP to trainer ${course.creator._id} (transaction)`);
            }
          } catch (balanceErr) {
            console.error("Error crediting trainer balance (transaction):", balanceErr);
          }
        }


        // If not found by transactionId, try searching by embedded transactionId in metadata
        if (!payment && transaction.order && transaction.order.id) {
          payment = await Payment.findOneAndUpdate(
            { orderId: String(transaction.order.id) },
            {
              status: "paid",
              paymentResponse: transaction,
              transactionId: String(transactionId)
            },
            { new: true }
          );
        }

        if (payment) {
          console.log("Payment found and updated");
          // Enroll user in course
          try {
            await enrollUserInCourse(payment.user, payment.course, req.app.get("io"));
          } catch (enrollErr) {
            console.error("Error during enrollment:", enrollErr);
          }

          return res.json({ success: true, message: "Payment verified successfully" });
        } else {
          console.log("Payment record not found in database");
          return res.status(404).json({ success: false, message: "Payment not found in database" });
        }
      }

      res.status(400).json({ success: false, message: "Transaction not successful" });
    } catch (paymobErr) {
      console.error("Paymob verification error:", paymobErr.message);
      res.status(500).json({ success: false, message: "Failed to verify with Paymob" });
    }
  } catch (error) {
    console.error("Verify transaction error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================== GET PAYMENT STATUS ================== */
export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    console.log("Checking payment status - orderId:", orderId, "userId:", userId);

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const payment = await Payment.findOne({ orderId: String(orderId), user: userId });

    if (!payment) {
      console.log("Payment not found in DB");
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    console.log("Payment found - status:", payment.status);

    res.json({
      success: true,
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        course: payment.course,
        createdAt: payment.createdAt,
      }
    });
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    res.status(500).json({ success: false, message: "Failed to get payment status" });
  }
};

/* ================== PAYMENT CALLBACK ================== */
export const paymentCallback = async (req, res) => {
  try {
    const data = req.body;
    console.log("Payment callback received:", JSON.stringify(data, null, 2));

    // Similar logic to webhook
    if (data.success === true) {
      const orderId = data.order.id;
      const transactionId = data.id;

      const payment = await Payment.findOne({ orderId: String(orderId) });
      if (!payment) {
        console.log("Payment not found for orderId:", orderId);
        return res.sendStatus(200);
      }

      payment.status = "success";
      payment.transactionId = String(transactionId);
      payment.paymentResponse = data;
      await payment.save();

      await enrollUserInCourse(payment.user, payment.course, req.app.get("io"));

      // Credit trainer balance
      try {
        const course = await Course.findById(payment.course).populate('creator');
        if (course?.creator?.role === 2) {
          await User.findByIdAndUpdate(course.creator._id,
            { $inc: { balance: payment.amount } },
            { new: true }
          );
          console.log(`Credited ${payment.amount} EGP to trainer ${course.creator._id} (callback)`);
        }
      } catch (balanceErr) {
        console.error("Error crediting trainer balance (callback):", balanceErr);
      }

      console.log("Callback processed successfully for orderId:", orderId);
    }


    res.sendStatus(200);
  } catch (error) {
    console.error("Callback error:", error);
    res.sendStatus(500);
  }
};
