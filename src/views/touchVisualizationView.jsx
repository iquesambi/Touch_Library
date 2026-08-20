import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { useParams } from "react-router-dom";
import { db, storage } from "../../firebaseModel";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import {
  VIEW_MODES,
  getRecordingStartMs,
  computeNetVolumeSeries,
  computePressurePoints,
  buildChartUpdate,
  baseChartOptions,
} from "./touchChartConfig";
import "./style.css";
import { t } from "../i18n";

export function VisualizationView(props) {
  const lineChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const scatterChartRef = useRef(null);
  const { id } = useParams();
  const [touchData, setTouchData] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.FLOW);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const currentUser = props.userName;
  const isAuthor = touchData?.userName === currentUser;

  useEffect(() => {
    const fetchTouchData = async () => {
      try {
        const docRef = doc(db, "touches", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTouchData(data);
          setEditedName(data.name);
          setEditedDescription(data.description);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
      }
    };

    fetchTouchData();
  }, [id]);

  // (Re)draws the touch chart whenever the fetched data or the selected view
  // mode changes. Same rendering logic as the live recording chart in
  // uploadView.jsx, just fed from a finished/saved sequence instead of a
  // live one (no "now" extension needed).
  useEffect(() => {
    const lineCtx = lineChartRef.current?.getContext("2d");
    if (!lineCtx || !touchData) return;

    const events = Array.isArray(touchData.sequence) ? touchData.sequence : [];
    const pressureSamples = Array.isArray(touchData.pressure) ? touchData.pressure : [];
    const t0 = getRecordingStartMs(events, pressureSamples);
    const volumePoints = computeNetVolumeSeries(events, t0);
    const pressurePoints = computePressurePoints(pressureSamples, t0);
    const { datasets, scaleY, scaleY1 } = buildChartUpdate(viewMode, volumePoints, pressurePoints, props.language);

    const options = baseChartOptions();
    options.scales.y = scaleY;
    if (scaleY1) options.scales.y1 = scaleY1;

    const lineChart = new Chart(lineCtx, {
      type: "line",
      data: { datasets },
      options,
    });
    chartInstanceRef.current = lineChart;

    return () => {
      lineChart.destroy();
      chartInstanceRef.current = null;
    };
  }, [touchData, viewMode, props.language]);

  function handleViewModeChange(evt) {
    setViewMode(evt.target.value);
  }

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

  const handleFileUpload = async (files) => {
    if (isAuthor) {
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
    } else {
      alert(t("not_author_upload_alert", props.language));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    const scatterCtx = scatterChartRef.current?.getContext("2d");

    if (
      isChartVisible &&
      scatterCtx &&
      touchData?.data?.[0]?.x !== undefined &&
      touchData?.data?.[0]?.y !== undefined
    ) {
      const scatterData = {
        datasets: [
          {
            label: "Scatter Dataset",
            data: [{ x: touchData.data[0].x, y: touchData.data[0].y }],
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        ],
      };

      const scatterChart = new Chart(scatterCtx, {
        type: "scatter",
        data: scatterData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              type: "linear",
              display: true,
              position: "center",
              grid: { display: false },
              ticks: { display: false },
              min: -15,
              max: 15,
              border: { width: 3, color: "black" },
            },
            y: {
              type: "linear",
              display: true,
              position: "center",
              grid: { display: false },
              ticks: { display: false },
              min: -15,
              max: 15,
              border: { width: 3, color: "black" },
            },
          },
        },
        plugins: [
          {
            id: "backgroundCircle",
            beforeDraw: (chart) => {
              const { ctx, chartArea } = chart;
              const centerX = (chartArea.left + chartArea.right) / 2;
              const centerY = (chartArea.top + chartArea.bottom) / 2;
              const radius = Math.min(chartArea.width, chartArea.height) / 2.1;

              ctx.save();

              ctx.font = "16px Arial";
              ctx.fillStyle = "black";
              ctx.textAlign = "center";

              ctx.save();
              ctx.translate(centerX - 5, chartArea.top + 70);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText(t("high_arousal", props.language), 0, 0);
              ctx.restore();

              ctx.save();
              ctx.translate(centerX + 5, chartArea.bottom - 70);
              ctx.rotate(Math.PI / 2);
              ctx.fillText(t("low_arousal", props.language), 0, 0);
              ctx.restore();

              ctx.fillText(t("pleasure", props.language), chartArea.right - 60, centerY - 5);
              ctx.fillText(t("displeasure", props.language), chartArea.left + 70, centerY - 5);

              ctx.restore();
            },
          },
        ],
      });

      return () => scatterChart.destroy();
    }
  }, [isChartVisible, touchData, props.language]);

  const handleNameEdit = () => {
    if (isAuthor) {
      const updateData = async () => {
        try {
          const docRef = doc(db, "touches", id);
          await updateDoc(docRef, { name: editedName });
        } catch (error) {
          console.error("Error updating document: ", error);
        }
      };
      updateData();
      setIsEditingName(!isEditingName);
    } else {
      alert(t("not_author_edit_name_alert", props.language));
    }
  };

  const handleDescriptionEdit = () => {
    if (isAuthor) {
      const updateData = async () => {
        try {
          const docRef = doc(db, "touches", id);
          await updateDoc(docRef, { description: editedDescription });
        } catch (error) {
          console.error("Error updating document: ", error);
        }
      };
      updateData();
      setIsEditingDescription(!isEditingDescription);
    } else {
      alert(t("not_author_edit_description_alert", props.language));
    }
  };

  function handleImageClick(image) {
    setSelectedImage(image);
  }

  function closeImage(e) {
    if (e.target.classList.contains("lightbox")) {
      setSelectedImage(null);
    }
  }

  return (
    <div className="main">
      <div className="holder">
        <h2>
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
            />
          ) : touchData ? (
            touchData.name
          ) : (
            t("loading_label", props.language)
          )}
          {isAuthor && (
            <button onClick={handleNameEdit}>
              {isEditingName ? t("save_name_button", props.language) : t("edit_name_button", props.language)}
            </button>
          )}
        </h2>

        <p>
          <strong>{t("author_prefix", props.language)}</strong> {touchData ? touchData.userName : t("loading_label", props.language)}
        </p>

        <p>
          {isEditingDescription ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
          ) : touchData ? (
            touchData.description
          ) : (
            t("loading_label", props.language)
          )}
          {isAuthor && (
            <button onClick={handleDescriptionEdit}>
              {isEditingDescription ? t("save_description_button", props.language) : t("edit_description_button", props.language)}
            </button>
          )}
        </p>

        <button onClick={() => props.onPlay(touchData?.sequence)} disabled={!touchData?.sequence}>
          {t("play", props.language)}
        </button>

        <a className="feedback-link" href={`#/feedback/${id}`}>
          <button>{t("give_feedback_button", props.language)}</button>
        </a>

        <select value={viewMode} onChange={handleViewModeChange}>
          <option value={VIEW_MODES.FLOW}>{t("flow_mode", props.language)}</option>
          <option value={VIEW_MODES.PRESSURE}>{t("pressure_mode", props.language)}</option>
          <option value={VIEW_MODES.BOTH}>{t("both_mode", props.language)}</option>
        </select>

        <div className="chart">
          <canvas ref={lineChartRef}></canvas>
        </div>

        <div className="dropdown">
          {t("russell_model_label", props.language)}
          <button onClick={() => setIsChartVisible(!isChartVisible)}>{t("open_button", props.language)}</button>
          {isChartVisible && (
            <div>
              <canvas ref={scatterChartRef} className="visualization__chart-two"></canvas>
            </div>
          )}
        </div>

        <div className="dropdown">
          {t("media_gallery_label", props.language)}
          <button onClick={() => setIsGalleryVisible(!isGalleryVisible)}>{t("open_button", props.language)}</button>

          {isGalleryVisible && (
            <>
              {isAuthor && (
                <div
                  className="upload-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {t("drag_drop_files_label", props.language)}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    style={{ marginLeft: "10px" }}
                  />
                </div>
              )}

              <div className="gallery-grid">
                {mediaUrls.map((url, index) =>
                  url.match(/\.(mp4|webm)$/i) ? (
                    <video
                      key={index}
                      src={url}
                      controls
                      className="thumbnail"
                      style={{ maxHeight: "150px" }}
                    />
                  ) : (
                    <img
                      key={index}
                      src={url}
                      alt={`${t("media_alt_label", props.language)} ${index}`}
                      className="thumbnail"
                      onClick={() => handleImageClick(url)}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>

        {selectedImage && (
          <div className="lightbox" onClick={closeImage}>
            <img src={selectedImage} alt={t("enlarged_image_alt", props.language)} className="enlarged-image" />
          </div>
        )}
      </div>
    </div>
  );
}
