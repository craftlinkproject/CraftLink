import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Carpentry from "../../../assets/img/cat1.jpg";
import userAvatar from "../../../assets/img/userAvatar.jpg";
import { FaPlay, FaStar } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";

import { BsFillInfoCircleFill } from "react-icons/bs";
import { PiMonitorPlayFill } from "react-icons/pi";
import { MdReviews } from "react-icons/md";
import { PiUserCircleDashedFill } from "react-icons/pi";
import TestimonialsSwiper from "../../../components/TestimonialsSwiper";
import { getCategoryLabel, getCategoryId } from "../../../constants/categories";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@services/api";
import axios from "axios";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
const tabs = [
  { id: "Overview", icon: BsFillInfoCircleFill, text: "Overview" },
  { id: "Curriculum", icon: PiMonitorPlayFill, text: "Curriculum" },
  { id: "Reviews", icon: MdReviews, text: "Reviews" },
  { id: "Instructor", icon: PiUserCircleDashedFill, text: "Instructor" },
];
const ViewCourse = () => {
  const { courseId } = useParams();
  const { i18n, t } = useTranslation();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const { userData } = useSelector(state => state.user);
  const [paymentIframeUrl, setPaymentIframeUrl] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const [reviewsList, setReviewsList] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (course) {
      setReviewsList(course.reviews || []);
    }
  }, [course]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingReview(true);
      const { data } = await api.post(`/api/course/${courseId}/reviews`, {
        rating: newRating,
        comment: newComment,
      });

      setReviewsList((prev) => {
        const exists = prev.some((r) => r._id === data.review._id || r.user?._id === userData?._id);
        if (exists) {
          return prev.map((r) => (r._id === data.review._id || r.user?._id === userData?._id ? data.review : r));
        } else {
          return [data.review, ...prev];
        }
      });

      setCourse((prev) => {
        if (!prev) return prev;
        const exists = prev.reviews?.some((r) => r._id === data.review._id || r.user?._id === userData?._id);
        const updatedReviews = exists
          ? prev.reviews.map((r) => (r._id === data.review._id || r.user?._id === userData?._id ? data.review : r))
          : [data.review, ...(prev.reviews || [])];
        return {
          ...prev,
          reviews: updatedReviews,
        };
      });

      setNewComment("");
      alert(t("Review submitted successfully!"));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t("Failed to submit review"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`star-icon-small ${star <= rating ? "filled" : "empty"}`}
            style={{ color: star <= rating ? "#ffc107" : "#e4e5e9", marginRight: "2px" }}
          />
        ))}
      </div>
    );
  };

  const renderStarRatingInput = () => {
    return (
      <div className="star-rating-input" style={{ display: "flex", gap: "5px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`star-icon-input ${star <= (hoveredRating || newRating) ? "filled" : "empty"}`}
            onClick={() => setNewRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            size={28}
            style={{
              cursor: "pointer",
              transition: "color 0.2s ease, transform 0.1s ease",
              color: star <= (hoveredRating || newRating) ? "#ffc107" : "#e4e5e9"
            }}
          />
        ))}
      </div>
    );
  };

  const reviewsCount = reviewsList?.length || 0;
  const averageRating = reviewsCount > 0
    ? (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
    : 0;

  const renderAverageStars = (avgRating) => {
    const roundedRating = Math.round(avgRating || 5);
    return (
      <span className="stars" style={{ display: "inline-flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar key={star} className={star <= roundedRating ? "filled" : "empty"} style={{ color: star <= roundedRating ? "#ffc107" : "#e4e5e9" }} />
        ))}
      </span>
    );
  };

  useEffect(() => {
    if (course && userData) {
      setIsEnrolled(
        course.enrolledCraftsmen?.some(
          id => id.toString() === userData._id.toString()
        )
      );
      console.log("userData:", userData);
      console.log("course enrolled:", course?.enrolledCraftsmen);
    }
  }, [course, userData]);
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/api/course/getcourse/${courseId}`);
        setCourse(data);

        const firstFree = data.lectures?.find(l => l.isPreviewFree);
        if (firstFree) {
          setCurrentVideo(firstFree.videoUrl);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Refetch course data when returning from payment
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page has become visible - user might be returning from payment
        console.log("Page visible again, refetching course data...");
        const fetchCourse = async () => {
          try {
            const { data } = await api.get(`/api/course/getcourse/${courseId}`);
            setCourse(data);
          } catch (err) {
            console.error("Error refetching course:", err);
          }
        };
        fetchCourse();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [courseId]);
  const handlePayment = async () => {
    if (!course) return;

    try {
      setLoadingPayment(true);

      const res = await api.post(`/api/payment/create-payment`, {
        amount: course.price,
        courseId: course._id,
      });

      if (res.data.success && res.data.iframeUrl) {
        // Redirect to Paymob iframe for payment
        window.location.href = res.data.iframeUrl;
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingPayment(false);
    }
  };
  const buyersCount = course?.enrolledCraftsmen?.length || 0;

  return (
    <>
      <div className="full-width">
        <Header />
      </div>
      <section className="course-pro section-layout">
        <div className="course-hero">
          <div className="video-box">
            <img src={course?.thumbnail} alt="" />
            <button className="play-btn">
              <FaPlay />
            </button>
          </div>
          <div className="course-meta">
            <h1>{course?.title}</h1>
            <p>
              {course?.subTitle}
            </p>
            <div className="rating">
              {renderAverageStars(averageRating)}
              <span>
                {reviewsCount > 0
                  ? `${averageRating} (${reviewsCount} ${t("Reviews")})`
                  : `0.0 (0 ${t("Reviews")})`}
              </span>
            </div>
            <div className="instructor" onClick={() => navigate(`/profile/${course?.creator._id}`)}>
              <img src={course?.creator.photoUrl || userAvatar} alt="" />
              <span>{course?.creator.name} • {t("Instructor")}</span>
            </div>

          </div>
        </div>
        <div className="course-grid">
          <div className="course-left">
            <div className="course-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="tab-icon" />
                    <span>{t(tab.text)}</span>
                  </button>
                );
              })}

            </div>
            <div className="course-content">
              {activeTab === "Overview" && (
                <div className="overview">
                  <h3>What you’ll learn</h3>
                  <p style={{ whiteSpace: "pre-line" }}>
                    {course?.description}
                  </p>
                </div>
              )}
              {activeTab === "Curriculum" && (
                <div className="curriculum">
                  {course?.lectures?.map((lecture, i) => (
                    <div className="lesson" key={lecture._id || i}>
                      {lecture.isPreviewFree || isEnrolled ? <FaPlay /> : <IoIosLock />}
                      <span>
                        Lesson {i + 1}: {lecture?.lectureTitle}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "Reviews" && (
                <div className="reviews-tab-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="reviews" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {reviewsList.length > 0 ? (
                      reviewsList.map((review) => (
                        <div className="review-card" key={review._id}>
                          <img src={review.user?.photoUrl || userAvatar} alt="" onError={(e) => { e.target.src = userAvatar; }} />
                          <div className="review-card-content" style={{ flex: 1 }}>
                            <div className="review-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <h4 style={{ margin: 0 }}>{review.user?.name || t("Anonymous")}</h4>
                              {renderStars(review.rating)}
                            </div>
                            <p style={{ margin: "5px 0" }}>{review.comment}</p>
                            <span className="review-date" style={{ fontSize: "0.8rem", color: "var(--light-text-color)", display: "block", marginTop: "5px" }}>
                              {new Date(review.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-reviews" style={{ padding: "20px", textAlign: "center", background: "var(--input-bg)", borderRadius: "20px", color: "var(--light-text-color)" }}>
                        <p>{t("No reviews yet. Be the first to review this course!")}</p>
                      </div>
                    )}
                  </div>

                  {userData ? (
                    <form onSubmit={handleReviewSubmit} className="add-review-form" style={{ marginTop: "20px", padding: "20px", background: "var(--input-bg)", borderRadius: "20px" }}>
                      <h3 style={{ marginTop: 0, marginBottom: "15px" }}>{t("Add a Review")}</h3>
                      <div className="rating-select-container" style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                        <label style={{ fontWeight: "bold" }}>{t("Your Rating:")}</label>
                        {renderStarRatingInput()}
                      </div>
                      <div className="comment-textarea-container" style={{ marginBottom: "15px" }}>
                        <textarea
                          placeholder={t("Write your review here...")}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          required
                          rows={4}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "var(--bg-color)",
                            color: "var(--text-color)",
                            fontFamily: "inherit",
                            outline: "none",
                            resize: "vertical"
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="submit-review-btn"
                        style={{
                          background: "var(--main-color)",
                          color: "white",
                          padding: "10px 20px",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "opacity 0.2s"
                        }}
                      >
                        {submittingReview ? t("Submitting...") : t("Submit Review")}
                      </button>
                    </form>
                  ) : (
                    <div className="login-to-review" style={{ marginTop: "20px", padding: "20px", textAlign: "center", background: "var(--input-bg)", borderRadius: "20px", color: "var(--light-text-color)" }}>
                      <p>{t("Please login to write a review and rate this course.")}</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Instructor" && (
                <div className="instructor-info">
                  <div className="instructor-box" onClick={()=> navigate(`/profile/${course?.creator._id}`)}>
                    <img src={course?.creator.photoUrl || userAvatar} alt="" />
                    <div>
                      <h3>{course?.creator.name}</h3>
                      <span>{t("Instructor")}</span>
                    </div>
                  </div>
                  <p>
                    {course?.creator.description}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="card-container">
            <div className="title-card">
              <p>{getCategoryLabel(getCategoryId(course?.category), i18n.language)}</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M10.277 16.515c.005-.11.187-.154.24-.058c.254.45.686 1.111 1.177 1.412c.49.3 1.275.386 1.791.408c.11.005.154.186.058.24c-.45.254-1.111.686-1.412 1.176s-.386 1.276-.408 1.792c-.005.11-.187.153-.24.057c-.254-.45-.686-1.11-1.176-1.411s-1.276-.386-1.792-.408c-.11-.005-.153-.187-.057-.24c.45-.254 1.11-.686 1.411-1.177c.301-.49.386-1.276.408-1.791m8.215-1c-.008-.11-.2-.156-.257-.062c-.172.283-.421.623-.697.793s-.693.236-1.023.262c-.11.008-.155.2-.062.257c.283.172.624.42.793.697s.237.693.262 1.023c.009.11.2.155.258.061c.172-.282.42-.623.697-.792s.692-.237 1.022-.262c.11-.009.156-.2.062-.258c-.283-.172-.624-.42-.793-.697s-.236-.692-.262-1.022M14.704 4.002l-.242-.306c-.937-1.183-1.405-1.775-1.95-1.688c-.545.088-.806.796-1.327 2.213l-.134.366c-.149.403-.223.604-.364.752c-.143.148-.336.225-.724.38l-.353.141l-.248.1c-1.2.48-1.804.753-1.881 1.283c-.082.565.49 1.049 1.634 2.016l.296.25c.325.275.488.413.58.6c.094.187.107.403.134.835l.024.393c.093 1.52.14 2.28.634 2.542s1.108-.147 2.336-.966l.318-.212c.35-.233.524-.35.723-.381c.2-.032.402.024.806.136l.368.102c1.422.394 2.133.591 2.52.188c.388-.403.196-1.14-.19-2.613l-.099-.381c-.11-.419-.164-.628-.134-.835s.142-.389.365-.752l.203-.33c.786-1.276 1.179-1.914.924-2.426c-.254-.51-.987-.557-2.454-.648l-.379-.024c-.417-.026-.625-.039-.806-.135c-.18-.096-.314-.264-.58-.6m-5.869 9.324C6.698 14.37 4.919 16.024 4.248 18c-.752-4.707.292-7.747 1.965-9.637c.144.295.332.539.5.73c.35.396.852.82 1.362 1.251l.367.31l.17.145c.005.064.01.14.015.237l.03.485c.04.655.08 1.294.178 1.805"
                ></path>
              </svg>
            </div>
            <div className="card-content">
              <p className="title">{buyersCount} {t("Purchases")}</p>
              <p className="plain">
                <span>{course?.price}</span>
                <span>{t("EGP")}</span>
              </p>
              <p className="description">
                {t("Unlock skills with practical lessons that make learning exciting!")}
              </p>
              <button
                className="card-btn"
                onClick={handlePayment}
                disabled={loadingPayment || isEnrolled}
              >
                {isEnrolled ? "Already Enrolled" : loadingPayment ? t("Processing...") : t("Enroll Now")}
              </button>
              <div className="card-separate">
                <div className="separate"></div>
                <p>{t("FEATURES")}</p>
                <div className="separate"></div>
              </div>
              <div className="card-list-features">
                <div className="option">
                  <svg
                    viewBox="0 0 24 24"
                    height="14"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    >
                      <rect rx="4" y="3" x="3" height="18" width="18"></rect>
                      <path d="m9 12l2.25 2L15 10"></path>
                    </g>
                  </svg>
                  <p>{t("Hands-on practical lessons")}</p>
                </div>
                <div className="option">
                  <svg
                    viewBox="0 0 24 24"
                    height="14"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    >
                      <rect rx="4" y="3" x="3" height="18" width="18"></rect>
                      <path d="m9 12l2.25 2L15 10"></path>
                    </g>
                  </svg>
                  <p>{t("Step-by-step tutorials")}</p>
                </div>
                <div className="option">
                  <svg
                    viewBox="0 0 24 24"
                    height="14"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    >
                      <rect rx="4" y="3" x="3" height="18" width="18"></rect>
                      <path d="m9 12l2.25 2L15 10"></path>
                    </g>
                  </svg>
                  <p>{t("Learn at your own pace")}</p>
                </div>
                <div className="option">
                  <svg
                    viewBox="0 0 24 24"
                    height="14"
                    width="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    >
                      <rect rx="4" y="3" x="3" height="18" width="18"></rect>
                      <path d="m9 12l2.25 2L15 10"></path>
                    </g>
                  </svg>
                  <p>{t("Real-world projects")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <TestimonialsSwiper />
      <Footer />
    </>
  );
};

export default ViewCourse;
