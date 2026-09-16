import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../../firebaseModel";
import { doc, getDoc } from "firebase/firestore";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import {
  VIEW_MODES,
  getRecordingStartMs,
  computeNetVolumeSeries,
  computePressurePoints,
  buildChartUpdate,
  baseChartOptions,
} from "./touchChartConfig";
import { CircumplexMini } from "./circumplexPlot";
import { Lightbox } from "./lightbox";
import { isVideoUrl, TEXTURES } from "./mediaUtils";
import "./style.css";
import { t } from "../i18n";

// The media row is 4 square tiles wide; when a touch has fewer, the remaining
// slots in the first row show the ribbed placeholder texture.
const MIN_MEDIA_TILES = 4;

// Read-only by design: name/description editing deliberately does not live
// here. Media is attached while creating the entry; a dedicated edit screen is
// still to be designed.
export function TouchDetailView(props) {
  const lineChartRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [touchData, setTouchData] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.FLOW);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [brokenMedia, setBrokenMedia] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const fetchTouchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "touches", id));
        if (docSnap.exists()) {
          setTouchData(docSnap.data());
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
      }
    };

    fetchTouchData();
  }, [id]);

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

  // Same rendering pipeline as the live recording chart, fed from the saved
  // sequence instead of a live one.
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
    options.plugins.legend.display = viewMode === VIEW_MODES.BOTH;
    options.scales.y = scaleY;
    if (scaleY1) options.scales.y1 = scaleY1;

    const lineChart = new Chart(lineCtx, { type: "line", data: { datasets }, options });

    return () => lineChart.destroy();
  }, [touchData, viewMode, props.language]);

  const moodPoint = {
    x: touchData?.data?.[0]?.x ?? 0,
    y: touchData?.data?.[0]?.y ?? 0,
  };

  const tileCount = Math.max(MIN_MEDIA_TILES, mediaUrls.length);

  return (
    <div className="tl-page">
      <button className="tl-btn tl-btn--back" onClick={() => navigate("/")}>
        ‹ {t("back_to_library", props.language)}
      </button>

      <div className="tl-detail__titlerow">
        <h1 className="tl-h1">{touchData ? touchData.name : t("loading_label", props.language)}</h1>
        <button
          className="tl-btn tl-btn--sm"
          onClick={() => props.onPlay(touchData?.sequence)}
          disabled={!touchData?.sequence}
        >
          {t("play", props.language)}
        </button>
      </div>

      <div className="tl-detail__author">
        <strong>{t("author_prefix", props.language)}</strong>{" "}
        {touchData ? touchData.userName : t("loading_label", props.language)}
      </div>

      <p className="tl-detail__desc">
        {touchData ? touchData.description : t("loading_label", props.language)}
      </p>

      {/* Waveform and mood square sit side by side, top-aligned. */}
      <div className="tl-detail__row">
        <div className="tl-chartblock tl-chartblock--detail">
          <select
            className="tl-select tl-chartblock__select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value={VIEW_MODES.FLOW}>{t("flow_mode", props.language)}</option>
            <option value={VIEW_MODES.PRESSURE}>{t("pressure_mode", props.language)}</option>
            <option value={VIEW_MODES.BOTH}>{t("both_mode", props.language)}</option>
          </select>

          <div className="tl-chartblock__canvas tl-chartblock__canvas--tall">
            <canvas ref={lineChartRef}></canvas>
          </div>
        </div>

        <div className="tl-detail__aside">
          <div className="tl-panel tl-panel--mood">
            <span className="tl-panel__label">{t("mood_panel_label", props.language)}</span>
            <CircumplexMini variant="square" point={moodPoint} language={props.language} />
          </div>

          <p className="tl-detail__feedback-note">{t("feedback_prompt_note", props.language)}</p>

          <a className="tl-btn tl-btn--sm" href={`#/feedback/${id}`}>
            {t("give_feedback_button", props.language)}
          </a>
        </div>
      </div>

      <div className="tl-panel">
        <span className="tl-panel__label">{t("media_panel_label", props.language)}</span>
        <div className="tl-tilegrid">
          {Array.from({ length: tileCount }, (_, index) => {
            const url = mediaUrls[index];
            if (!url || brokenMedia[index]) {
              return <div key={index} className={`tl-tile ${TEXTURES[index % TEXTURES.length]}`}></div>;
            }
            return (
              <button
                key={index}
                type="button"
                className="tl-tile tl-tile--clickable"
                onClick={() => setLightboxIndex(index)}
              >
                {isVideoUrl(url) ? (
                  <video src={url} />
                ) : (
                  <img
                    src={url}
                    alt={`${t("media_alt_label", props.language)} ${index + 1}`}
                    onError={() => setBrokenMedia((prev) => ({ ...prev, [index]: true }))}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {lightboxIndex !== null && mediaUrls.length > 0 && (
        <Lightbox
          items={mediaUrls}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          language={props.language}
        />
      )}
    </div>
  );
}
