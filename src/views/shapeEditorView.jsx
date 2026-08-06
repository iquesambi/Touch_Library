import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "chartjs-plugin-dragdata";
import { curveToActions, enforcePhysicalLimits } from "./touchChartConfig";
import "./style.css";

// DAW-style timeline: starts short and grows as the shape needs more room,
// either automatically (a point gets pushed past the edge) or via the
// "+1s" button.
const INITIAL_TIMELINE_SECONDS = 5;
const TIMELINE_STEP_SECONDS = 1;
const INITIAL_MAX_VOLUME_ML = 200;
// The curve always starts at rest: 0 seconds in, 0 mL in the chamber. This
// point is pinned — it can't be dragged or deleted.
const ORIGIN_POINT = { x: 0, y: 0, dragData: false };

const INFLATE_NOTE = 60; // middleC — matches the Arduino's button-1/inflate mapping
const DEFLATE_NOTE = 67; // middleG — matches the Arduino's button-2/deflate mapping

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultPoints() {
  return [
    { ...ORIGIN_POINT },
    { x: INITIAL_TIMELINE_SECONDS, y: 0 },
  ];
}

export function ShapeEditorView(props) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pointsRef = useRef(defaultPoints());
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineSeconds, setTimelineSeconds] = useState(INITIAL_TIMELINE_SECONDS);
  const [maxVolume, setMaxVolume] = useState(INITIAL_MAX_VOLUME_ML);
  const timelineSecondsRef = useRef(timelineSeconds);
  const maxVolumeRef = useRef(maxVolume);

  // Runs every point change through the same pipeline: clamp to the current
  // volume ceiling, snap any physically-impossible slope later in time, grow
  // the timeline if that snap (or the raw point) needs more room, then push
  // the result to both the chart and the React-visible state.
  function applyPoints(rawPoints) {
    const clamped = rawPoints.map((p) => ({ x: Math.max(p.x, 0), y: clamp(p.y, 0, maxVolumeRef.current) }));
    const corrected = enforcePhysicalLimits(clamped);
    corrected[0] = { ...ORIGIN_POINT }; // the start is always pinned at 0s/0mL

    const furthestX = Math.max(...corrected.map((p) => p.x));
    if (furthestX > timelineSecondsRef.current) {
      const grown = Math.ceil(furthestX / TIMELINE_STEP_SECONDS) * TIMELINE_STEP_SECONDS;
      timelineSecondsRef.current = grown;
      setTimelineSeconds(grown);
    }

    pointsRef.current = corrected;
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.data.datasets[0].data = corrected;
      chart.options.scales.x.max = timelineSecondsRef.current;
      chart.update();
    }
  }

  function addPoint(x, y) {
    // Never land exactly on the pinned origin point — it would just get
    // silently discarded when applyPoints re-pins index 0.
    const clampedX = clamp(x, 0.05, timelineSecondsRef.current);
    const next = [...pointsRef.current, { x: clampedX, y: clamp(y, 0, maxVolumeRef.current) }];
    applyPoints(next);
  }

  function removePointAt(index) {
    if (index === 0) return; // the origin point is pinned, not removable
    if (pointsRef.current.length <= 2) return; // always need at least a start and end point
    applyPoints(pointsRef.current.filter((_, i) => i !== index));
  }

  function extendTimeline() {
    const grown = timelineSecondsRef.current + TIMELINE_STEP_SECONDS;
    timelineSecondsRef.current = grown;
    setTimelineSeconds(grown);
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.options.scales.x.max = grown;
      chart.update();
    }
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
            label: "Volume alvo (mL)",
            data: pointsRef.current,
            borderColor: "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(128, 128, 128, 0.25)",
            fill: true,
            borderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "rgba(0, 0, 0, 1)",
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
            onDragEnd: () => {
              applyPoints([...chart.data.datasets[0].data]);
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: timelineSecondsRef.current,
            grid: { display: false },
            title: { display: true, text: "Tempo (s)" },
          },
          y: {
            min: 0,
            max: maxVolumeRef.current,
            grid: { display: false },
            title: { display: true, text: "Volume alvo (mL)" },
          },
        },
        elements: {
          line: { tension: 0.1 },
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) return; // clicking an existing point is for dragging, not adding
          const x = chart.scales.x.getValueForPixel(evt.x);
          const y = chart.scales.y.getValueForPixel(evt.y);
          addPoint(x, y);
        },
      },
    });

    function handleDoubleClick(nativeEvent) {
      const hits = chart.getElementsAtEventForMode(nativeEvent, "nearest", { intersect: true }, true);
      if (hits.length > 0) {
        removePointAt(hits[0].index);
      }
    }

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener("dblclick", handleDoubleClick);
    chartInstanceRef.current = chart;

    return () => {
      canvasEl.removeEventListener("dblclick", handleDoubleClick);
      chart.destroy();
      chartInstanceRef.current = null;
    };
  }, []);

  async function playACB() {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);

    const actions = curveToActions(pointsRef.current);
    for (const action of actions) {
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
    setTimelineSeconds(INITIAL_TIMELINE_SECONDS);
    applyPoints(defaultPoints());
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.options.scales.x.max = INITIAL_TIMELINE_SECONDS;
      chart.update();
    }
  }

  return (
    <div className="main">
      <div className="holder">
        <h2>Shape Editor</h2>
        <p>
          Clique no gráfico para adicionar um ponto, arraste para mover, dê duplo-clique
          para remover. "Play" converte a curva em comandos de inflar/desinflar e toca no
          periférico de verdade. Um trecho mais rápido do que a bomba consegue (3L/min no
          máximo) é automaticamente empurrado no tempo até o ponto ficar fisicamente possível.
        </p>

        <button onClick={isPlaying ? stopACB : playACB}>{isPlaying ? "Stop" : "Play"}</button>
        <button onClick={clearACB} disabled={isPlaying}>
          Limpar
        </button>
        <button onClick={extendTimeline} disabled={isPlaying}>
          +{TIMELINE_STEP_SECONDS}s
        </button>
        <label>
          Volume máximo (mL)
          <input
            type="number"
            min="1"
            value={maxVolume}
            onChange={handleMaxVolumeChange}
            disabled={isPlaying}
          />
        </label>

        <div className="chart" style={{ height: "400px" }}>
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}
