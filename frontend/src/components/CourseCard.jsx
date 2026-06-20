import React from "react";
import { HiArrowUpRight } from "react-icons/hi2";
import { FaStar } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const CourseCard = ({ image, title, instructor, tag, hours, lectures, level, price, courseId, reviews }) => {
    const navigate = useNavigate()
    const { i18n, t } = useTranslation();

    const reviewsCount = reviews?.length || 0;
    const averageRating = reviewsCount > 0
        ? (reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviewsCount).toFixed(1)
        : "0.0";

    return (
        <div className="course-card">
            <div className="card-inner">
                <div className="box">
                    <div className="imgBox">
                        <img className="inverted-radius" src={image} alt={title} />
                        <div className="icon iconBox">
                            <HiArrowUpRight onClick={() => navigate(`/viewcourse/${courseId}`)} />
                        </div>
                        <div className="tag-star">
                            <span
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/search?category=${encodeURIComponent(tag)}`);
                              }}
                            >#{t(tag)}</span>
                            <span className="star"><FaStar />{averageRating}</span>
                        </div>
                        <span className="hours"><BsClockHistory />{hours}</span>
                    </div>
                </div>
            </div>

            <div className="content">
                <h3 className="clamp-v clamp-v1" title={title}>{title}</h3>
                <p className="clamp-1" title={instructor}>{t("By")} : {instructor}</p>
                <p className="clamp-1" title={instructor}>{lectures} {t("Lectures")} . {t(level)}</p>
                <h3 className="clamp-1" title={title}>{price} {t("EGP")}</h3>

            </div>
        </div>
    );
};

export default CourseCard;
