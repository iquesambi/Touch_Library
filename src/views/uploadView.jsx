import React, { useEffect, useRef, useState } from "react";
import { toJS } from "mobx";
import { db } from "../../firebaseModel";
import { doc, setDoc } from "firebase/firestore";
import { Chart } from "chart.js/auto";
import "./style.css";

// Arduino streams pressure readings at 20Hz (every 50ms) while listening.
const PRESSURE_SAMPLE_INTERVAL_MS = 50;
// Chart is drawn from every 3rd sample to stay readable; the saved sequence still keeps all 20Hz samples.
const CHART_DOWNSAMPLE_FACTOR = 3;
// Average this many initial samples (250ms) for the baseline, so a single noisy
// reading can't skew the whole chart's tare.
const BASELINE_SAMPLE_COUNT = 5;
// Sensor noise floor when idle: swings this far from baseline get clamped to 0
// so a resting sensor reads as a flat line instead of jittering.
const PRESSURE_DEADBAND_PSI = 0.03;

// Pump spec: 3 L/min at 100% speed (MIDI velocity 127). Flow is assumed linear
// with velocity, and the pneumatic circuit is treated as a closed system, so
// volume in/out is just flow rate integrated over how long each button was held.
const MAX_FLOW_ML_PER_MIN = 3000;
const MAX_VELOCITY = 127;

const VIEW_MODES = {
    FLOW: "flow",
    PRESSURE: "pressure",
    BOTH: "both",
};

function round1(n) {
    return Math.round(n * 10) / 10;
}

// Turns the recorded inflate/deflate press-release events into a single net
// air-volume series in mL over time: it rises while inflating, falls while
// deflating, and can't go below 0 (closed system, so it can't vent air it
// never had).
function computeNetVolumeSeries(events, nowMs) {
    const zero = [{ x: 0, y: 0 }];
    if (!events || events.length === 0) {
        return zero;
    }

    const t0 = events[0].timestamp - events[0].interval;

    let volume = 0;
    let activeAction = null; // "inflate" | "deflate" | null
    let activeVelocity = 0;
    let lastTMs = 0;

    const points = [{ x: 0, y: 0 }];

    function advanceTo(tMs) {
        const dtMs = tMs - lastTMs;
        if (dtMs > 0 && activeAction) {
            const mlPerMs = (MAX_FLOW_ML_PER_MIN * (activeVelocity / MAX_VELOCITY)) / 60000;
            const delta = mlPerMs * dtMs;
            volume += activeAction === "inflate" ? delta : -delta;
            volume = Math.max(volume, 0);
        }
        lastTMs = tMs;
    }

    for (const ev of events) {
        if (ev.button !== "inflate" && ev.button !== "deflate") continue;

        const tMs = ev.timestamp - t0;
        advanceTo(tMs);
        points.push({ x: tMs / 1000, y: round1(volume) });

        if (ev.type === "press") {
            activeAction = ev.button;
            activeVelocity = ev.pot || 0;
        } else if (ev.type === "release") {
            activeAction = null;
            activeVelocity = 0;
        }
    }

    if (typeof nowMs === "number" && nowMs > lastTMs) {
        advanceTo(nowMs);
        points.push({ x: nowMs / 1000, y: round1(volume) });
    }

    return points;
}

