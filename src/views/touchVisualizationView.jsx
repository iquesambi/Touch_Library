import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseModel";
import { doc, getDoc } from "firebase/firestore";
import "./style.css";

export function VisualizationView(props) {
  const lineChartRef = useRef(null);
  const scatterChartRef = useRef(null);
  const { id } = useParams(); // Get ID from URL params
  const [touchData, setTouchData] = useState(null); // To store Firestore data
  const [selectedImage, setSelectedImage] = useState(null);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const defaultImage = "../../img.png"; // Default image URL
  const images = new Array(12).fill(defaultImage); // Array of default images

  // Fetch Firestore data based on the ID
  useEffect(() => {
    const fetchTouchData = async () => {
      try {
        const docRef = doc(db, "touches", id); // Use URL-safe ID
        const docSnap = await getDoc(docRef);

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

  // Initialize line chart
  useEffect(() => {
    const lineCtx = lineChartRef.current?.getContext("2d");

    if (lineCtx) {
      const lineData = {
        labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        datasets: [
          {
            label: "Pressure over Time",
            data: [12, 19, 3, 5, 2, 2, 12, 19, 3, 10, 10],
            borderColor: "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(241, 245, 249, 1)",
            fill: true,
            borderWidth: 3,
          },
        ],
      };

      const lineConfig = {
        type: "line",
        data: lineData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
          elements: {
            line: { tension: 0.1 },
          },
        },
      };

      const lineChart = new Chart(lineCtx, lineConfig);

      return () => {
        lineChart.destroy();
      };
    }
  }, []);

  // Initialize scatter chart when visible
  useEffect(() => {
    const scatterCtx = scatterChartRef.current?.getContext("2d");

    if (isChartVisible && scatterCtx) {
      const scatterData = {
        datasets: [
          {
            label: 'Scatter Dataset',
            data: [
              { x: touchData.data[0].x, y: touchData.data[0].y },
              
            ],
            backgroundColor: 'rgb(255, 99, 132)',
          },
        ],
      };

      const scatterConfig = {
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

              // Draw axis labels
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

      const scatterChart = new Chart(scatterCtx, scatterConfig);

      return () => {
        scatterChart.destroy();
      };
    }
  }, [isChartVisible]);

  function handleImageClick(image) {
    setSelectedImage(image);
  }

  function closeImage(e) {
    // Close only when clicking on the top part of the modal
    if (e.target.classList.contains("lightbox")) {
      setSelectedImage(null);
    }
  }

  return (
    <div className="main">
      <div className="holder">
        <h2>{touchData ? touchData.name : "Loading..."}</h2>
        <p><strong>Author:</strong> {touchData ? touchData.userName : "Loading..."}</p>
        <p>{touchData ? touchData.description : "Loading..."}</p>

        <button>Play</button>

        <div className="chart">
          <canvas ref={lineChartRef}></canvas>
        </div>

        <div className="dropdown">
          russell circumplex model
          <button onClick={() => setIsChartVisible(!isChartVisible)}>
            Open
          </button>
          {isChartVisible && (
            <div>
              <canvas ref={scatterChartRef} className="visualization__chart-two"></canvas>
            </div>
          )}
        </div>

        <div className="dropdown">
          Media Gallery
          <button onClick={() => setIsGalleryVisible(!isGalleryVisible)}>
            Open
          </button>

          {isGalleryVisible && (
            <div className="gallery-grid">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="thumbnail"
                  onClick={() => handleImageClick(image)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="lightbox" onClick={closeImage}>
            <img src={selectedImage} alt="Enlarged view" className="enlarged-image" />
          </div>
        )}
      </div>
    </div>
  );
}
