import React, { useEffect, useRef, useState } from "react";
import { toJS } from "mobx";
import { db } from "../../firebaseModel";
import { doc, setDoc } from "firebase/firestore";
import { Chart } from "chart.js/auto";
import {
    VIEW_MODES,
    getRecordingStartMs,
    computeNetVolumeSeries,
    computePressurePoints,
    buildChartUpdate,
    baseChartOptions,
} from "./touchChartConfig";
import "./style.css";
import { t } from "../i18n";

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
    // Mirrors `recording`/`viewMode` state into refs: the live-update interval and its
    // renderChart closure are created once per recording session, so reading React
    // state directly inside it would always see the stale value from when it started.
    const recordingRef = useRef(false);
    const viewModeRef = useRef(VIEW_MODES.FLOW);

    function renderChart() {
        const chart = chartInstanceRef.current;
        if (!chart || !props.model) return;

        const mode = viewModeRef.current;
        const events = toJS(props.model.sequence) || [];
        const pressureSamples = toJS(props.model.pressureArray) || [];
        const t0 = getRecordingStartMs(events, pressureSamples);
        const nowMs = t0 !== null ? Date.now() - t0 : undefined;
        const volumePoints = computeNetVolumeSeries(events, t0, recordingRef.current ? nowMs : undefined);
        const pressurePoints = computePressurePoints(pressureSamples, t0, { requireFullBaseline: true });

        const { datasets, scaleY, scaleY1 } = buildChartUpdate(mode, volumePoints, pressurePoints, props.language);
        chart.data.datasets = datasets;
        chart.options.scales.y = scaleY;
        if (scaleY1) {
            chart.options.scales.y1 = scaleY1;
        } else {
            delete chart.options.scales.y1;
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
            alert(t("fill_name_description_alert", props.language));
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
                            label: t("chart_air_volume_label", props.language),
                            data: [],
                            borderColor: "rgba(0, 0, 0, 1)",
                            backgroundColor: "rgba(128, 128, 128, 0.25)",
                            fill: true,
                            borderWidth: 2,
                            pointRadius: 0,
                        },
                    ],
                },
                options: baseChartOptions(),
            };

            const lineChart = new Chart(lineCtx, lineConfig);
            chartInstanceRef.current = lineChart;

            return () => {
                clearInterval(pressureIntervalRef.current);
                lineChart.destroy();
                chartInstanceRef.current = null;
            };
        }
    }, [props.language]);

    return (
        <div className="main">
            <div className="holder">
                <input
                    type="text"
                    placeholder={t("touch_name_placeholder", props.language)}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    onClick={saveACB}
                    disabled={!name || !description || touches.length === 0}
                >
                    {t("save_button", props.language)}
                </button>
                <button onClick={toggleRecording}>
                    {recording ? t("stop_recording", props.language) : t("start_recording", props.language)}
                </button>
                <button onClick={toggleReplay}>
                    {replaying ? t("stop_button", props.language) : t("replay_button", props.language)}
                </button>

                <select value={viewMode} onChange={handleViewModeChange}>
                    <option value={VIEW_MODES.FLOW}>{t("flow_mode", props.language)}</option>
                    <option value={VIEW_MODES.PRESSURE}>{t("pressure_mode", props.language)}</option>
                    <option value={VIEW_MODES.BOTH}>{t("both_mode", props.language)}</option>
                </select>

                <div className="chart">
                    <canvas ref={lineChartRef}></canvas>
                </div>

              

                <div className="bottom_form">
                    <label>{t("author_label", props.language)}</label>
                    <input className="author" value={props.userName} readOnly />
                    <textarea
                        maxLength="200"
                        placeholder={t("description_placeholder", props.language)}
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
