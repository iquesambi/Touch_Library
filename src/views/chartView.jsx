import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./style.css";

export function ScatterChartView() {
  const chartRef = useRef(null);
  const [scatterData, setScatterData] = useState([{ x: 0, y: 0 }]);

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");

    if (ctx) {
      const chartData = {
        datasets: [
          {
            label: "Scatter Dataset",
            data: scatterData,
            backgroundColor: "rgb(255, 99, 132)",
        
          },
        ],
      };

      const chartConfig = {
        type: "scatter",
        data: chartData,
        options: {
          events: ['click'],
          onClick: (e) => {
            if (!chartRef.current) return;
            const chart = Chart.getChart(chartRef.current);
            if (!chart) return;

            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            const radius = Math.min(chart.chartArea.width, chart.chartArea.height) / 2.1;

            const xPixel = e.x;
            const yPixel = e.y;

            const distance = Math.sqrt(
              Math.pow(xPixel - centerX, 2) + Math.pow(yPixel - centerY, 2)
            );

            if (distance <= radius) {
              const xValue = chart.scales.x.getValueForPixel(xPixel);
              const yValue = chart.scales.y.getValueForPixel(yPixel);

              if (xValue !== undefined && yValue !== undefined) {
                console.log("Clicked Point:", { x: xValue, y: yValue });
                setScatterData([{ x: xValue, y: yValue }]);
              }
            } else {
              console.log("Click outside the circle");
            }
          },
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
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

      const circularChart = new Chart(ctx, chartConfig);

      return () => {
        circularChart.destroy();
      };
    }
  }, [scatterData]);

  return (
    <div className="chart-container">
      <canvas ref={chartRef} className="circular-chart"></canvas>
    </div>
  );
}