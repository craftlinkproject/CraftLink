import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import AuthInput from "../../AuthInput";
import { useInputAnimation } from "../../../hooks/useInputAnimation";
import { MdOutlineTitle } from "react-icons/md";
import ThumbnailUpload from "../components/ThumbnailUpload";
import { BsCurrencyPound } from "react-icons/bs";
import { PiSubtitles } from "react-icons/pi";
import { FaInbox } from "react-icons/fa6";
import SelectInput from "../components/SelectInput";
import { api } from "@services/api";
import { useTranslation } from "react-i18next";
import { CATEGORY_GROUPS, getCategoryLabel } from "../../../constants/categories";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dhynqaw42/image/upload";
const UPLOAD_PRESET = "CraftLink_Image";
const CreateCoursePage = () => {
  const { i18n, t } = useTranslation();
  const { courseId } = useParams();
  const { handleFocus, handleBlur } = useInputAnimation();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [courseDataState, setCourseDataState] = useState(null);
  const [subTitle, setSubTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetUpload, setResetUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const compressImage = (file, maxWidth = 800, maxHeight = 800) => {

    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: file.type })),
          file.type,
          0.7,
        );
      };
    });
  };
  const uploadThumbnail = async (file) => {
    if (!file) return null;
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "craftlink/course");
    try {
      const res = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percent);
        },
      });
      return res.data.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      toast.error("Failed to upload thumbnail ❌");
      return null;
    }
  };
  const handleSubmit = async () => {
    setLoading(true);

    try {
      let thumbnailUrl = courseDataState?.thumbnail || null;

      if (thumbnail) {
        thumbnailUrl = await uploadThumbnail(thumbnail);
      }

      const courseData = {
        title,
        subTitle,
        price,
        description,
        category,
        level,
        thumbnail: thumbnailUrl,
      };

      if (courseDataState) {
        await api.post(`/api/course/editcourse/${courseId}`, courseData, { withCredentials: true });

        const updated = await api.get(`/api/course/getcourse/${courseId}`);
        setCourseDataState(updated.data);

        toast.success("Course updated successfully ✅");
        setUploadProgress(0);
      } else {
        const res = await api.post(`/api/course/create`, courseData, { withCredentials: true });

        toast.success("Course created successfully ✅");
        navigate(`/createcourse/createLecture/${res.data._id}`);
        setUploadProgress(0);
      }

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (courseId) {
      const fetchCourse = async () => {
        try {
          const res = await api.get(`/api/course/getcourse/${courseId}`);
          setCourseDataState(res.data);
          setTitle(res.data.title || "");
          setSubTitle(res.data.subTitle || "");
          setPrice(res.data.price || "");
          setDescription(res.data.description || "");
          setCategory(getCategoryId(res.data.category) || "");
          setLevel(res.data.level || "");
          setResetUpload(true);
        } catch (err) {
          console.error(err);
        }
      };
      fetchCourse();
    }
  }, [courseId]);
  const handleDelete = async () => {
    if (!courseId) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this course?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      await api.delete(`/api/course/remove/${courseId}`, {
        withCredentials: true,
      });

      toast.success("Course deleted successfully ✅");

      navigate("/profile");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete course ❌");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main>
      <div className="table-data course-form">
        <div className="order">
          {uploadProgress > 0 && (
            <div className="loading-wrapper">
              <div className="loader-container">
                <div className="loader"></div>
                <span className="num">{uploadProgress}%</span>
              </div>
            </div>
          )}
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="create-thumb">
              <ThumbnailUpload
                setThumbnail={setThumbnail}
                type="image"
                reset={resetUpload}
                currentImageUrl={courseDataState?.thumbnail}
              />
              <div className="info">
                <AuthInput
                  type="text"
                  label={t("Course Title")}
                  Icon={MdOutlineTitle}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={title}
                  onChange={setTitle}
                />
                <AuthInput
                  type="text"
                  label={t("Subtitle")}
                  Icon={PiSubtitles}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={subTitle}
                  onChange={setSubTitle}
                />
                <AuthInput
                  type="text"
                  label={t("Course Price (EGP)")}
                  Icon={BsCurrencyPound}
                  handleFocus={handleFocus}
                  handleBlur={handleBlur}
                  value={price}
                  onChange={setPrice}
                />
                <div className="selected-options">
                  <SelectInput
                    label={t("Select Category")}
                    options={CATEGORY_GROUPS.map((group) => ({
                      label: t(group.labelKey),
                      items: group.items.map((id) => ({
                        value: id,
                        label: getCategoryLabel(id, i18n.language),
                      })),
                    }))}
                    value={category ? getCategoryLabel(category, i18n.language) : ""}
                    onChange={(val) => setCategory(val)}
                  />
                  <SelectInput
                    label={t("Select Level")}
                    options={[t("Beginner"), t("Intermediate"), t("Advanced")]}
                    value={level}
                    onChange={setLevel}
                  />
                </div>
              </div>
            </div>
            <AuthInput
              label={t("Course Description")}
              textarea
              Icon={FaInbox}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              value={description}
              onChange={setDescription}
            />
            {courseDataState ? (
              <button className="edit-lectures" onClick={() => navigate(`/createcourse/createLecture/${courseId}`)}>
                <span>{t("Edit Lectures")}</span>
                <span class="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    class="svg-icon"
                  >
                    <path
                      d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"
                    ></path>
                  </svg>
                </span>
              </button>

            ) : null}
            <div className="create-btn-group">
              {courseDataState ? (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleDelete}
                >
                  {t("Delete")}
                </button>
              ) : null}

              <button
                type="button"
                className="create-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ClipLoader size={20} color="white" />
                ) : courseDataState ? (
                  <span class="button-content">
                    <span className="button-text">{t("Update Course")}</span>
                    <span className="button-icon">→</span>
                  </span>
                ) : (
                  <span class="button-content">
                    <span className="button-text">{t("Create Course")}</span>
                    <span className="button-icon">→</span>
                  </span>
                )}
                <span className="button-background"></span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default CreateCoursePage;
