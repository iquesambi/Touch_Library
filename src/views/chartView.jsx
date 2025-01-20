import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./style.css";

export function ScatterChartView() {
  const scatterChartRef = useRef(null);
  const [scatterData, setScatterData] = useState([
    { x: -10, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 5 },
    { x: 0.5, y: 5.5 },
  ]);

  useEffect(() => {
    const scatterCtx = scatterChartRef.current?.getContext("2d");

    if (scatterCtx) {
      const scatterConfig = {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "Scatter Dataset",
              data: scatterData,
              backgroundColor: "rgb(255, 99, 132)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (e) => {
            const canvasPosition = {
              x: e.native.offsetX,
              y: e.native.offsetY,
            };
          
            const xScale = e.chart.scales.x;
            const yScale = e.chart.scales.y;
          
            const xValue = xScale.getValueForPixel(canvasPosition.x);
            const yValue = yScale.getValueForPixel(canvasPosition.y);
          
            // Add the new point
            setScatterData((prev) => [...prev, { x: xValue, y: yValue }]);
          },
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
              border: { width: 3, color: "black" },
            },
            y: {
              type: "linear",
              display: true,
              position: "center",
              grid: { display: false },
              ticks: { display: false },
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
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.lineWidth = 2;
              ctx.strokeStyle = "rgba(0, 0, 0, 1)";
              ctx.stroke();

              ctx.font = "16px Arial";
              ctx.fillStyle = "black";
              ctx.textAlign = "center";

              ctx.save();
              ctx.translate(centerX - 5, chartArea.top + 70);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText("High Arousal", 0, 0);
              ctx.restore();

              ctx.save();
              ctx.translate(centerX + 5, chartArea.bottom - 70);
              ctx.rotate(Math.PI / 2);
              ctx.fillText("Low Arousal", 0, 0);
              ctx.restore();

              ctx.fillText("Pleasure", chartArea.right - 60, centerY - 5);
              ctx.fillText("Displeasure", chartArea.left + 70, centerY - 5);

              ctx.restore();
            },
          },
        ],
      };

      const scatterChart = new Chart(scatterCtx, scatterConfig);

      return () => {
        scatterChart.destroy();
      };
    }
  }, [scatterData]);

  return (
    <div className="scatter-chart-container">
      <h2>Interactive Scatter Chart</h2>
      <canvas ref={scatterChartRef} className="scatter-chart"></canvas>
      <p>Click on the chart to add new points.</p>
    </div>
  );
}
