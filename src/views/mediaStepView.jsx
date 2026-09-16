import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storage } from "../../firebaseModel";
import { ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { StepIndicator } from "./stepIndicator";
import { isVideoUrl } from "./mediaUtils";
import "./style.css";
import { t } from "../i18n";

// Step 3 of the record flow: attach reference photos/video to a touch.
//
// This screen has no design yet — it carries the drag-and-drop uploader and
// gallery that used to sit inside the touch detail page, restyled only with
// the shared tokens so it doesn't clash while it waits for a proper design.
export function MediaStepView(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mediaUrls, setMediaUrls] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const folderRef = ref(storage, `touchMedia/${id}`);
        const result = await listAll(folderRef);
        const urls = await Promise.all(result.items.map((itemRef) => getDownloadURL(itemRef)));
        setMediaUrls(urls);
      } catch (error) {
        console.error("Error loading media: ", error);
        setMediaUrls([]);
      }
    };

    loadMedia();
  }, [id]);

  async function handleFileUpload(files) {
    setUploading(true);
    for (const file of files) {
      try {
        const storageRef = ref(storage, `touchMedia/${id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setMediaUrls((prev) => [...prev, downloadURL]);
      } catch (error) {
        console.error("Error uploading file: ", error);
      }
    }
    setUploading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }

  return (
    <div className="tl-page">
      <div className="tl-titlerow">
        <div className="tl-titlerow__left">
          <h1 className="tl-h1">{t("media_step_title", props.language)}</h1>
          <StepIndicator current={3} />
        </div>
        <button
          className="tl-btn tl-btn--text"
          onClick={() => navigate(`/visualization/${id}`)}
        >
          {t("finish", props.language)} ›
        </button>
      </div>

      <p className="tl-lead">{t("media_step_intro", props.language)}</p>

      <div
        className={`tl-dropzone${dragOver ? " is-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <span>{t("drag_drop_files_label", props.language)}</span>
        <input
          type="file"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={uploading}
        />
      </div>

      {mediaUrls.length > 0 && (
        <div className="tl-gallery">
          {mediaUrls.map((url, index) => (
            <div key={index} className="tl-gallery__item">
              {isVideoUrl(url) ? (
                <video src={url} controls />
              ) : (
                <img src={url} alt={`${t("media_alt_label", props.language)} ${index + 1}`} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
