import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PopularCourses from "../../../components/PopularCourses";
import CourseCard from "../../../components/CourseCard";
import { BsStars, BsMicMute, BsLightbulb, BsRocket, BsArrowUpCircle } from "react-icons/bs";
import { HiMiniLanguage } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import { RiSparkling2Fill } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { api } from "@services/api";
import { getCategoryLabel, getCategoryId } from "../../../constants/categories";

const AICourseSearch = () => {
  const { i18n, t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = getCategoryId(searchParams.get("category") || "");
  const initialQuery = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [urlQuery, setUrlQuery] = useState(
    initialQuery && /^[a-zA-Z0-9\s]+$/.test(initialQuery) ? initialQuery : ""
  );
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [lang, setLang] = useState("auto");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isListening, setIsListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [searchMeta, setSearchMeta] = useState(null);
  const courses = useSelector((s) => Object.values(s.course.courseData));
  const debounceRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Standard Fuse for typed search (moderate threshold)
  const fuse = useMemo(
    () =>
      new Fuse(courses, {
        keys: [
          { name: "title", weight: 2 },
          { name: "subTitle", weight: 1 },
          { name: "description", weight: 0.8 },
          { name: "category", weight: 1.2 },
        ],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 2,
      }),
    [courses]
  );

  const categoryFiltered = useMemo(() => {
    if (!activeCategory) return courses;
    return courses.filter((c) => getCategoryId(c.category) === activeCategory);
  }, [courses, activeCategory]);

  const fuseResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fuse.search(searchTerm).map((r) => r.item);
  }, [searchTerm, fuse]);

  // Normalize backend result (may use _id or course_id)
  const normalizeResult = (r) => ({
    _id: r._id || r.course_id,
    title: r.title || "",
    subTitle: r.subTitle || "",
    description: r.description || "",
    category: r.category || "",
    level: r.level || "Beginner",
    price: r.price || 0,
    thumbnail: r.thumbnail || "",
    enrolledCount: r.enrolledCount || 0,
    creator: r.creator || { name: "", photoUrl: "" },
    lectures: r.lectures || [],
    reviews: r.reviews || [],
    _suggestion_reason: r.reason || null,
  });

  // Build display courses from backend results directly
  const semanticResults = useMemo(() => {
    if (!results.length || !searchMeta) return null;
    return results.map(normalizeResult);
  }, [results, searchMeta]);

  const suggestionCourses = useMemo(() => {
    if (!suggestions.length) return [];
    return suggestions.map(normalizeResult).filter((s) => s._id);
  }, [suggestions]);

  // Build display courses
  const displayCourses = useMemo(() => {
    if (searchTerm.trim()) {
      if (semanticResults?.length) return semanticResults;
      if (fuseResults.length) return fuseResults;
      return [];
    }
    if (activeCategory) return categoryFiltered;
    return courses;
  }, [searchTerm, semanticResults, fuseResults, activeCategory, categoryFiltered, courses]);

  const triggerSearch = useCallback(async (value) => {
    if (!value.trim()) {
      setResults([]);
      setSuggestions([]);
      setUrlQuery("");
      setSearchMeta(null);
      return;
    }
    try {
      const res = await api.post("/api/search", { query: value });
      const data = res.data;
      setResults(data.results || []);
      setSuggestions(data.suggestions || []);
      // Use English query for URL (keeps URLs clean, no Arabic chars)
      setUrlQuery(data.english_query || value);
      setSearchMeta({
        intent: data.intent,
        skills: data.skills_detected || [],
        categories: data.matched_categories || [],
        fallbackUsed: data.fallback_used,
        query: data.query,
        totalResults: data.total_results || 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => triggerSearch(value), 200);
    },
    [triggerSearch]
  );

  useEffect(() => {
    if (!initialQuery) return;
    triggerSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL (uses English-only urlQuery to avoid Arabic chars in URL)
  useEffect(() => {
    const params = {};
    if (urlQuery) params.q = urlQuery;
    if (activeCategory) params.category = activeCategory;
    setSearchParams(params, { replace: true });
  }, [activeCategory, urlQuery, setSearchParams]);

  const clearCategory = () => {
    setActiveCategory("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("category");
      return next;
    });
  };

  const getSpeechLang = useCallback(() => {
    if (lang === "ar") return "ar-EG";
    if (lang === "en") return "en-US";
    return i18n.language === "ar" ? "ar-EG" : "en-US";
  }, [lang, i18n.language]);

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setVoiceInterim("");
  }, []);

  const startVoiceSearch = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert(t("Voice search is not supported in your browser."));
      return;
    }

    if (isListening) {
      stopVoiceSearch();
      return;
    }

    const recognition = new SR();
    recognition.lang = getSpeechLang();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;
    setIsListening(true);
    setVoiceInterim("");

    let silenceTimer;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interimText += transcript;
        }
      }

      if (interimText) setVoiceInterim(interimText);

      const fullText = (finalText + interimText).trim();
      if (fullText) {
        setSearchTerm(fullText);
        handleSearch(fullText);
      }

      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (recognition) recognition.stop();
      }, 2000);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech") return;
      console.error("Voice error:", e.error);
      stopVoiceSearch();
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceInterim("");
      recognitionRef.current = null;
    };

    recognition.start();
  }, [isListening, t, handleSearch, stopVoiceSearch, getSpeechLang]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return (
    <div>
      <div className="full-width">
        <Header />
      </div>
      <div className="search-container">
        <div className="wavy"></div>
        <h2>{activeCategory ? getCategoryLabel(activeCategory, i18n.language) : t("Search")}</h2>

        {activeCategory && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={clearCategory}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid var(--main-color)",
                background: "rgba(37,99,235,0.08)",
                color: "var(--main-color)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("Category")}: {getCategoryLabel(activeCategory, i18n.language)}
              <IoClose style={{ fontSize: "1rem" }} />
            </button>
          </div>
        )}

        <div class="search-orb-container">
          <div class="gooey-background-layer">
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>
            <div class="blob-bridge"></div>
          </div>
          <div class="input-overlay">
            <div class="search-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={isListening && voiceInterim ? searchTerm + " " + voiceInterim : searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              class="modern-input"
              placeholder={isListening ? t("Listening...") : t("Search courses placeholder")}
            />
            <div className="btn-search-actions">
              <button
                onClick={startVoiceSearch}
                className="btn-search-voice"
                title={isListening ? t("Click to stop listening") : t("Voice search")}
                style={{
                  color: isListening ? "#ef4444" : "var(--text-secondary)",
                  animation: isListening ? "voice-pulse 1.2s ease-in-out infinite" : "none",
                  position: "relative",
                }}
              >
                {isListening ? <BsMicMute /> : <BsStars />}
                {isListening && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "10px",
                      height: "10px",
                      background: "#ef4444",
                      borderRadius: "50%",
                      animation: "voice-pulse 1s ease-in-out infinite",
                    }}
                  />
                )}
              </button>
              <div className="lang-dropdown">
                <button className="lang-active-btn">
                  <HiMiniLanguage />
                  {lang === "auto" ? t("Auto Detect") : lang === "ar" ? t("Arabic") : t("English")}
                </button>
                <div className="lang-menu">
                  <button onClick={() => setLang("auto")}>{t("Auto Detect")}</button>
                  <button onClick={() => setLang("ar")}>{t("Arabic")}</button>
                  <button onClick={() => setLang("en")}>{t("English")}</button>
                </div>
              </div>
            </div>
            <div class="focus-indicator"></div>
          </div>
          <svg class="gooey-svg-filter" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="enhanced-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"></feGaussianBlur>
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo"></feColorMatrix>
                <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Semantic search insight panel */}
        {searchMeta && searchMeta.query && (
          <div className="semantic-insight">
            <div className="semantic-insight-header">
              <RiSparkling2Fill className="semantic-icon" />
              <span>{t("AI understood")}: <strong>{searchMeta.query}</strong></span>
            </div>
            <div className="semantic-insight-body">
              {searchMeta.intent && (
                <span className="semantic-tag intent-tag">
                  <BsLightbulb /> {t("Intent")}: {searchMeta.intent}
                </span>
              )}
              {searchMeta.skills.length > 0 && (
                <div className="semantic-skills">
                  {searchMeta.skills.map((skill) => (
                    <span key={skill} className="semantic-tag skill-tag">
                      {skill.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              {searchMeta.fallbackUsed && (
                <span className="semantic-tag fallback-tag">
                  {t("Showing related categories")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Results */}
      {searchTerm.trim() && displayCourses.length === 0 && suggestionCourses.length === 0 && (
        <div className="no-results-container">
          <div className="no-results-icon">
            <BsRocket />
          </div>
          <h3>{t("No courses found")}</h3>
          <p>{t("Try a different search term or browse categories")}</p>
        </div>
      )}

      <PopularCourses
        courses={displayCourses}
        title={
          searchMeta?.intent
            ? t("Results for") + ' "' + searchMeta.query + '"'
            : activeCategory
              ? getCategoryLabel(activeCategory, i18n.language)
              : t("Results")
        }
        limit={12}
      />

      {/* Suggestions when results are few or none */}
      {suggestionCourses.length > 0 && (
        <section className="container-wrapper section-layout popular-courses">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BsArrowUpCircle style={{ color: "var(--main-color, #2563eb)" }} />
            {t("You might also like")}
          </h3>
          <div className="course-grid">
            {suggestionCourses.slice(0, 6).map((course) => {
              const totalSeconds = (course.lectures || []).reduce((acc, lec) => acc + (Number(lec?.duration) || 0), 0);
              const hh = Math.floor(totalSeconds / 3600);
              const mm = Math.floor((totalSeconds % 3600) / 60);
              const ss = Math.floor(totalSeconds % 60);
              let hours = "";
              if (hh > 0) hours += `${hh}h `;
              if (mm > 0) hours += `${mm}m `;
              if (ss > 0 || (!hh && !mm)) hours += `${ss}s`;
              if (!hours) hours = "0s";
              return (
                <div key={course._id} className="suggestion-card-wrapper">
                  <CourseCard
                    title={course.title}
                    image={course.thumbnail}
                    instructor={course.creator?.name}
                    hours={hours}
                    lectures={course.lectures?.length || 0}
                    level={course.level}
                    price={course.price}
                    tag={getCategoryId(course.category)}
                    courseId={course._id}
                    reviews={course.reviews}
                  />
                  {course._suggestion_reason === "popular" && (
                    <span className="suggestion-badge popular-badge">
                      <BsRocket /> {t("Popular choice")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Footer />

      <style>{`
        @keyframes voice-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .semantic-insight {
          max-width: 600px;
          margin: 16px auto 0;
          padding: 12px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(139,92,246,0.06));
          border: 1px solid rgba(37,99,235,0.15);
        }
        .semantic-insight-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary, #6b7280);
        }
        .semantic-insight-header strong {
          color: var(--text-primary, #111);
        }
        .semantic-icon {
          color: var(--main-color, #2563eb);
          font-size: 1rem;
        }
        .semantic-insight-body {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .semantic-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .intent-tag {
          background: rgba(37,99,235,0.1);
          color: var(--main-color, #2563eb);
          text-transform: capitalize;
        }
        .skill-tag {
          background: rgba(139,92,246,0.1);
          color: #7c3aed;
          text-transform: capitalize;
        }
        .fallback-tag {
          background: rgba(245,158,11,0.1);
          color: #d97706;
        }
        .no-results-container {
          text-align: center;
          padding: 48px 16px;
          color: var(--text-secondary, #6b7280);
        }
        .no-results-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .no-results-container h3 {
          margin: 0 0 8px;
          font-size: 1.2rem;
          color: var(--text-primary, #111);
        }
        .no-results-container p {
          margin: 0;
          font-size: 0.9rem;
        }
        .suggestion-card-wrapper {
          position: relative;
        }
        .suggestion-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          z-index: 2;
        }
        .popular-badge {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default AICourseSearch;
