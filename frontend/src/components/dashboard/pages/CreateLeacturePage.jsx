// CreateLecturePage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AuthInput from "../../AuthInput";
import { useInputAnimation } from "../../../hooks/useInputAnimation";
import { MdOutlineTitle } from "react-icons/md";
import { FaInbox } from "react-icons/fa6";
import { ClipLoader } from "react-spinners";
import ThumbnailUpload from "../components/ThumbnailUpload";
import { api } from "@services/api";
import { FaPlay, } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import { useTranslation } from "react-i18next";

const CreateLecturePage = () => {
  const { handleFocus, handleBlur } = useInputAnimation();
  const { courseId } = useParams();
  const { i18n, t } = useTranslation();
  const [lectureTitle, setLectureTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resetUpload, setResetUpload] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [editingLecture, setEditingLecture] = useState(null);
  const [isPreviewFree, setIsPreviewFree] = useState(false);

  const uploadVideo = async () => {
    if (!videoFile) {
      return {
        url: editingLecture?.videoUrl,
        duration: editingLecture?.duration,
      };
    }

    const formData = new FormData();
    formData.append("file", videoFile);

    try {
      const res = await api.post("/api/upload/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      return {
        url: res.data.url,
        duration: res.data.duration,
      };
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload video ❌");
      return null;
    }
  };

  const handleCreateLecture = async () => {
    if (!lectureTitle) return toast.error("Lecture Title is required");
    setLoading(true);
    setUploadProgress(0);

    try {
      const videoData = await uploadVideo();
      if (!videoData) return setLoading(false);

      const res = await api.post(
        `/api/course/createlecture/${courseId}`,
        {
          lectureTitle,
          description,
          videoUrl: videoData.url,
          duration: videoData.duration,
          isPreviewFree,
        },
        { withCredentials: true }
      );

      toast.success("Lecture Created Successfully ✅");

      setLectureTitle("");
      setDescription("");
      setVideoFile(null);
      setVideoUrl(null); // Set to null to ensure preview is cleared
      setIsPreviewFree(false);
      setUploadProgress(0);
      setResetUpload((prev) => !prev);

      if (res.data.lecture) {
        setLectures((prev) => [...prev, res.data.lecture]);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create lecture ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLecture = async (lectureId) => {
    if (!lectureTitle && !description && !videoFile) {
      return toast.error("Nothing to update!");
    }
    setLoading(true);

    try {
      let videoData = {
        url: editingLecture.videoUrl,
        duration: editingLecture.duration,
      };

      if (videoFile) {
        videoData = await uploadVideo();
      }

      const res = await api.put(
        `/api/course/editlecture/${lectureId}`,
        {
          lectureTitle: lectureTitle || editingLecture.lectureTitle,
          description: description || editingLecture.description,
          videoUrl: videoData.url,
          duration: videoData.duration,
          isPreviewFree,
        },
        { withCredentials: true }
      );

      toast.success("Lecture updated successfully ✅");

      setLectures((prev) =>
        prev.map((lec) =>
          lec._id === lectureId
            ? {
              ...lec,
              lectureTitle: lectureTitle || lec.lectureTitle,
              description: description || lec.description,
              videoUrl: videoData.url,
              duration: videoData.duration,
              isPreviewFree,
            }
            : lec
        )
      );

      setEditingLecture(null);
      setLectureTitle("");
      setDescription("");
      setVideoFile(null);
      setVideoUrl("");
      setIsPreviewFree(false);
      setUploadProgress(0);
      setResetUpload((prev) => !prev);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update lecture ❌");
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveLecture = async () => {
    if (!editingLecture?._id) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this lecture?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      await api.delete(`/api/course/removelecture/${editingLecture._id}`, {
        withCredentials: true,
      });

      toast.success("Lecture deleted successfully 🗑️");

      setLectures((prev) =>
        prev.filter((lec) => lec._id !== editingLecture._id)
      );

      setEditingLecture(null);
      setLectureTitle("");
      setDescription("");
      setVideoFile(null);
      setVideoUrl("");
      setIsPreviewFree(false);

      setResetUpload((prev) => !prev);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete lecture ❌");
    } finally {
      setLoading(false);
    }
  };
  const fetchLectures = async () => {
    try {
      const res = await api.get(`/api/course/courselecture/${courseId}`, {
        withCredentials: true,
      });
      setLectures(res.data.lectures || []);
    } catch (error) {
      console.error("Fetch lectures error:", error);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  const handleEditClick = (lecture) => {
    if (editingLecture?._id === lecture._id) return;

    setEditingLecture(lecture);
    setLectureTitle(lecture.lectureTitle);
    setDescription(lecture.description);
    setIsPreviewFree(lecture.isPreviewFree);
    setVideoFile(null);
    setVideoUrl(lecture.videoUrl || "");
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const pad = (num) => String(num).padStart(2, "0");
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
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
                key={resetUpload}
                type="video"
                setThumbnail={setVideoFile}
                reset={resetUpload}
                currentVideoUrl={editingLecture ? videoUrl : null}
              />
            </div>

            <AuthInput
              type="text"
              label={t("Lecture Title")}
              Icon={MdOutlineTitle}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              value={lectureTitle}
              onChange={setLectureTitle}
            />

            <AuthInput
              label={t("Lecture Description")}
              textarea
              Icon={FaInbox}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              value={description}
              onChange={setDescription}
            />

            <div className="checkbox">
              <input
                id="checkbox1"
                className="checkbox__input"
                type="checkbox"
                checked={isPreviewFree}
                onChange={(e) => setIsPreviewFree(e.target.checked)}
              />
              <label htmlFor="checkbox1" className="checkbox__label">
                <p>{t("Free Preview Lecture")}</p>
                <span className="checkbox__custom"></span>
              </label>
            </div>
            {editingLecture ? (
              <>
                <button
                  className="remove-lecture"
                  type="button"
                  onClick={handleRemoveLecture}
                  disabled={loading}
                >
                  <span>{loading ? t("Deleting...") : t("Remove Lecture")}</span>
                </button>
                <div className="create-btn-group">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditingLecture(null);
                      setLectureTitle("");
                      setDescription("");
                      setVideoFile(null);
                      setIsPreviewFree(false);
                      setVideoUrl("");

                      setResetUpload((prev) => !prev);
                    }}
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="button"
                    className="create-btn"
                    onClick={() => handleUpdateLecture(editingLecture._id)}
                    disabled={loading}
                  >
                    <span className="button-content">
                      {loading ? <ClipLoader size={20} color="white" /> : t("Update Lecture")}
                      <span className="button-icon">→</span>
                    </span>
                    <span className="button-background"></span>
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="create-btn"
                onClick={handleCreateLecture}
                disabled={loading}
              >
                <span className="button-content">
                  {loading ? <ClipLoader size={20} color="white" /> : t("Create Lecture")}
                  <span className="button-icon">→</span>
                </span>
                <span className="button-background"></span>
              </button>
            )}
          </form>
        </div>

        <div className="todo">
          <ul className="todo-list">
            <div className="order">
              <div className="head">
                <h3>{t("Lectures Added")}</h3>
              </div>

              <div className="lectures-list">
                {lectures.length === 0 ? (
                  <li className="not-completed">
                    <p>{t("No lectures added yet")}</p>
                  </li>
                ) : (
                  lectures.map((lecture, index) => (
                    <li
                      key={lecture._id || index}
                      className="completed"
                      style={{ pointerEvents: loading ? "none" : "auto", opacity: loading ? 0.5 : 1 }}
                      onClick={() => handleEditClick(lecture)}
                    >
                      <span className="icon"> {lecture.isPreviewFree ? <FaPlay /> : <IoIosLock />}</span>
                      <div className="lec-add">
                        <div className="content">
                          <span className="lec-title">

                            {lecture.lectureTitle}
                          </span>

                          <span className="duration">{formatDuration(lecture.duration)}</span>
                        </div>
                        <p className="description">
                          {lecture.description || "No description"}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </div>
            </div>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default CreateLecturePage;