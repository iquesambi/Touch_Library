import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./style.css"; // Ensure you have the right styling for centering the chart

export function AnalysisView(props) {
    const data = [
        { x: -10, y: 0, title: 'Dragon Touch', description: 'dragon touch', image: '../../wave.png' },
        { x: 0, y: 10, title: 'Point 2', description: 'This is point 2 description', image: '../../wave.png' },
        { x: 10, y: 5, title: 'Point 3', description: 'This is point 3 description', image: '../../wave.png' },
        { x: 0.5, y: 5.5, title: 'Point 4', description: 'This is point 4 description', image: '../../wave.png' },
      ]
  const chartRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState(null);

  // Initialize the chart
  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");

    if (ctx) {
      const chartData = {
        datasets: [
          {
            label: 'Scatter Dataset',
            data: data,
            backgroundColor: 'rgb(255, 99, 132)',
          },
        ],
      };

      const chartConfig = {
        type: "scatter",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false, // Disable default tooltip
              external: function (context) {
                // Get the tooltip model
                const tooltipModel = context.tooltip;

                if (tooltipModel.opacity === 0) {
                  setTooltipVisible(false); // Hide the tooltip if opacity is 0
                  return;
                }

                const tooltipEl = document.getElementById('chartjs-tooltip');

                // Create tooltip if not exists
                if (!tooltipEl) {
                  const div = document.createElement('div');
                  div.id = 'chartjs-tooltip';
                  div.classList.add('tooltip');
                  document.body.appendChild(div);
                }

                const tooltip = document.getElementById('chartjs-tooltip');
                const { offsetLeft, offsetTop, clientWidth, clientHeight } = context.chart.canvas;

                // Set position of the tooltip
                const position = context.chart.canvas.getBoundingClientRect();
                tooltip.style.left = position.left + tooltipModel.caretX + 'px';
                tooltip.style.top = position.top + tooltipModel.caretY + 'px';

                // Set content of the tooltip
                const data = tooltipModel.dataPoints[0].raw;
                tooltip.innerHTML = `
                  <div class="tooltip-title">${data.title} (${data.x}, ${data.y})</div>
                  <div class="tooltip-image"><img src="${data.image}" alt="Image" height="100px" /></div>
                  <div class="tooltip-description">${data.description}</div>
                `;

                setTooltipVisible(true);
                setTooltipContent(data);
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              display: true,
              position: 'center',
              grid: { display: false },
              ticks: { display: false },
              min: -15,  // Minimum value for the x-axis
              max: 15,   // Maximum value for the x-axis
              border: { width: 3, color: "black" },
            },
            y: {
              type: "linear",
              display: true,
              position: 'center',
              grid: { display: false },
              ticks: { display: false },
              min: -15,   // Minimum value for the y-axis
              max: 15,   // Maximum value for the y-axis
              border: { width: 3, color: "black" },
            },
          }
          
        },
        plugins: [
          {
            id: "backgroundCircle",
            beforeDraw: (chart) => {
              const { ctx, chartArea } = chart;
              const centerX = (chartArea.left + chartArea.right) / 2;
              const centerY = (chartArea.top + chartArea.bottom) / 2;
              const radius = Math.min(chartArea.width, chartArea.height) / 2.1;

              // Draw the circular outline (stroke only)
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.lineWidth = 2;
              ctx.strokeStyle = "rgba(0, 0, 0, 1)";
              ctx.stroke();

              // Label for the axes
              ctx.font = "16px Arial";
              ctx.fillStyle = "black";
              ctx.textAlign = "center";

              // Label for positive Y axis (High Arousal)
              ctx.save();
              ctx.translate(centerX - 5, chartArea.top + 70);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText("High Arousal", 0, 0);
              ctx.restore();

              // Label for negative Y axis (Low Arousal)
              ctx.save();
              ctx.translate(centerX + 5, chartArea.bottom - 70);
              ctx.rotate(Math.PI / 2);
              ctx.fillText("Low Arousal", 0, 0);
              ctx.restore();

              // Label for positive X axis (Pleasure)
              ctx.fillText("Pleasure", chartArea.right - 60, centerY - 5);

              // Label for negative X axis (Displeasure)
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
  }, []);

  const handleClickOutsideTooltip = (e) => {
    if (!document.getElementById('chartjs-tooltip')?.contains(e.target)) {
      setTooltipVisible(false); // Close the tooltip if clicking outside
    }
  };

  const handleTooltipClick = (hash) => {
    if (tooltipContent) {
      // Handle the navigation or any other functionality you want to implement
      console.log(`Navigating to ${hash}`);
      // You can later replace this with your custom hash navigation logic
      window.location.hash = hash; // Example of setting a hash value
    }
  };

  useEffect(() => {
    if (tooltipVisible) {
      window.addEventListener('mousedown', handleClickOutsideTooltip);
    } else {
      window.removeEventListener('mousedown', handleClickOutsideTooltip);
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutsideTooltip);
    };
  }, [tooltipVisible]);

  return (
    <div className="chart-container">
      <canvas ref={chartRef} className="circular-chart"></canvas>
    </div>
  );
}
