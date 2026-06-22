import React, { useState } from "react";
import { useSelector } from "react-redux";
import { IoNotifications } from "react-icons/io5";
import userAvatar from "../../../assets/img/userAvatar.jpg";
import { RiSearchLine } from "@icons";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../context/NotificationContext";
import NotificationDropdown from "../../ui/NotificationDropdown";
function Nav({
  sidebarHide,
  setSidebarHide,
  searchShow,
  setSearchShow,
  darkMode,
  setDarkMode,
}) {
  const { userData: currentUser } = useSelector((state) => state.user);
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  return (
    <nav>
      <label className="hamburger">
        <input
          type="checkbox"
          checked={!sidebarHide}
          onChange={() => setSidebarHide(!sidebarHide)}
        />
        <svg viewBox="0 0 32 32">
          <path
            className="line line-top-bottom"
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          ></path>
          <path className="line" d="M7 16 27 16"></path>
        </svg>
      </label>
      <form className={searchShow ? "show" : ""}>
      </form>
      <input
        type="checkbox"
        id="switch-mode"
        hidden
        checked={darkMode}
        onChange={() => setDarkMode(!darkMode)}
      />
      <label htmlFor="switch-mode" className="switch-mode"></label>
      <span className="notification" onClick={() => setShowNotifications((p) => !p)}>
        <IoNotifications className="bx" />
        {unreadCount > 0 && <span className="num">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        <NotificationDropdown
          open={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </span>
      <button onClick={() => navigate("/profile")} className="profile">
        <img src={currentUser?.photoUrl || userAvatar} alt="profile" />
      </button>
    </nav>
  );
}

export default Nav;
