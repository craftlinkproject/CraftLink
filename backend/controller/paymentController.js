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

let cachedToken = null;
let tokenExpiry = 0;

const getAuthToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  try {
    console.log("Requesting auth token from Paymob...");
    const res = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    cachedToken = res.data.token;
    tokenExpiry = Date.now() + 55 * 60 * 1000;
    console.log("Auth token received successfully, cached for 55 min");
    return cachedToken;
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
const verifyTransactionWithPaymob = async (transactionId) => {
  try {
    const authToken = await getAuthToken();
    const verifyRes = await axios.get(
      `${PAYMOB_API_URL}/acceptance/transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return { success: verifyRes.data.success === true, data: verifyRes.data };
  } catch (err) {
    console.error("verifyTransactionWithPaymob error:", err.message);
    return { success: false, data: null };
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId, transactionId } = req.body;

    console.log(`\n=== VERIFY PAYMENT [userId=${userId}, orderId=${orderId}, transactionId=${transactionId}] ===`);

    if (!orderId) {
      console.log("[verifyPayment] ✗ Missing orderId");
      return res.status(400).json({ success: false, message: "Missing orderId" });
    }

    const payment = await Payment.findOne({ orderId: String(orderId), user: userId });
    if (!payment) {
      console.log(`[verifyPayment] ✗ Payment not found for orderId=${orderId}, userId=${userId}`);
      return res.status(404).json({ success: false, message: "Payment not found or not authorized" });
    }

    console.log(`[verifyPayment] Found payment: id=${payment._id}, status="${payment.status}", amount=${payment.amount}, course=${payment.course}`);

    // PATH 1: Payment already marked success in DB (webhook/callback already fired)
    if (payment.status === "success") {
      console.log("[verifyPayment] PATH 1: payment.status === 'success' — already verified, enrolling...");
      try {
        await enrollUserInCourse(userId, payment.course, req.app.get("io"));
      } catch (enrollErr) {
        console.error("[verifyPayment] Enrollment error in PATH 1:", enrollErr);
      }
      return res.status(200).json({
        success: true,
        course: payment.course,
        orderId: payment.orderId,
        message: "Payment verified successfully"
      });
    }

    // PATH 2: Payment status is "paid" (set by verifyPaymobTransaction)
    if (["paid", "success"].includes(payment.status)) {
      console.log(`[verifyPayment] PATH 2: payment.status in ["paid","success"] — enrolling & crediting...`);
      await enrollUserInCourse(userId, payment.course, req.app.get("io"));

      const course = await Course.findById(payment.course).populate('creator');
      if (course?.creator?.role === 2) {
        await User.findByIdAndUpdate(course.creator._id,
          { $inc: { balance: payment.amount } },
          { new: true }
        );
        console.log(`[verifyPayment] Credited ${payment.amount} EGP to trainer ${course.creator._id}`);
      }

      return res.json({
        success: true,
        course: payment.course,
        orderId: payment.orderId,
        message: "Payment verified & enrollment complete"
      });
    }

    // PATH 3: Transaction ID provided by frontend (from Paymob redirect URL)
    if (transactionId) {
      console.log(`[verifyPayment] PATH 3: Verifying transactionId=${transactionId} directly with Paymob...`);
      const txnResult = await verifyTransactionWithPaymob(transactionId);
      console.log(`[verifyPayment] PATH 3 result:`, txnResult);
      if (txnResult.success) {
        console.log(`[verifyPayment] PATH 3: Transaction confirmed! Updating DB...`);
        payment.status = "success";
        payment.transactionId = String(transactionId);
        payment.paymentResponse = txnResult.data;
        await payment.save();
        console.log(`[verifyPayment] PATH 3: DB updated to success. Enrolling...`);

        try {
          await enrollUserInCourse(userId, payment.course, req.app.get("io"));
        } catch (enrollErr) {
          console.error("[verifyPayment] Enrollment error in PATH 3:", enrollErr);
        }

        const course = await Course.findById(payment.course).populate('creator');
        if (course?.creator?.role === 2) {
          await User.findByIdAndUpdate(course.creator._id,
            { $inc: { balance: payment.amount } },
            { new: true }
          );
        }

        return res.status(200).json({
          success: true,
          course: payment.course,
          orderId: payment.orderId,
          message: "Payment verified successfully via transaction"
        });
      }
      console.log(`[verifyPayment] PATH 3: Transaction verification failed, falling to PATH 4`);
    } else {
      console.log(`[verifyPayment] PATH 3: No transactionId provided (txn_id null in URL), skipping...`);
    }

    // PATH 4: Check Paymob order status API directly
    console.log(`[verifyPayment] PATH 4: Checking Paymob order status for orderId=${orderId}...`);
    try {
      const paymobStatus = await checkPaymobOrderStatus(orderId);
      console.log(`[verifyPayment] PATH 4: checkPaymobOrderStatus returned: "${paymobStatus}"`);

      if (paymobStatus && paymobStatus.toUpperCase() === "PAID") {
        console.log(`[verifyPayment] PATH 4: Paymob confirms PAID! Updating DB from "${payment.status}" to "success"...`);
        payment.status = "success";
        await payment.save();
        console.log(`[verifyPayment] PATH 4: DB updated. Enrolling...`);

        try {
          await enrollUserInCourse(userId, payment.course, req.app.get("io"));
        } catch (enrollErr) {
          console.error("[verifyPayment] Enrollment error in PATH 4:", enrollErr);
        }

        return res.status(200).json({
          success: true,
          course: payment.course,
          orderId: payment.orderId,
          message: "Payment verified successfully via Paymob"
        });
      }
      console.log(`[verifyPayment] PATH 4: Paymob did NOT confirm PAID (got "${paymobStatus}")`);
    } catch (paymobErr) {
      console.error(`[verifyPayment] PATH 4: checkPaymobOrderStatus threw:`, paymobErr.message);
      if (paymobErr.response) {
        console.error(`[verifyPayment] Paymob API error status:`, paymobErr.response.status);
        console.error(`[verifyPayment] Paymob API error data:`, JSON.stringify(paymobErr.response.data, null, 2));
      }

      // PATH 4a: Paymob API call failed — re-query DB (webhook may have fired during)
      console.log(`[verifyPayment] PATH 4a: Re-querying DB after Paymob error...`);
      const refreshed = await Payment.findOne({ orderId: String(orderId), user: userId });
      console.log(`[verifyPayment] PATH 4a: DB status after re-query: "${refreshed?.status}"`);
      if (refreshed && ["paid", "success"].includes(refreshed.status)) {
        console.log(`[verifyPayment] PATH 4a: DB was updated! Enrolling...`);
        try {
          await enrollUserInCourse(userId, refreshed.course, req.app.get("io"));
        } catch (enrollErr) {
          console.error("[verifyPayment] Enrollment error in PATH 4a:", enrollErr);
        }
        return res.status(200).json({
          success: true,
          course: refreshed.course,
          orderId: refreshed.orderId,
          message: "Payment verified successfully"
        });
      }
      console.log(`[verifyPayment] PATH 4a: DB still "${refreshed?.status}", continuing to PATH 5...`);
    }

    // PATH 5: Final DB re-query before giving up
    console.log(`[verifyPayment] PATH 5: Final DB re-query...`);
    const finalCheck = await Payment.findOne({ orderId: String(orderId), user: userId });
    console.log(`[verifyPayment] PATH 5: Final DB status: "${finalCheck?.status}"`);
    if (finalCheck && ["paid", "success"].includes(finalCheck.status)) {
      console.log(`[verifyPayment] PATH 5: DB was updated! Enrolling...`);
      try {
        await enrollUserInCourse(userId, finalCheck.course, req.app.get("io"));
      } catch (enrollErr) {
        console.error("[verifyPayment] Enrollment error in PATH 5:", enrollErr);
      }
      return res.status(200).json({
        success: true,
        course: finalCheck.course,
        orderId: finalCheck.orderId,
        message: "Payment verified successfully"
      });
    }

    // PATH 6: All verification methods exhausted
    console.log(`[verifyPayment] PATH 6: All verification methods exhausted. Returning pending.`);
    console.log(`[verifyPayment] === END VERIFY (FAILED) ===\n`);
    return res.status(200).json({
      success: false,
      course: (finalCheck || payment).course,
      status: (finalCheck || payment).status,
      message: "Payment not yet confirmed by Paymob. Please try again or contact support."
    });
  } catch (error) {
    console.error("[verifyPayment] UNEXPECTED ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

/* ================== CHECK PAYMOB ORDER STATUS ================== */
const checkPaymobOrderStatus = async (orderId) => {
  const doCheck = async () => {
    const authToken = await getAuthToken();
    console.log(`[checkPaymobOrderStatus] Querying Paymob order ${orderId}...`);
    const res = await axios.get(`${PAYMOB_API_URL}/ecommerce/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return res;
  };

  try {
    const res = await doCheck();

    // LOG THE FULL RESPONSE
    console.log("[checkPaymobOrderStatus] FULL Paymob response:", JSON.stringify(res.data, null, 2));
    console.log("[checkPaymobOrderStatus] payment_status:", res.data.payment_status);
    console.log("[checkPaymobOrderStatus] paid_amount_cents:", res.data.paid_amount_cents);
    console.log("[checkPaymobOrderStatus] is_paid:", res.data.is_paid);
    console.log("[checkPaymobOrderStatus] is_payment_locked:", res.data.is_payment_locked);
    console.log("[checkPaymobOrderStatus] all keys:", Object.keys(res.data).join(", "));

    const paymentStatus = res.data.payment_status;

    // Check ALL possible success values from Paymob
    if (paymentStatus) {
      const upper = paymentStatus.toUpperCase();
      console.log("[checkPaymobOrderStatus] normalized payment_status:", upper);
      if (["PAID", "SUCCESS", "CAPTURED", "COMPLETED"].includes(upper)) {
        console.log("[checkPaymobOrderStatus] ✓ Matched payment_status:", paymentStatus);
        return "PAID";
      }
    }

    // Fallback: paid_amount_cents > 0 means someone paid
    if (res.data.paid_amount_cents > 0) {
      console.log("[checkPaymobOrderStatus] ✓ paid_amount_cents > 0:", res.data.paid_amount_cents);
      return "PAID";
    }

    // Fallback: is_paid flag if present
    if (res.data.is_paid === true) {
      console.log("[checkPaymobOrderStatus] ✓ is_paid is true");
      return "PAID";
    }

    console.log("[checkPaymobOrderStatus] ✗ Payment NOT confirmed. Status:", paymentStatus, "paid_amount_cents:", res.data.paid_amount_cents);
    return paymentStatus || "PENDING";
  } catch (error) {
    console.error("[checkPaymobOrderStatus] ✗ Error:", error.message);
    if (error.response) {
      console.error("[checkPaymobOrderStatus] Response status:", error.response.status);
      console.error("[checkPaymobOrderStatus] Response data:", JSON.stringify(error.response.data, null, 2));
    }

    // If auth token expired/invalid, invalidate cache and retry ONCE with fresh token
    if (error.response && [401, 403].includes(error.response.status)) {
      console.log("[checkPaymobOrderStatus] Auth token invalid, refreshing and retrying...");
      cachedToken = null;
      tokenExpiry = 0;
      try {
        const res = await doCheck();
        console.log("[checkPaymobOrderStatus] Retry succeeded! Response:", JSON.stringify(res.data, null, 2));
        const paymentStatus = res.data.payment_status;
        if (paymentStatus && ["PAID", "SUCCESS", "CAPTURED", "COMPLETED"].includes(paymentStatus.toUpperCase())) return "PAID";
        if (res.data.paid_amount_cents > 0) return "PAID";
        if (res.data.is_paid === true) return "PAID";
        return paymentStatus || "PENDING";
      } catch (retryErr) {
        console.error("[checkPaymobOrderStatus] Retry also failed:", retryErr.message);
      }
    }

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
    console.log("\n=== PAYMENT CALLBACK RECEIVED ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(data, null, 2));
    console.log("Body keys:", Object.keys(data || {}).join(", "));
    console.log("data.success:", data?.success);
    console.log("data.order:", data?.order);
    console.log("data.id (txn):", data?.id);
    console.log("data.hmac:", data?.hmac);
    console.log("data.merchant_order_id:", data?.merchant_order_id);

    if (data.success === true) {
      const orderId = data.order?.id;
      const transactionId = data.id;
      console.log(`Callback: success=true, orderId="${orderId}", transactionId="${transactionId}"`);

      if (orderId) {
        const payment = await Payment.findOne({ orderId: String(orderId) });
        if (!payment) {
          console.log(`Callback: Payment NOT FOUND for orderId="${orderId}"`);
        } else {
          console.log(`Callback: Found payment, current status="${payment.status}"`);
          payment.status = "success";
          payment.transactionId = String(transactionId);
          payment.paymentResponse = data;
          await payment.save();
          console.log(`Callback: Payment "${orderId}" updated to "success" in DB`);

          await enrollUserInCourse(payment.user, payment.course, req.app.get("io"));

          try {
            const course = await Course.findById(payment.course).populate('creator');
            if (course?.creator?.role === 2) {
              await User.findByIdAndUpdate(course.creator._id,
                { $inc: { balance: payment.amount } },
                { new: true }
              );
              console.log(`Callback: Credited ${payment.amount} EGP to trainer ${course.creator._id}`);
            }
          } catch (balanceErr) {
            console.error("Callback: Error crediting trainer:", balanceErr);
          }

          console.log(`Callback: Successfully processed for orderId="${orderId}"`);
        }
      } else {
        console.log("Callback: No order.id in payload!");
      }
    } else {
      console.log(`Callback: success is NOT true (value=${data?.success}), ignoring...`);
    }

    console.log("=== END CALLBACK ===\n");
    res.sendStatus(200);
  } catch (error) {
    console.error("Callback error:", error);
    res.sendStatus(500);
  }
};
