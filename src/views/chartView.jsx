import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { db } from "../../firebaseModel"; // Ensure you import Firestore db
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import "./style.css";

export function ScatterChartView(props) {
  const scatterChartRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const scatterChartInstance = useRef(null);
  const [scatterData, setScatterData] = useState([]);

  const drawBackground = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.1;

    // Draw Circle (first, so it's behind the axes)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.stroke();

    // Draw X-axis (over the circle)
    ctx.beginPath();
    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Draw Y-axis (over the circle)
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, height - 20);
    ctx.stroke();

    // Labels
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    // Pleasure (Right)
    ctx.fillText("Pleasure", width - 60, centerY - 5);

    // Displeasure (Left)
    ctx.fillText("Displeasure", 60, centerY - 5);

    // High Arousal (Top) - Vertical
    ctx.save();
    ctx.translate(centerX - 5, 50);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("High Arousal", 0, 0);
    ctx.restore();

    // Low Arousal (Bottom) - Vertical
    ctx.save();
    ctx.translate(centerX + 5, height - 50);
    ctx.rotate(Math.PI / 2);
    ctx.fillText("Low Arousal", 0, 0);
    ctx.restore();
  };

  const saveChartData = async () => {
    const touch = props.touch; // Use touch prop as the name
    if (scatterData.length === 0 || !touch) {
      alert("Please provide a valid touch name and add some points to the chart.");
      return;
    }

    const touchRef = doc(db, "touches", touch); // Firestore document reference
    const touchData = {
      name: touch,
      data: scatterData,
    };

    try {
      await setDoc(touchRef, touchData, { merge: true }); // Save the chart data to Firestore
      
        if (confirm("saved") == true) {
          window.location.hash = "#/";
        } else {
          
        }
        return;
    } catch (error) {
      console.error("Error saving chart data:", error);
    }
  };

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
              pointRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          onClick: (e) => {
            if (!scatterChartInstance.current) return;
            const chart = scatterChartInstance.current;

            // Get clicked position in chart coordinates
            const xValue = chart.scales.x.getValueForPixel(e.x);
            const yValue = chart.scales.y.getValueForPixel(e.y);

            if (xValue !== undefined && yValue !== undefined) {
              setScatterData([{ x: xValue, y: yValue }]); // Replace previous point
            }
          },
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { type: "linear", display: false, min: -1, max: 1 },
            y: { type: "linear", display: false, min: -1, max: 1 },
          },
        },
      };

      if (scatterChartInstance.current) {
        scatterChartInstance.current.destroy();
      }

      scatterChartInstance.current = new Chart(scatterCtx, scatterConfig);

      return () => {
        scatterChartInstance.current.destroy();
      };
    }
  }, [scatterData]);

  useEffect(() => {
    drawBackground();
  }, []);

  return (
    <div className="scatter-chart-container">
      <h2>Interactive Scatter Chart</h2>
      <div style={{ position: "relative", width: "500px", height: "500px" }}>
        <canvas
          ref={overlayCanvasRef}
          width={500}
          height={500}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        ></canvas>
        <canvas
          ref={scatterChartRef}
          width={500}
          height={500}
          style={{ position: "absolute", top: 0, left: 0 }}
        ></canvas>
      </div>
      <p>Click on the chart to place a single point. Clicking again moves it.</p>

      <button onClick={saveChartData}>Save Chart Data</button>
    </div>
  );
}
