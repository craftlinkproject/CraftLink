import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@services/api";
import { toast } from "react-toastify";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying");
  const [courseId, setCourseId] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const navigateTimeoutRef = useRef(null);

  const safeSetState = (setter, value) => {
    if (mountedRef.current) {
      setter(value);
    }
  };

  const verifyPaymentWithRetry = async (orderId, txnId) => {
    safeSetState(setLoading, true);
    safeSetState(setStatus, "verifying");

    const maxAttempts = 6;
    const delayMs = 2500;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxAttempts && mountedRef.current) {
      attempt += 1;
      if (attempt > 1) {
        await new Promise(resolve => {
          const timer = setTimeout(resolve, delayMs);
          const checkMounted = setInterval(() => {
            if (!mountedRef.current) {
              clearTimeout(timer);
              clearInterval(checkMounted);
              resolve();
            }
          }, 100);
        });
        if (!mountedRef.current) return;
      }

      try {
        const payload = { orderId };
        if (txnId) payload.transactionId = txnId;

        const res = await api.post(
          `/api/payment/verify-payment`,
          payload,
          { withCredentials: true }
        );

        if (!mountedRef.current) return;

        if (res.data.success) {
          safeSetState(setCourseId, res.data.course);
          safeSetState(setStatus, "success");
          toast.success("Payment successful! You now have access to the course.");
          safeSetState(setLoading, false);
          navigateTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              navigate(`/viewcourse/${res.data.course}`);
            }
          }, 2000);
          return;
        }

        lastError = res.data.message || "Payment verification failed";
        console.log(`Verify attempt ${attempt} failed:`, res.data);
      } catch (err) {
        lastError = err.response?.data?.message || err.message || "Failed to verify payment";
        console.error(`Verify attempt ${attempt} error:`, err);
      }
    }

    if (!mountedRef.current) return;

    safeSetState(setStatus, "failed");
    safeSetState(setError, lastError || "Payment verification failed after retrying.");
    toast.error("Payment could not be verified. You can retry or contact support.");
    safeSetState(setLoading, false);
  };

  const handleRetry = () => {
    const orderId = searchParams.get("orderId") || searchParams.get("order");
    const txnId = searchParams.get("txn_id");
    const paymobId = searchParams.get("id");
    const transactionId = txnId || paymobId;
    if (orderId) {
      verifyPaymentWithRetry(orderId, transactionId);
    }
  };

  const handleGoHome = () => {
    if (mountedRef.current) {
      navigate("/");
    }
  };

  useEffect(() => {
    console.log("=== PAYMENT SUCCESS PAGE LOADED ===");
    console.log("Full URL:", window.location.href);
    console.log("Full search:", window.location.search);

    const allParams = {};
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }
    console.log("All search params:", JSON.stringify(allParams, null, 2));

    const orderId = searchParams.get("orderId") || searchParams.get("order");
    const txnId = searchParams.get("txn_id");
    const paymobId = searchParams.get("id");
    const successParam = searchParams.get("success");
    const paymobError = searchParams.get("data.message");
    const errorOccurred = searchParams.get("error_occured");

    console.log("Extracted - orderId:", orderId,
      "txnId:", txnId, "paymobId:", paymobId,
      "success:", successParam, "error:", paymobError,
      "error_occured:", errorOccurred);
    console.log("================================");

    // If Paymob explicitly says success=false, the payment failed on Paymob's side
    if (successParam === "false" || errorOccurred === "true") {
      console.log("Paymob reports payment FAILED:", paymobError || "Unknown Paymob error");
      safeSetState(setStatus, "failed");
      safeSetState(setError, paymobError || "Payment declined by Paymob. Please try a different card.");
      toast.error("Payment failed: " + (paymobError || "Card declined"));
      safeSetState(setLoading, false);
      return;
    }

    if (!orderId) {
      safeSetState(setStatus, "failed");
      safeSetState(setError, "Invalid payment session - missing orderId");
      toast.error("Invalid payment session");
      safeSetState(setLoading, false);
      navigateTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) navigate("/");
      }, 3000);
      return;
    }

    // Paymob returns transaction ID as "id", not "txn_id"
    const transactionId = txnId || paymobId;
    console.log("Starting verifyPaymentWithRetry with:", { orderId, transactionId });
    verifyPaymentWithRetry(orderId, transactionId);

    return () => {
      mountedRef.current = false;
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, [searchParams, navigate]);

  return (
    <>
      <div className="full-width">
        <Header />
      </div>
      <div className="pay-container">
        <div className="pay-card">
          {status === "verifying" && (
            <>
              <div className="pay-spinner"></div>
              <h2 className="pay-title">Processing Payment</h2>
              <p className="pay-text">Please wait while we verify your payment...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="pay-icon success">✓</div>
              <h1 className="pay-title">Payment Successful!</h1>
              <p className="pay-text">
                Thank you for your purchase. You now have access to the course.
              </p>
              <p className="pay-small-text">Redirecting to course page...</p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="pay-icon error">✕</div>
              <h1 className="pay-title">Payment Verification Failed</h1>
              <p className="pay-text">
                {error || "We couldn't verify your payment."}
              </p>
              <div className="pay-actions">
                <button className="pay-btn retry" onClick={handleRetry} disabled={loading}>
                  {loading ? "Verifying..." : "Try Again"}
                </button>
                <button className="pay-btn home" onClick={handleGoHome}>
                  Go to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;