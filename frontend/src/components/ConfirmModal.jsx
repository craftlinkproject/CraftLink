import { useEffect } from "react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="withdrawal-modal"
      onClick={onClose}
      style={{ zIndex: 9999999 }}
    >
      <div
        className="withdrawal-content"
        style={{ padding: "24px", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: "12px", fontSize: "1.2rem" }}>
          {title || "Confirm"}
        </h3>
        <p style={{ marginBottom: "24px", color: "var(--text-muted)" }}>
          {message || "Are you sure?"}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              border: "1px solid var(--border-color, #ddd)",
              borderRadius: "8px",
              background: "var(--bg-color, #f5f5f5)",
              color: "var(--text-primary, #333)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {cancelText || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: "8px",
              background: "#e74c3c",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {confirmText || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
