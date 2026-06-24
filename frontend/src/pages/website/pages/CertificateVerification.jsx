import React, { useState } from "react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Header, Footer } from "@components";
import { api } from "@services/api";
import { RiSearch2Line, LuSearchX, IoClose, BsFillShieldLockFill } from "@icons";
import CertificateModal from "../../../components/CertificateModal";

const CertificateVerification = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const handleVerify = async () => {
    const key = searchTerm.trim();
    if (!key) return;

    setLoading(true);
    setError(null);
    setCertificate(null);
    setSearched(false);

    try {
      const res = await api.get(`/api/user/certificate/verify/${key}`);
      if (res.data?.certificate) {
        setCertificate(res.data.certificate);
        setError(null);
      } else {
        setError("notFound");
      }
    } catch {
      setError("notFound");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleVerify();
  };

  const handleClear = () => {
    setSearchTerm("");
    setCertificate(null);
    setError(null);
    setSearched(false);
  };

  return (
    <>
      <div className="full-width">
        <Header />
      </div>
      <div className="cert-verify-page" style={{
        minHeight: "calc(100vh - 160px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px 80px",
        background: "var(--bg-color)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Animated background particles */}
        <div style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: Math.random() * 6 + 2 + "px",
                height: Math.random() * 6 + 2 + "px",
                background: "rgba(212, 175, 55, 0.15)",
                borderRadius: "50%",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth: "720px",
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Shield Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(212,175,55,0.3)",
            }}
          >
            <BsFillShieldLockFill style={{ fontSize: "36px", color: "#d4af37" }} />
          </motion.div>

          {/* Title with gradient text effect */}
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 900,
            margin: "0 0 12px",
            background: "linear-gradient(135deg, #f5e6b8 0%, #d4af37 40%, #aa7c11 70%, #f5e6b8 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 3s ease-in-out infinite",
            letterSpacing: "-0.5px",
          }}>
            {t("Certificate Verification")}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              margin: "0 0 36px",
              lineHeight: 1.6,
              maxWidth: "520px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {t("Enter the certificate ID to verify its authenticity and view the certificate details.")}
          </motion.p>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: "flex",
              gap: "12px",
              maxWidth: "560px",
              margin: "0 auto 40px",
            }}
          >
            <div style={{
              flex: 1,
              position: "relative",
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("Enter Certificate ID")}
                style={{
                  width: "100%",
                  padding: "16px 48px 16px 20px",
                  borderRadius: "16px",
                  border: "2px solid rgba(255,255,255,0.1)",
                  background: "var(--input-bg)",
                  color: "var(--text-secondary)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--input-bg)";
                  e.target.style.background = "var(--input-bg)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--input-bg)";
                  e.target.style.background = "var(--input-bg)";
                }}
              />
              {searchTerm && (
                <button
                  onClick={handleClear}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    padding: "4px",
                    fontSize: "18px",
                  }}
                >
                  <IoClose />
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleVerify}
              disabled={loading || !searchTerm.trim()}
              style={{
                padding: "16px 32px",
                borderRadius: "16px",
                border: "none",
                background: !searchTerm.trim()
                  ? "linear-gradient(135deg, #444, #555)"
                  : "linear-gradient(135deg, #d4af37, #aa7c11)",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: !searchTerm.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                boxShadow: searchTerm.trim() ? "0 4px 20px rgba(212,175,55,0.3)" : "none",
              }}
            >
              {loading ? (
                <div className="spinner" style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : (
                <RiSearch2Line style={{ fontSize: "20px" }} />
              )}
              <span>{loading ? t("Verifying...") : t("Verify")}</span>
            </motion.button>
          </motion.div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {searched && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {error === "notFound" ? (
                  <div style={{
                    background: "rgba(255,77,77,0.1)",
                    border: "1px solid rgba(255,77,77,0.3)",
                    borderRadius: "20px",
                    padding: "40px",
                    textAlign: "center",
                  }}>
                    <LuSearchX style={{ fontSize: "48px", color: "#ff4d4d", marginBottom: "16px" }} />
                    <h3 style={{ color: "#ff6b6b", margin: "0 0 8px", fontSize: "1.4rem" }}>
                      {t("Certificate not found")}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.95rem" }}>
                      {t("The certificate ID you entered could not be verified. Please check and try again.")}
                    </p>
                  </div>
                ) : certificate ? (
                  <div style={{
                    background: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.25)",
                    borderRadius: "20px",
                    padding: "40px",
                    textAlign: "center",
                  }}>
                    {/* Success icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      style={{
                        width: "64px",
                        height: "64px",
                        margin: "0 auto 16px",
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>

                    <h3 style={{
                      color: "#22c55e",
                      margin: "0 0 4px",
                      fontSize: "1.4rem",
                      fontWeight: 800,
                    }}>
                      {t("Certificate is valid")}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 24px", fontSize: "0.9rem" }}>
                      {t("This certificate has been verified and is authentic.")}
                    </p>

                    {/* Certificate info cards */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                      textAlign: "left",
                    }}>
                      <InfoCard label={t("Certificate ID")} value={certificate.certificateId} />
                      <InfoCard label={t("Student Name")} value={certificate.user?.name || t("Student")} />
                      <InfoCard label={t("Course")} value={certificate.course?.title || "—"} />
                      <InfoCard label={t("Instructor")} value={certificate.course?.creator?.name || t("Certified Instructor")} />
                      <InfoCard label={t("Issue Date")} value={new Date(certificate.issueDate || certificate.createdAt).toLocaleDateString()} />
                      <InfoCard label={t("Status")} value={t("Verified")} highlight />
                    </div>

                    {/* View certificate button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCertModal(true)}
                      style={{
                        marginTop: "24px",
                        padding: "14px 32px",
                        borderRadius: "14px",
                        border: "2px solid rgba(212,175,55,0.4)",
                        background: "rgba(212,175,55,0.1)",
                        color: "#d4af37",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      🎓 {t("View Full Certificate")}
                    </motion.button>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        certificate={certificate}
      />

      {/* Keyframes for animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          50% { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

const InfoCard = ({ label, value, highlight }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: "14px 16px",
    border: highlight ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.06)",
  }}>
    <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
      {label}
    </p>
    <p style={{ margin: 0, fontSize: "0.95rem", color: highlight ? "#22c55e" : "rgba(255,255,255,0.85)", fontWeight: 600, wordBreak: "break-all" }}>
      {value}
    </p>
  </div>
);

export default CertificateVerification;
