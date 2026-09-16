import React, { useEffect, useRef, useState } from "react";
import { toJS } from "mobx";
import { Chart } from "chart.js/auto";
import {
    VIEW_MODES,
    getRecordingStartMs,
    computeNetVolumeSeries,
    computePressurePoints,
    buildChartUpdate,
    baseChartOptions,
    INK,
    INK_FILL,
} from "./touchChartConfig";
import "./style.css";
import { t } from "../i18n";

// Floor for the "Air in chamber" gauge, in mL. The bar's ceiling grows past
// this if a recording pushes more air in, so the fill never clips.
const GAUGE_BASE_MAX_ML = 200;

// "Capture from kit" mode of Create an entry, step 1: live recording from the
// physical device, with the air-volume waveform and the chamber gauge merged
// into one bordered block.
export function KitCapturePanel(props) {
    const lineChartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [viewMode, setViewMode] = useState(VIEW_MODES.FLOW);
    const [gauge, setGauge] = useState({ value: 0, max: GAUGE_BASE_MAX_ML });
    const pressureIntervalRef = useRef(null);
    // Mirrors `recording`/`viewMode` into refs: the live-update interval and its
    // renderChart closure are created once per recording session, so reading React
    // state directly inside it would always see the stale value from when it started.
    const recordingRef = useRef(false);
    const viewModeRef = useRef(VIEW_MODES.FLOW);
    const onCapturedRef = useRef(props.onCaptured);
    onCapturedRef.current = props.onCaptured;

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
        chart.options.plugins.legend.display = mode === VIEW_MODES.BOTH;
        chart.options.scales.y = scaleY;
        if (scaleY1) {
            chart.options.scales.y1 = scaleY1;
        } else {
            delete chart.options.scales.y1;
        }

        chart.update("none");

        // The gauge reads the same series as the chart: its last value is the
        // volume currently in the chamber.
        const current = volumePoints.length ? volumePoints[volumePoints.length - 1].y : 0;
        const peak = volumePoints.reduce((max, p) => Math.max(max, p.y), 0);
        setGauge({ value: current, max: Math.max(GAUGE_BASE_MAX_ML, peak) });
    }

    function toggleRecording() {
        if (recording) {
            recordingRef.current = false;
            props.stop();
            clearInterval(pressureIntervalRef.current);
            pressureIntervalRef.current = null;
            props.toggleListen();
            setRecording(false);
            setTimeout(renderChart, 0); // capture any samples/events missed by the last poll
            // Hand the finished take up to the flow so "Save touch" can persist it.
            setTimeout(() => {
                onCapturedRef.current({
                    sequence: toJS(props.model.sequence) || [],
                    pressure: toJS(props.model.pressureArray) || [],
                });
            }, 0);
        } else {
            recordingRef.current = true;
            props.start();
            props.toggleListen();
            setRecording(true);
            renderChart(); // clear the chart immediately instead of briefly showing the previous take
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

    useEffect(() => {
        const lineCtx = lineChartRef.current?.getContext("2d");
        if (!lineCtx) return;

        const lineChart = new Chart(lineCtx, {
            type: "line",
            data: {
                datasets: [
                    {
                        label: t("chart_air_volume_label", props.language),
                        data: [],
                        borderColor: INK,
                        backgroundColor: INK_FILL,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0,
                    },
                ],
            },
            options: baseChartOptions(),
        });
        chartInstanceRef.current = lineChart;
        renderChart(); // show whatever is already in the model (e.g. after a step change)

        return () => {
            clearInterval(pressureIntervalRef.current);
            lineChart.destroy();
            chartInstanceRef.current = null;
        };
    }, [props.language]);

    const gaugePercent = Math.min(100, (gauge.value / gauge.max) * 100);

    return (
        <div className="tl-stack">
            <div className="tl-row">
                <button className="tl-btn" onClick={toggleRecording}>
                    {recording ? t("stop_recording", props.language) : t("start_recording", props.language)}
                </button>
                <button className="tl-btn tl-btn--outline" onClick={toggleReplay}>
                    {replaying ? t("stop_button", props.language) : t("replay_button", props.language)}
                </button>
            </div>

            <div className="tl-chartblock">
                <select
                    className="tl-select tl-chartblock__select"
                    value={viewMode}
                    onChange={handleViewModeChange}
                >
                    <option value={VIEW_MODES.FLOW}>{t("flow_mode", props.language)}</option>
                    <option value={VIEW_MODES.PRESSURE}>{t("pressure_mode", props.language)}</option>
                    <option value={VIEW_MODES.BOTH}>{t("both_mode", props.language)}</option>
                </select>

                <div className="tl-chartblock__canvas">
                    <canvas ref={lineChartRef}></canvas>
                </div>

                <div className="tl-gauge">
                    <div className="tl-gauge__bar" style={{ "--tl-gauge-pct": `${gaugePercent}%` }}>
                        <div className="tl-gauge__fill" style={{ height: `${gaugePercent}%` }}></div>
                        {/* mix-blend-mode keeps this legible over both halves of the bar. */}
                        <span className="tl-gauge__label">{t("air_in_chamber", props.language)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
