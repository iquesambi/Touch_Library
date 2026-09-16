import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "chartjs-plugin-dragdata";
import {
  curveToActions,
  enforcePhysicalLimits,
  INK,
  INK_FILL,
  INK_SOFT,
  INFLATE_NOTE,
  DEFLATE_NOTE,
} from "./touchChartConfig";
import "./style.css";
import { t } from "../i18n";

// DAW-style timeline: starts short and grows as the shape needs more room,
// either automatically (a point gets pushed past the edge) or via "+1s".
const INITIAL_TIMELINE_SECONDS = 5;
const TIMELINE_STEP_SECONDS = 1;
const INITIAL_MAX_VOLUME_ML = 200;
// The curve always starts at rest: 0 seconds in, 0 mL in the chamber. This
// point is pinned — it can't be dragged or deleted.
const ORIGIN_POINT = { x: 0, y: 0, dragData: false };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultPoints() {
  return [{ ...ORIGIN_POINT }, { x: INITIAL_TIMELINE_SECONDS, y: 0 }];
}

// "Draw shape" mode of Create an entry, step 1: hand-draw an inflate/deflate
// curve. Reports every change up via onCurveChange so the flow can convert it
// to a playable sequence when the entry is saved.
export function ShapeDrawPanel(props) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pointsRef = useRef(defaultPoints());
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxVolume, setMaxVolume] = useState(INITIAL_MAX_VOLUME_ML);
  const timelineSecondsRef = useRef(INITIAL_TIMELINE_SECONDS);
  const maxVolumeRef = useRef(INITIAL_MAX_VOLUME_ML);
  const onCurveChangeRef = useRef(props.onCurveChange);
  onCurveChangeRef.current = props.onCurveChange;

  function reportCurve() {
    onCurveChangeRef.current({
      points: pointsRef.current.map((p) => ({ x: p.x, y: p.y })),
      maxVolume: maxVolumeRef.current,
      timelineSeconds: timelineSecondsRef.current,
    });
  }

  // Runs every point change through the same pipeline: clamp to the current
  // volume ceiling, snap any physically-impossible slope later in time, grow
  // the timeline if that snap (or the raw point) needs more room, then push
  // the result to the chart and up to the flow.
  function applyPoints(rawPoints) {
    const clamped = rawPoints.map((p) => ({ x: Math.max(p.x, 0), y: clamp(p.y, 0, maxVolumeRef.current) }));
    const corrected = enforcePhysicalLimits(clamped);
    corrected[0] = { ...ORIGIN_POINT }; // the start is always pinned at 0s/0mL

    const furthestX = Math.max(...corrected.map((p) => p.x));
    if (furthestX > timelineSecondsRef.current) {
      timelineSecondsRef.current = Math.ceil(furthestX / TIMELINE_STEP_SECONDS) * TIMELINE_STEP_SECONDS;
    }

    pointsRef.current = corrected;
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.data.datasets[0].data = corrected;
      chart.options.scales.x.max = timelineSecondsRef.current;
      chart.update();
    }
    reportCurve();
  }

  function addPoint(x, y) {
    // Never land exactly on the pinned origin point — it would just get
    // silently discarded when applyPoints re-pins index 0.
    const clampedX = clamp(x, 0.05, timelineSecondsRef.current);
    applyPoints([...pointsRef.current, { x: clampedX, y: clamp(y, 0, maxVolumeRef.current) }]);
  }

  function removePointAt(index) {
    if (index === 0) return; // the origin point is pinned, not removable
    if (pointsRef.current.length <= 2) return; // always need a start and an end
    applyPoints(pointsRef.current.filter((_, i) => i !== index));
  }

  function extendTimeline() {
    timelineSecondsRef.current += TIMELINE_STEP_SECONDS;
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.options.scales.x.max = timelineSecondsRef.current;
      chart.update();
    }
    reportCurve();
  }

  function handleMaxVolumeChange(evt) {
    const next = Math.max(1, Number(evt.target.value) || 0);
    maxVolumeRef.current = next;
    setMaxVolume(next);
    applyPoints(pointsRef.current);
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.options.scales.y.max = next;
      chart.update();
    }
  }

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: t("chart_target_volume_label", props.language),
            data: pointsRef.current,
            borderColor: INK,
            backgroundColor: INK_FILL,
            fill: true,
            borderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: INK,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        layout: { padding: 0 },
        plugins: {
          legend: { display: false },
          dragData: {
            round: 2,
            dragX: true,
            dragY: true,
            onDragEnd: () => applyPoints([...chart.data.datasets[0].data]),
          },
        },
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: timelineSecondsRef.current,
            grid: { display: false },
            border: { color: INK },
            ticks: { color: INK_SOFT, font: { size: 11 } },
            title: { display: true, text: t("chart_time_axis_label", props.language), color: INK_SOFT, font: { size: 11 } },
          },
          y: {
            min: 0,
            max: maxVolumeRef.current,
            grid: { display: false },
            border: { color: INK },
            ticks: { color: INK_SOFT, font: { size: 11 } },
            title: { display: true, text: t("chart_target_volume_label", props.language), color: INK_SOFT, font: { size: 11 } },
          },
        },
        elements: { line: { tension: 0.1 } },
        onClick: (evt, elements) => {
          if (elements.length > 0) return; // clicking an existing point is for dragging, not adding
          addPoint(chart.scales.x.getValueForPixel(evt.x), chart.scales.y.getValueForPixel(evt.y));
        },
      },
    });

    function handleDoubleClick(nativeEvent) {
      const hits = chart.getElementsAtEventForMode(nativeEvent, "nearest", { intersect: true }, true);
      if (hits.length > 0) removePointAt(hits[0].index);
    }

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener("dblclick", handleDoubleClick);
    chartInstanceRef.current = chart;
    reportCurve(); // the default flat curve is still a valid (if empty) shape

    return () => {
      canvasEl.removeEventListener("dblclick", handleDoubleClick);
      chart.destroy();
      chartInstanceRef.current = null;
    };
  }, [props.language]);

  async function playACB() {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);

    for (const action of curveToActions(pointsRef.current)) {
      if (!isPlayingRef.current) break;

      if (action.type === "inflate") {
        props.model.buttonDownNote(INFLATE_NOTE, action.velocity);
        await sleep(action.durationMs);
        props.model.buttonUpNote(INFLATE_NOTE);
      } else if (action.type === "deflate") {
        props.model.buttonDownNote(DEFLATE_NOTE, action.velocity);
        await sleep(action.durationMs);
        props.model.buttonUpNote(DEFLATE_NOTE);
      } else {
        await sleep(action.durationMs);
      }
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
  }

  function stopACB() {
    isPlayingRef.current = false;
    props.model.buttonUpNote(INFLATE_NOTE);
    props.model.buttonUpNote(DEFLATE_NOTE);
    setIsPlaying(false);
  }

  function clearACB() {
    if (isPlayingRef.current) return;
    timelineSecondsRef.current = INITIAL_TIMELINE_SECONDS;
    applyPoints(defaultPoints());
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.options.scales.x.max = INITIAL_TIMELINE_SECONDS;
      chart.update();
    }
  }

  return (
    <div className="tl-stack">
      <p className="tl-lead">{t("shape_editor_instructions", props.language)}</p>

      <div className="tl-row">
        <button className="tl-btn" onClick={isPlaying ? stopACB : playACB}>
          {isPlaying ? t("stop_button", props.language) : t("play", props.language)}
        </button>
        <button className="tl-btn tl-btn--outline" onClick={clearACB} disabled={isPlaying}>
          {t("clear_button", props.language)}
        </button>
        <button className="tl-btn tl-btn--outline" onClick={extendTimeline} disabled={isPlaying}>
          +{TIMELINE_STEP_SECONDS}s
        </button>
      </div>

      <div className="tl-chartblock">
        <div className="tl-chartblock__canvas">
          <canvas ref={canvasRef}></canvas>
        </div>

        {/* Max volume is merged into the chart block, not floating above it. */}
        <div className="tl-chartblock__side">
          <span className="tl-chartblock__side-label">{t("max_volume_label", props.language)}</span>
          <input
            type="number"
            min="1"
            className="tl-chartblock__side-input"
            value={maxVolume}
            onChange={handleMaxVolumeChange}
            disabled={isPlaying}
          />
        </div>
      </div>
    </div>
  );
}
