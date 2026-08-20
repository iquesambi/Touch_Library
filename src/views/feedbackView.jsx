import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseModel";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./style.css";
import { t } from "../i18n";

// Public feedback: anyone who's logged in can play back a saved touch,
// describe what they felt, and drop a point on the Russell circumplex map.
// Each submission is its own document in touches/{id}/feedback — unlike the
// chart in chartView.jsx (used once by the touch's own author to set its
// canonical mood coordinate), this never overwrites the touch itself, so
// many people's feedback can coexist independently.
export function FeedbackView(props) {
  const { id } = useParams();
  const chartRef = useRef(null);
  const [touchData, setTouchData] = useState(null);
  const [point, setPoint] = useState(null); // { x, y } | null until the user clicks the map
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const roundToTwoDecimals = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    const fetchTouchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "touches", id));
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

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const chartConfig = {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Feedback point",
            data: point ? [point] : [],
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          },
        ],
      },
      options: {
        events: ["click"],
        onClick: (e) => {
          const chart = Chart.getChart(chartRef.current);
          if (!chart) return;

          const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
          const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
          const radius = Math.min(chart.chartArea.width, chart.chartArea.height) / 2.1;

          const distance = Math.sqrt(
            Math.pow(e.x - centerX, 2) + Math.pow(e.y - centerY, 2)
          );

          if (distance <= radius) {
            const xValue = roundToTwoDecimals(chart.scales.x.getValueForPixel(e.x));
            const yValue = roundToTwoDecimals(chart.scales.y.getValueForPixel(e.y));
            setPoint({ x: xValue, y: yValue });
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
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

            ctx.font = "16px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";

            ctx.save();
            ctx.translate(centerX - 5, chartArea.top + 70);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(t("high_arousal", props.language), 0, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(centerX + 5, chartArea.bottom - 70);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(t("low_arousal", props.language), 0, 0);
            ctx.restore();

            ctx.fillText(t("pleasure", props.language), chartArea.right - 60, centerY - 5);
            ctx.fillText(t("displeasure", props.language), chartArea.left + 70, centerY - 5);

            ctx.restore();
          },
        },
      ],
    };

    const chart = new Chart(ctx, chartConfig);
    return () => chart.destroy();
  }, [point, props.language]);

  const handleSubmit = async () => {
    if (!point) {
      alert(t("feedback_missing_coordinate_alert", props.language));
      return;
    }
    if (!feedbackText.trim()) {
      alert(t("feedback_missing_text_alert", props.language));
      return;
    }

    try {
      await addDoc(collection(db, "touches", id, "feedback"), {
        x: point.x,
        y: point.y,
        text: feedbackText,
        userName: props.userName,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  if (!props.userName) {
    return (
      <div className="main">
        <div className="holder">
          <h2>{t("feedback_title", props.language)}</h2>
          <p>{t("feedback_login_required", props.language)}</p>
          <button onClick={props.onLoginClick}>{t("login", props.language)}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="holder">
        <h2>{touchData ? touchData.name : t("loading_label", props.language)}</h2>

        {submitted ? (
          <p>{t("feedback_thanks", props.language)}</p>
        ) : (
          <>
            <p>{t("feedback_intro", props.language)}</p>

            <button onClick={() => props.onPlay(touchData?.sequence)} disabled={!touchData?.sequence}>
              {t("play", props.language)}
            </button>

            <textarea
              placeholder={t("feedback_placeholder", props.language)}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="sensation-input"
              rows={4}
            />

            <p>{t("pick_coordinate_hint", props.language)}</p>

            <div style={{ position: "relative", height: "400px" }}>
              <canvas ref={chartRef} className="circular-chart"></canvas>
            </div>

            <button onClick={handleSubmit}>{t("submit_feedback_button", props.language)}</button>
          </>
        )}
      </div>
    </div>
  );
}
