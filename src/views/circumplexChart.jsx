import React, { useState, useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import "./style.css";
import { t } from "../i18n";

Chart.register(zoomPlugin);

// Radius (in data units) of the Russell circumplex boundary circle — matches
// the axes' initial -15..15 range.
const CIRCLE_RADIUS = 15;
const ZOOM_STEP_FACTOR = 1.3;

// Renders the Russell circumplex (valence/arousal) scatter chart: each touch
// is a point at {id, name, description, x, y}. Clicking a point calls
// onPointClick(point). Shared between the library's "graph" view mode and
// anywhere else that wants the same chart.
export function CircumplexChart({ points, onPointClick, language }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const chartConfig = {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Scatter Dataset",
            data: points,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false, // Disable default tooltip
            external: function (context) {
              const tooltipModel = context.tooltip;

              let tooltip = document.getElementById("chartjs-tooltip");
              if (!tooltip) {
                tooltip = document.createElement("div");
                tooltip.id = "chartjs-tooltip";
                tooltip.classList.add("tooltip");
                document.body.appendChild(tooltip);
              }

              if (tooltipModel.opacity === 0) {
                // This is the actual show/hide switch — without it the div
                // stays visible forever after the first hover, since it's a
                // detached DOM node React state alone can't reach.
                tooltip.style.opacity = 0;
                tooltip.style.pointerEvents = "none";
                setTooltipVisible(false);
                return;
              }

              const position = context.chart.canvas.getBoundingClientRect();
              tooltip.style.opacity = 1;
              tooltip.style.pointerEvents = "auto";
              tooltip.style.left = position.left + tooltipModel.caretX + "px";
              tooltip.style.top = position.top + tooltipModel.caretY + "px";

              const data = tooltipModel.dataPoints[0].raw;
              tooltip.innerHTML = `
                <div class="tooltip-title">${data.name} (${data.x}, ${data.y})</div>
                <div class="tooltip-description">${data.description}</div>
              `;

              setTooltipVisible(true);
            },
          },
          zoom: {
            pan: { enabled: true, mode: "xy" },
            zoom: {
              // Wheel zoom is off on purpose — scrolling the page over the
              // chart shouldn't accidentally zoom it. Zoom is button-driven;
              // pinch stays on since that's a deliberate touch gesture, not
              // an incidental scroll.
              wheel: { enabled: false },
              pinch: { enabled: true },
              mode: "xy",
            },
            limits: {
              // Generous outer bound so "Zoom -" doesn't feel capped after a
              // handful of clicks; minRange just stops zooming in to nothing.
              x: { min: -150, max: 150, minRange: 2 },
              y: { min: -150, max: 150, minRange: 2 },
            },
          },
        },
        scales: {
          // display:false hides Chart.js's own axis rendering entirely — its
          // position:'center' border line doesn't reliably reposition during
          // zoom-plugin-driven pan/zoom (a known interaction between the
          // two), which is why the crosshair used to look stuck while the
          // points moved underneath it. The crosshair is drawn manually in
          // the backgroundCircle plugin below, from the same
          // getPixelForValue() calls the points themselves use, so it's
          // guaranteed to stay in sync with the data.
          x: { type: "linear", display: false, min: -CIRCLE_RADIUS, max: CIRCLE_RADIUS },
          y: { type: "linear", display: false, min: -CIRCLE_RADIUS, max: CIRCLE_RADIUS },
        },
        onClick: (_evt, elements) => {
          if (elements.length === 0) return;
          const point = pointsRef.current[elements[0].index];
          if (point && onPointClick) onPointClick(point);
        },
        onHover: (evt, elements) => {
          evt.native.target.style.cursor = elements.length > 0 ? "pointer" : "default";
        },
      },
      plugins: [
        {
          id: "backgroundCircle",
          // Drawn from actual data coordinates (via the scales' pixel
          // mapping) rather than fixed chartArea fractions, so the circle
          // and its labels shrink/move correctly as the chart is zoomed or
          // panned instead of staying glued to the canvas edges.
          beforeDraw: (chart) => {
            const { ctx, scales } = chart;
            const { x: xScale, y: yScale } = scales;

            const toPixel = (dataX, dataY) => ({
              x: xScale.getPixelForValue(dataX),
              y: yScale.getPixelForValue(dataY),
            });

            const center = toPixel(0, 0);
            const edge = toPixel(CIRCLE_RADIUS, 0);
            const radiusPx = Math.abs(edge.x - center.x);

            ctx.save();

            // Crosshair (Pleasure/Displeasure and High/Low Arousal axis
            // lines), drawn through data (0,0) and bounded to the circle's
            // diameter (not the canvas edges) so it moves AND scales in
            // lockstep with the points and the circle under pan/zoom,
            // instead of always stretching edge-to-edge regardless of zoom.
            const left = toPixel(-CIRCLE_RADIUS, 0);
            const right = toPixel(CIRCLE_RADIUS, 0);
            const top = toPixel(0, CIRCLE_RADIUS);
            const bottom = toPixel(0, -CIRCLE_RADIUS);

            ctx.beginPath();
            ctx.moveTo(left.x, center.y);
            ctx.lineTo(right.x, center.y);
            ctx.moveTo(center.x, top.y);
            ctx.lineTo(center.x, bottom.y);
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(0, 0, 0, 1)";
            ctx.stroke();

            ctx.font = "16px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";

            const labelInset = CIRCLE_RADIUS * 0.85;

            const highArousal = toPixel(0, labelInset);
            ctx.save();
            ctx.translate(highArousal.x, highArousal.y);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(t("high_arousal", language), 0, 0);
            ctx.restore();

            const lowArousal = toPixel(0, -labelInset);
            ctx.save();
            ctx.translate(lowArousal.x, lowArousal.y);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(t("low_arousal", language), 0, 0);
            ctx.restore();

            const pleasure = toPixel(labelInset, 0);
            ctx.fillText(t("pleasure", language), pleasure.x, pleasure.y - 5);

            const displeasure = toPixel(-labelInset, 0);
            ctx.fillText(t("displeasure", language), displeasure.x, displeasure.y - 5);

            ctx.restore();
          },
        },
      ],
    };

    const chart = new Chart(ctx, chartConfig);
    chartInstanceRef.current = chart;

    return () => {
      chart.destroy();
      chartInstanceRef.current = null;
      // The tooltip is appended directly to document.body, outside React's
      // tree, so nothing else ever removes it — without this it stays
      // floating on top of whatever page/view you switch to next.
      document.getElementById("chartjs-tooltip")?.remove();
    };
  }, [points, language]);

  const handleClickOutsideTooltip = (e) => {
    if (!document.getElementById("chartjs-tooltip")?.contains(e.target)) {
      setTooltipVisible(false);
    }
  };

  useEffect(() => {
    if (tooltipVisible) {
      window.addEventListener("mousedown", handleClickOutsideTooltip);
    } else {
      window.removeEventListener("mousedown", handleClickOutsideTooltip);
    }
    return () => window.removeEventListener("mousedown", handleClickOutsideTooltip);
  }, [tooltipVisible]);

  const zoomButtonStyle = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div className="chart-container" style={{ height: "100vh" }}>
        <canvas ref={chartRef} className="circular-chart"></canvas>
      </div>
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 20,
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button style={zoomButtonStyle} onClick={() => chartInstanceRef.current?.zoom(ZOOM_STEP_FACTOR)}>
          +
        </button>
        <button style={zoomButtonStyle} onClick={() => chartInstanceRef.current?.zoom(1 / ZOOM_STEP_FACTOR)}>
          -
        </button>
      </div>
    </div>
  );
}
