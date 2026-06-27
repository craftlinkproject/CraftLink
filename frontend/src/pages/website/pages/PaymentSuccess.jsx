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

  const verifyPaymentWithRetry = async (orderId) => {
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
        const res = await api.post(
          `/api/payment/verify-payment`,
          { orderId },
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
    const orderId = searchParams.get("orderId");
    if (orderId) {
      verifyPaymentWithRetry(orderId);
    }
  };

  const handleGoHome = () => {
    if (mountedRef.current) {
      navigate("/");
    }
  };

  useEffect(() => {
    const orderId = searchParams.get("orderId");
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

    verifyPaymentWithRetry(orderId);

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