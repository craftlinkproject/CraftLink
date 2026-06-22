import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../context/NotificationContext";
import userAvatar from "../../assets/img/userAvatar.jpg";
import { IoNotifications, IoCheckmark, IoTrashOutline, IoClose } from "react-icons/io5";

const TYPE_ICONS = {
  enrollment: { label: "📚", color: "#4caf50" },
  review: { label: "⭐", color: "#ff9800" },
  like: { label: "❤️", color: "#e53935" },
  comment: { label: "💬", color: "#2196f3" },
  message: { label: "✉️", color: "#9c27b0" },
  course_update: { label: "🔄", color: "#00bcd4" },
  withdrawal: { label: "💰", color: "#795548" },
  system: { label: "🔔", color: "#607d8b" },
};

function NotificationDropdown({ open, onClose }) {
  const { notifications, unreadCount, markAsRead, deleteAllNotifications } = useNotifications();
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const navigate = useNavigate();
  const ref = useRef(null);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handleClose();
      }
    };
    if (open) {
      setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleClose = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n._id);
    if (n.link) navigate(n.link);
    handleClose();
  };

  if (!open) return null;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <div className="notification-overlay" onClick={handleClose} />
      <div
        ref={ref}
        className={`notification-dropdown ${animatingOut ? "closing" : ""}`}
      >
      <div className="notification-dropdown-header">
        <h3>{isAr ? "الإشعارات" : "Notifications"}</h3>
        <div className="notification-dropdown-actions">
          {notifications.length > 0 && (
            <button className="notification-action-btn" onClick={() => { deleteAllNotifications(); handleClose(); }} title="Remove all">
              <IoTrashOutline />
            </button>
          )}
          {unreadCount > 0 && (
            <button className="notification-action-btn" onClick={() => { markAsRead("all"); }}>
              <IoCheckmark />
            </button>
          )}
          <button className="notification-action-btn notification-close-btn" onClick={handleClose} title="Close">
            <IoClose />
          </button>
        </div>
      </div>
      <div className="notification-dropdown-body">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <IoNotifications className="notification-empty-icon" />
            <p>{isAr ? "لا توجد إشعارات" : "No notifications yet"}</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.system;
            return (
              <div
                key={n._id}
                className={`notification-item ${n.read ? "read" : "unread"}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="notification-item-avatar" style={{ background: meta.color + "1a" }}>
                  {n.actor?.photoUrl ? (
                    <img src={n.actor.photoUrl} alt="" />
                  ) : (
                    <span className="notification-item-emoji">{meta.label}</span>
                  )}
                </div>
                <div className="notification-item-content">
                  <p className="notification-item-title">{isAr && n.titleAr ? n.titleAr : n.title}</p>
                  <p className="notification-item-message">{isAr && n.messageAr ? n.messageAr : n.message}</p>
                  <span className="notification-item-time">{timeAgo(n.createdAt)}</span>
                </div>
                {!n.read && <span className="notification-item-dot" />}
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}

export default NotificationDropdown;
