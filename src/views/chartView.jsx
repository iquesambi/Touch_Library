import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { db } from "../../firebaseModel"; // Import your Firestore connection
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import getDoc
import "./style.css";

export function ScatterChartView() {
  const chartRef = useRef(null);
  const [scatterData, setScatterData] = useState([{ x: 0, y: 0 }]);
  const [chartName, setChartName] = useState(""); // State to store the chart name
  const [feltSensation, setFeltSensation] = useState(""); // State for the text input

  const roundToTwoDecimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  useEffect(() => {
    // Get the name from the URL
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
    const nameFromURL = urlParams.get("name");
    if (nameFromURL) {
      setChartName(nameFromURL);
    }

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
          onClick: async (e) => { // Make onClick async to use await
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
              const xValue = roundToTwoDecimals(chart.scales.x.getValueForPixel(xPixel));
              const yValue = roundToTwoDecimals(chart.scales.y.getValueForPixel(yPixel));

              if (xValue !== undefined && yValue !== undefined) {
                console.log("Clicked Point:", { x: xValue, y: yValue });
                const newScatterData = [{ x: xValue, y: yValue }];
                setScatterData(newScatterData);
                // Save to Firestore here, passing the name and felt sensation
                await saveDataToFirestore(nameFromURL, newScatterData, feltSensation);
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

  const saveDataToFirestore = async (name, data, sensation) => {
    try {
      if (!name) {
        console.error("Chart name is undefined or empty.  Cannot save to Firestore.");
        return;
      }
      const touchRef = doc(db, "touches", name);
      const docSnap = await getDoc(touchRef); // Get the current document

      let existingData = {};
      if (docSnap.exists()) {
        existingData = docSnap.data(); // Get the data if it exists
      }

      // Structure the new data as an array of maps, like before
      const newData = data.map(item => ({ x: item.x, y: item.y }));

      // Merge the new data with the existing data.
      const updatedData = {
        ...existingData,
        data: newData,
        feltSensation: sensation, // Save the felt sensation
      };

      await setDoc(touchRef, updatedData);
      console.log("Data saved to Firestore successfully with name:", name);
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
    }
  };

  const handleSaveClick = () => {
    // In a real application, you would perform actual saving logic here.
    console.log("Saving data...");
    console.log("Chart Name:", chartName);
    console.log("Scatter Data:", scatterData);
    console.log("Felt Sensation:", feltSensation);
    // Save to Firestore here!
    saveDataToFirestore(chartName, scatterData, feltSensation);
    // For this example, we'll just simulate navigation to the home page.
    window.location.hash = "#/"; // Navigate to the root path (home page)
  };

  return (
    <div className="chart-container">
      <div style={{ position: 'relative' }}>
        <canvas ref={chartRef} className="circular-chart"></canvas>
       
      </div>
      <textarea // Use textarea for larger text input
        placeholder="Describe your felt sensation"
        value={feltSensation}
        onChange={(e) => setFeltSensation(e.target.value)}
        className="sensation-input"
        rows={4} // Added rows attribute for size
        cols={50}
      />

<button
          onClick={handleSaveClick}
          className="save-button"
       
        >
          Save
        </button>

    </div>
  );
}
