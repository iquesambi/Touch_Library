import React, { useState, useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { db } from "../../firebaseModel"; // Import your Firestore connection
import {
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore"; // Import setDoc
import "./style.css";

export function TestView() {
  const chartRef = useRef(null);
  const [scatterData, setScatterData] = useState([{ x: 0, y: 0 }]);
  const [touches, setTouches] = useState([]);
  const [selectedTouchName, setSelectedTouchName] = useState("");
  const [selectedTouchData, setSelectedTouchData] = useState(null); // To store the sequence of the selected touch
  const [feltSensation, setFeltSensation] = useState("");
  const [testerName, setTesterName] = useState("");
  const [chartName, setChartName] = useState("Test Chart"); // Set a default name

    // Mock playback function (replace with your actual playback logic)
    const playSequence = (sequence) => {
      if (!sequence || sequence.length === 0) {
          console.warn("No sequence to play.");
          return;
      }
      console.log("Playing sequence:", sequence);
      // In a real implementation, you would send this sequence to your hardware
      // or use it to drive a simulation.  For this example, we'll just log it.
      // You might use setTimeout or a more advanced timing mechanism to
      // simulate the playback of the touch events.

      // Example (replace with your actual playback):
      sequence.forEach((event, index) => {
        setTimeout(() => {
          console.log(`Playing event ${index + 1}:`, event);
          //  Here you would update the UI or send commands to your haptic device.
           // For example, you might have a function that updates the scatter plot:
          //  updateScatterPlot(event.x, event.y);  //  assuming your event has x,y
        }, event.interval); // Use the interval from the event
      });
  };

  useEffect(() => {
    const fetchTouches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "touches"));
        const fetchedTouches = querySnapshot.docs.map((doc) => ({
          name: doc.data().name,
          sequence: doc.data().touch, // Assuming 'touch' holds the sequence
          id: doc.id,
        }));
        setTouches(fetchedTouches);
      } catch (error) {
        console.error("Error fetching touches: ", error);
      }
    };

    fetchTouches();
  }, []);

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
          events: ["click"],
          onClick: async (e) => {
            if (!chartRef.current) return;
            const chart = Chart.getChart(chartRef.current);
            if (!chart) return;

            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            const radius =
              Math.min(chart.chartArea.width, chart.chartArea.height) / 2.1;

            const xPixel = e.x;
            const yPixel = e.y;

            const distance = Math.sqrt(
              Math.pow(xPixel - centerX, 2) + Math.pow(yPixel - centerY, 2)
            );

            if (distance <= radius) {
              const xValue = roundToTwoDecimals(
                chart.scales.x.getValueForPixel(xPixel)
              );
              const yValue = roundToTwoDecimals(
                chart.scales.y.getValueForPixel(yPixel)
              );

              if (xValue !== undefined && yValue !== undefined) {
                console.log("Clicked Point:", { x: xValue, y: yValue });
                const newScatterData = [{ x: xValue, y: yValue }];
                setScatterData(newScatterData);
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
              const radius =
                Math.min(chartArea.width, chartArea.height) / 2.1;

              ctx.save();

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

    const handleTouchSelection = (event) => {
        const selectedName = event.target.value;
        setSelectedTouchName(selectedName);
        const selectedTouch = touches.find((touch) => touch.name === selectedName);
        if (selectedTouch) {
            setSelectedTouchData(selectedTouch.sequence);
        } else {
            setSelectedTouchData(null); // Clear previous data
        }
    };

  const handlePlayClick = () => {
        if (selectedTouchData) {
            playSequence(selectedTouchData);
        } else {
            console.warn("No touch sequence selected to play.");
        }
    };

  const roundToTwoDecimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const saveDataToFirestore = async (touchName, data, sensation, tester) => {
    try {
      if (!touchName) {
        console.error(
          "Touch name is undefined or empty.  Cannot save to Firestore."
        );
        return;
      }
      const testDataRef = doc(db, "testData", `${touchName}-${Date.now()}`); // Unique ID

      // Structure the data
      const saveData = {
        testedTouch: touchName,
        testData: data.map((item) => ({ x: item.x, y: item.y })), // Store as array of objects
        feltSensation: sensation,
        testerName: tester,
        timestamp: Date.now(),
      };

      await setDoc(testDataRef, saveData);
      console.log("Test data saved to Firestore successfully for touch:", touchName);
    } catch (error) {
      console.error("Error saving test data to Firestore:", error);
    }
  };

  const handleSaveTest = () => {
    if (!testerName.trim()) {
      alert("Please enter your name before saving the test data.");
      return;
    }
    saveDataToFirestore(selectedTouchName, scatterData, feltSensation, testerName);
    // Optionally, clear the form after saving.
    setFeltSensation("");
    setTesterName("");
    setScatterData([{ x: 0, y: 0 }]); // Reset the chart
  };

  return (
    <div className="test-view">
      <h2>Test a Touch</h2>

      <div className="selection-area">
        <select value={selectedTouchName} onChange={handleTouchSelection}>
          <option value="">Select a Touch</option>
          {touches.map((touch) => (
            <option key={touch.name} value={touch.name}>
              {touch.name}
            </option>
          ))}
        </select>
        <button onClick={handlePlayClick} disabled={!selectedTouchName}>
          Play Touch
        </button>
      </div>

      <div className="chart-container">
        <div style={{ position: "relative" }}>
          <canvas ref={chartRef} className="circular-chart"></canvas>
        </div>
      </div>

      <textarea
        placeholder="Describe your felt sensation"
        value={feltSensation}
        onChange={(e) => setFeltSensation(e.target.value)}
        className="sensation-input"
        rows={4}
        cols={50}
      />

      <input
        type="text"
        placeholder="Your Name"
        value={testerName}
        onChange={(e) => setTesterName(e.target.value)}
        className="tester-name-input"
      />

      <button onClick={handleSaveTest} className="save-test-button">
        Save Test Data
      </button>
    </div>
  );
}

