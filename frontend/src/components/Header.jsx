import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { api } from "@services/api";
import { useNotifications } from "../context/NotificationContext";
import NotificationDropdown from "./ui/NotificationDropdown";
import { MdSunny } from "react-icons/md";
import { RiMoonClearFill } from "react-icons/ri";
import { RiSearch2Line } from "react-icons/ri";
import { IoClose, IoNotifications } from "react-icons/io5";
import userAvatar from "../assets/img/userAvatar.jpg";
import logo from "../assets/CraftLink.svg";
import axios from 'axios';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import { toast } from 'react-toastify';

const ROLE_BADGE = {
  1: { bg: "rgba(212, 175, 55, 0.12)", color: "#b8860b", label: "Craftsman" },
  2: { bg: "rgba(37, 99, 235, 0.1)", color: "#2563eb", label: "Instructor" },
  3: { bg: "rgba(100, 116, 139, 0.1)", color: "var(--text-secondary)", label: "Client" },
};

const Header = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { userData } = useSelector(state => state.user);
  const { darkMode, setDarkMode } = useTheme();

  const { unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/user/search?q=${encodeURIComponent(value.trim())}`);
        setResults(res.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  const handleSelectUser = (userId) => {
    setShowDropdown(false);
    setQuery("");
    setResults([]);
    navigate(`/profile/${userId}`);
  };

  const toggleTheme = () => setDarkMode(prev => !prev);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <header>
      <div className="section-layout">
        <div className="logo pointer" onClick={() => navigate("/")}>
          <img src={logo} className="logo-CraftLink" alt="craftlink" />
          <h2>{t("craflink")}<span>.</span></h2>
        </div>

        {/* Persistent Search - logged in only */}
        {userData && (
        <div className="header-search" ref={searchRef}>
          <RiSearch2Line className="header-search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.trim() && setShowDropdown(true)}
            placeholder={t("Search users...")}
            className="header-search-input"
          />
          {query && (
            <button className="header-search-clear" onClick={handleClear}>
              <IoClose />
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <div className="header-search-dropdown">
              {loading && (
                <div className="header-search-loading">
                  <div className="header-search-spinner" />
                </div>
              )}
              {!loading && results.length === 0 && query.trim() && (
                <div className="header-search-empty">
                  {t("No users found")}
                </div>
              )}
              {!loading && results.length > 0 && (
                results.map((user) => {
                  const badge = ROLE_BADGE[user.role] || ROLE_BADGE[3];
                  return (
                    <div
                      key={user._id}
                      className="header-search-result"
                      onClick={() => handleSelectUser(user._id)}
                    >
                      <img
                        src={user.photoUrl || userAvatar}
                        alt={user.name}
                        className="header-search-result-avatar"
                      />
                      <div className="header-search-result-info">
                        <span className="header-search-result-name">{user.name}</span>
                        <span className="header-search-result-email">{user.email}</span>
                      </div>
                      <span
                        className="header-search-result-role"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {t(badge.label)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
        )}

        {userData && (
          <div className="header-notification-wrap">
            <div
              className="header-notification"
              onClick={() => setShowNotifications((p) => !p)}
              title={t("Notifications")}
            >
              <IoNotifications className="header-notification-icon" />
              {unreadCount > 0 && (
                <span className="header-notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <NotificationDropdown
              open={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        )}

        <ul>
          <li>
            {!userData ? (
              <span
                className="nav-link pointer"
                onClick={() => navigate("/signup")}
              >
                {t("join")}
              </span>
            ) : (
              <span
                className="nav-link pointer"
                onClick={() => navigate(`/profile/${userData._id}`)}
              >
                {t("profile")}
              </span>
            )}
          </li>

          <li>
            <span
              className="nav-link pointer"
              onClick={toggleLanguage}
            >
              {i18n.language === "en" ? "AR" : "EN"}
            </span>
          </li>

          <li>
            <span
              className="nav-link theme-toggle pointer"
              onClick={toggleTheme}
            >
              {darkMode ? <MdSunny /> : <RiMoonClearFill />}
            </span>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
