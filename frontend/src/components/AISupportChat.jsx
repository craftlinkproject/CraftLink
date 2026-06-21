import React, { useState, useEffect, useRef, useCallback } from "react";
import { VscRobot } from "react-icons/vsc";
import { IoSend } from "react-icons/io5";
import { RiChatSmile3Fill, RiCloseFill } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { api } from "@services/api";

const STORAGE_KEY = "ai_support_messages";

const AISupportChat = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { from, text, time: Date.now() }]);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setInput("");
    addMessage("user", msg);
    setLoading(true);

    try {
      const res = await api.post("/api/support/chat", { message: msg });
      addMessage("bot", res.data.reply);
    } catch {
      addMessage("bot", isRtl
        ? "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
        : "Sorry, a connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [input, addMessage, isRtl]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (label) => {
    sendMessage(label);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const suggestedQs = isRtl
    ? ["ما هي كرافت لينك؟", "كيفية إنشاء حساب", "البحث عن دورات", "كيف أصبح مدرباً؟"]
    : ["What is CraftLink?", "How to sign up", "Find courses", "Become an instructor"];

  return (
    <>
      <button
        className="aisupport-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="AI Support"
      >
        {open ? <RiCloseFill /> : <RiChatSmile3Fill />}
      </button>

      {open && (
        <div className="aisupport-container" dir={isRtl ? "rtl" : "ltr"}>
          <div className="aisupport-header">
            <div className="aisupport-header-left">
              <VscRobot className="aisupport-header-icon" />
              <div>
                <span className="aisupport-header-title">
                  {t("AI Support")}
                </span>
                <span className="aisupport-header-status">
                  {t("Online")}
                </span>
              </div>
            </div>
            <button className="aisupport-clear-btn" onClick={clearChat} title={t("Clear chat")}>
              {t("Clear")}
            </button>
          </div>

          <div className="aisupport-body">
            {messages.length === 0 && (
              <div className="aisupport-welcome">
                <VscRobot className="aisupport-welcome-icon" />
                <h4>{t("Hello! How can I help you?")}</h4>
                <p>{t("Ask me anything about CraftLink")}</p>
                <div className="aisupport-suggestions">
                  {suggestedQs.map((q, i) => (
                    <button key={i} className="aisupport-suggestion-btn" onClick={() => handleSuggestion(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`aisupport-msg ${msg.from}`}>
                {msg.from === "bot" && (
                  <div className="aisupport-msg-avatar">
                    <VscRobot />
                  </div>
                )}
                <div className="aisupport-msg-bubble">
                  <div className="aisupport-msg-text">{msg.text}</div>
                  <span className="aisupport-msg-time">
                    {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="aisupport-msg bot">
                <div className="aisupport-msg-avatar">
                  <VscRobot />
                </div>
                <div className="aisupport-msg-bubble aisupport-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="aisupport-footer">
            <input
              ref={inputRef}
              className="aisupport-input"
              placeholder={isRtl ? "اكتب رسالتك..." : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="aisupport-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <IoSend />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .aisupport-fab {
          position: fixed;
          bottom: 24px;
          ${isRtl ? "left" : "right"}: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--main-color, #2563eb);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
          z-index: 10001;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .aisupport-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.5);
        }

        .aisupport-container {
          position: fixed;
          bottom: 92px;
          ${isRtl ? "left" : "right"}: 24px;
          width: 380px;
          max-width: calc(100vw - 48px);
          height: 520px;
          max-height: calc(100vh - 140px);
          background: var(--surface-color, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
          z-index: 10001;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: aisupport-in 0.25s ease-out;
        }
        @keyframes aisupport-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .aisupport-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--main-color, #2563eb);
          color: #fff;
        }
        .aisupport-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .aisupport-header-icon {
          font-size: 1.4rem;
        }
        .aisupport-header-title {
          font-weight: 600;
          font-size: 0.95rem;
          display: block;
        }
        .aisupport-header-status {
          font-size: 0.7rem;
          opacity: 0.85;
          display: block;
        }
        .aisupport-clear-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .aisupport-clear-btn:hover {
          background: rgba(255,255,255,0.25);
        }

        .aisupport-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .aisupport-welcome {
          text-align: center;
          padding: 24px 12px;
          color: var(--text-secondary, #6b7280);
        }
        .aisupport-welcome-icon {
          font-size: 3rem;
          color: var(--main-color, #2563eb);
          opacity: 0.3;
          margin-bottom: 8px;
        }
        .aisupport-welcome h4 {
          margin: 0 0 4px;
          font-size: 1rem;
          color: var(--text-primary, #111);
        }
        .aisupport-welcome p {
          margin: 0 0 16px;
          font-size: 0.85rem;
        }
        .aisupport-suggestions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .aisupport-suggestion-btn {
          background: var(--nav-bg, #f3f4f6);
          border: 1px solid var(--border-color, #e5e7eb);
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.82rem;
          color: var(--text-primary, #111);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          text-align: ${isRtl ? "right" : "left"};
        }
        .aisupport-suggestion-btn:hover {
          background: var(--main-color, #2563eb);
          color: #fff;
          border-color: var(--main-color, #2563eb);
        }

        .aisupport-msg {
          display: flex;
          gap: 8px;
          max-width: 88%;
          align-items: flex-end;
        }
        .aisupport-msg.bot {
          align-self: flex-start;
        }
        .aisupport-msg.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .aisupport-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--nav-bg, #f3f4f6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: var(--text-muted, #9ca3af);
          flex-shrink: 0;
        }
        .aisupport-msg-bubble {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.88rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .aisupport-msg.bot .aisupport-msg-bubble {
          background: var(--nav-bg, #f3f4f6);
          color: var(--text-primary, #111);
          border-bottom-left-radius: 4px;
        }
        .aisupport-msg.user .aisupport-msg-bubble {
          background: var(--main-color, #2563eb);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .aisupport-msg-time {
          display: block;
          font-size: 0.65rem;
          opacity: 0.6;
          margin-top: 4px;
        }

        .aisupport-typing {
          padding: 12px 16px !important;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .aisupport-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted, #9ca3af);
          animation: aisupport-bounce 1.2s infinite;
        }
        .aisupport-typing span:nth-child(2) { animation-delay: 0.2s; }
        .aisupport-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes aisupport-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        .aisupport-footer {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          gap: 8px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }
        .aisupport-input {
          flex: 1;
          border: none;
          outline: none;
          background: var(--nav-bg, #f3f4f6);
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.88rem;
          color: var(--text-primary, #111);
          direction: ${isRtl ? "rtl" : "ltr"};
        }
        .aisupport-input::placeholder {
          color: var(--text-muted, #9ca3af);
        }
        .aisupport-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--main-color, #2563eb);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .aisupport-send-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .aisupport-send-btn:not(:disabled):hover {
          opacity: 0.9;
        }
      `}</style>
    </>
  );
};

export default AISupportChat;