export function UploadView(props) {
    const lineChartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [recording, setRecording] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [touches, setTouches] = useState([]);
    const [viewMode, setViewMode] = useState(VIEW_MODES.FLOW);
    const pressureIntervalRef = useRef(null);
    // Baseline (ambient) reading captured at the start of the recording, so the
    // chart shows pressure change relative to rest instead of raw atmospheric PSI.
    const baselinePressureRef = useRef(null);
    // Mirrors `recording`/`viewMode` state into refs: the live-update interval and its
    // renderChart closure are created once per recording session, so reading React
    // state directly inside it would always see the stale value from when it started.
    const recordingRef = useRef(false);
    const viewModeRef = useRef(VIEW_MODES.FLOW);

    function getPressurePoints() {
        const pressureValues = toJS(props.model?.pressureArray) || [];
        if (pressureValues.length === 0) return [];

        if (baselinePressureRef.current === null) {
            if (pressureValues.length < BASELINE_SAMPLE_COUNT) return []; // wait for enough samples to average
            const initialSamples = pressureValues.slice(0, BASELINE_SAMPLE_COUNT);
            baselinePressureRef.current =
                initialSamples.reduce((sum, v) => sum + v, 0) / initialSamples.length;
        }
        const baseline = baselinePressureRef.current;

        const points = [];
        for (let i = 0; i < pressureValues.length; i += CHART_DOWNSAMPLE_FACTOR) {
            const delta = pressureValues[i] - baseline;
            points.push({
                x: (i * PRESSURE_SAMPLE_INTERVAL_MS) / 1000,
                y: Math.abs(delta) < PRESSURE_DEADBAND_PSI ? 0 : parseFloat(delta.toFixed(3)),
            });
        }
        return points;
    }

    function renderChart() {
        const chart = chartInstanceRef.current;
        if (!chart || !props.model) return;

        const mode = viewModeRef.current;
        const events = toJS(props.model.sequence) || [];
        const nowMs = events.length ? Date.now() - (events[0].timestamp - events[0].interval) : undefined;
        const volumePoints = computeNetVolumeSeries(events, recordingRef.current ? nowMs : undefined);
        const pressurePoints = getPressurePoints();

        const overlaying = mode === VIEW_MODES.BOTH;

        const volumeDataset = {
            label: "Ar na câmara (mL)",
            data: volumePoints,
            borderColor: overlaying ? "rgb(220, 30, 30)" : "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(128, 128, 128, 0.25)",
            fill: mode === VIEW_MODES.FLOW,
            borderWidth: 2,
            pointRadius: 0,
            yAxisID: "y",
        };
        const pressureDataset = {
            label: "Pressão interna (PSI)",
            data: pressurePoints,
            borderColor: "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(128, 128, 128, 0.25)",
            fill: mode === VIEW_MODES.PRESSURE,
            borderWidth: 2,
            borderDash: overlaying ? [5, 3] : undefined,
            pointRadius: 1,
            yAxisID: overlaying ? "y1" : "y",
        };

        if (mode === VIEW_MODES.FLOW) {
            chart.data.datasets = [volumeDataset];
            chart.options.scales.y = { display: false, beginAtZero: true };
            delete chart.options.scales.y1;
        } else if (mode === VIEW_MODES.PRESSURE) {
            chart.data.datasets = [pressureDataset];
            chart.options.scales.y = { display: false };
            delete chart.options.scales.y1;
        } else {
            chart.data.datasets = [volumeDataset, pressureDataset];
            chart.options.scales.y = { display: false, beginAtZero: true };
            chart.options.scales.y1 = { display: false };
        }

        chart.update("none");
    }

    function toggleRecording() {
        if (recording) {
            recordingRef.current = false;
            props.stop();
            clearInterval(pressureIntervalRef.current);
            pressureIntervalRef.current = null;
            props.toggleListen()
            setRecording(false);
            setTimeout(renderChart, 0); // capture any samples/events missed by the last poll

            setTimeout(() => {
                const updatedTouches = toJS(props.sequence);
                setTouches(updatedTouches);
            }, 0);
        } else {
            baselinePressureRef.current = null;
            recordingRef.current = true;
            props.start();
            props.toggleListen()
            setRecording(true);
            renderChart(); // clear the chart immediately instead of showing the previous recording briefly

            pressureIntervalRef.current = setInterval(renderChart, 100);
        }
    }

    function handleViewModeChange(evt) {
        viewModeRef.current = evt.target.value;
        setViewMode(evt.target.value);
        renderChart();
    }

    function toggleReplay() {
        if (!replaying) {
            props.replay();
            setReplaying(true);
        } else {
            props.stopReplay();
            setReplaying(false);
        }
    }

    function saveACB() {
        if (!name || !description) {
            alert("Please fill in the name and description.");
            return;
        }

        const touches = toJS(props.sequence);
        const touchRef = doc(db, "touches", name);

        const touchData = {
            name: name,
            description: description,
            userName: props.userName,
            createdAt: new Date(),
            sequence: touches,
            pressure: toJS(props.pressureArray),
        };

        console.log("Saving data:", touchData);

        setDoc(touchRef, touchData)
            .then(() => {
                console.log("Touch metadata saved successfully");
                clearForm();
                window.location.hash = `#/chart?name=${encodeURIComponent(name)}`;
            })
            .catch((error) => {
                console.error("Error saving touch data:", error);
            });

        if (props.ChangeTouchName) {
            props.ChangeTouchName(name);
        }
    }

    function clearForm() {
        setName('');
        setDescription('');
    }

    useEffect(() => {
        const lineCtx = lineChartRef.current?.getContext("2d");

        if (lineCtx) {
            const lineConfig = {
                type: "line",
                data: {
                    datasets: [
                        {
                            label: "Ar na câmara (mL)",
                            data: [],
                            borderColor: "rgba(0, 0, 0, 1)",
                            backgroundColor: "rgba(128, 128, 128, 0.25)",
                            fill: true,
                            borderWidth: 2,
                            pointRadius: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    parsing: false,
                    layout: {
                        padding: 0,
                    },
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: true },
                    },
                    scales: {
                        x: { type: "linear", display: false, min: 0 },
                        y: { display: false, beginAtZero: true },
                    },
                    elements: {
                        line: { tension: 0.1 },
                    },
                },
            };

            const lineChart = new Chart(lineCtx, lineConfig);
            chartInstanceRef.current = lineChart;

            return () => {
                clearInterval(pressureIntervalRef.current);
                lineChart.destroy();
                chartInstanceRef.current = null;
            };
        }
    }, []);

    return (
        <div className="main">
            <div className="holder">
                <input
                    type="text"
                    placeholder="Touch name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    onClick={saveACB}
                    disabled={!name || !description || touches.length === 0}
                >
                    Save
                </button>
                <button onClick={toggleRecording}>
                    {recording ? "Stop Recording" : "Start Recording"}
                </button>
                <button onClick={toggleReplay}>
                    {replaying ? "Stop" : "Replay"}
                </button>

                <select value={viewMode} onChange={handleViewModeChange}>
                    <option value={VIEW_MODES.FLOW}>Inflar e desinflar</option>
                    <option value={VIEW_MODES.PRESSURE}>Pressão interna</option>
                    <option value={VIEW_MODES.BOTH}>Ambos sobrepostos</option>
                </select>

                <div className="chart">
                    <canvas ref={lineChartRef}></canvas>
                </div>

              

                <div className="bottom_form">
                    <label>Author</label>
                    <input className="author" value={props.userName} readOnly />
                    <textarea
                        maxLength="200"
                        placeholder="Add a short description here..."
                        rows="5"
                        cols="33"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>
            </div>
        </div>
    );

    function inflateStartACB() {
        props.inflateDown();
    }

    function inflateStopACB() {
        props.inflateUp();
    }

    function deflateStartACB() {
        props.deflateDown();
    }

    function deflateStopACB() {
        props.deflateUp();
    }

    function fulldeflateStartACB() {
        props.deflateDown();
    }

    function fulldeflateStopACB() {
        props.deflateUp();
    }

    function sliderChangeACB(evt) {
        props.potchange(evt.target.value);
    }
}
