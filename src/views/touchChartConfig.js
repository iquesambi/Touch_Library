// Shared logic for the pressure/air-volume "touch" chart, used both live
// (recording a new touch in uploadView) and for viewing an already-saved
// touch (touchVisualizationView). Keeping this in one place means the two
// screens always render the exact same chart for the exact same data.

import { t } from "../i18n";

// Arduino streams pressure readings at 20Hz (every 50ms) while listening.
export const PRESSURE_SAMPLE_INTERVAL_MS = 50;
// Chart is drawn from every 3rd sample to stay readable; saved data keeps all 20Hz samples.
export const CHART_DOWNSAMPLE_FACTOR = 3;
// Average this many initial samples for the baseline, so a single noisy
// reading can't skew the whole chart's tare.
export const BASELINE_SAMPLE_COUNT = 5;
// Sensor noise floor when idle: swings this far from baseline get clamped to 0
// so a resting sensor reads as a flat line instead of jittering.
export const PRESSURE_DEADBAND_PSI = 0.03;

// Pump spec: 3 L/min at 100% speed (MIDI velocity 127). Flow is assumed linear
// with velocity, and the pneumatic circuit is treated as a closed system, so
// volume in/out is just flow rate integrated over how long each button was held.
export const MAX_FLOW_ML_PER_MIN = 3000;
export const MAX_VELOCITY = 127;

// Chart palette — mirrors --tl-ink / --tl-ink-soft in design.css. Chart.js
// draws to a canvas, so it can't read the CSS custom properties directly.
export const INK = "rgba(20, 20, 20, 1)";
export const INK_FILL = "rgba(20, 20, 20, 0.08)";
export const INK_SOFT = "#55534f";

// MIDI notes the Arduino maps to its inflate/deflate buttons.
export const INFLATE_NOTE = 60; // middleC
export const DEFLATE_NOTE = 67; // middleG

export const VIEW_MODES = {
    FLOW: "flow",
    PRESSURE: "pressure",
    BOTH: "both",
};

export function round1(n) {
    return Math.round(n * 10) / 10;
}

// Finds a common zero point (ms, Date.now() scale) for both series so they
// land on the same time axis when overlaid. The recorded button events are
// the authoritative source (their first entry's timestamp minus its interval
// is exactly when startRecording() was called); pressure samples are used as
// a fallback only when there were no button events at all.
export function getRecordingStartMs(events, pressureSamples) {
    const candidates = [];
    if (events && events.length) {
        candidates.push(events[0].timestamp - events[0].interval);
    }
    if (pressureSamples && pressureSamples.length && typeof pressureSamples[0] === "object" && pressureSamples[0] !== null) {
        candidates.push(pressureSamples[0].timestamp);
    }
    return candidates.length ? Math.min(...candidates) : null;
}

// Turns recorded inflate/deflate press-release events into a single net
// air-volume series in mL over time: it rises while inflating, falls while
// deflating, and can't go below 0 (closed system, so it can't vent air it
// never had). `t0` is the shared recording-start reference from
// getRecordingStartMs(). `nowMs` extends the last open segment to "now" for a
// live in-progress recording; omit it for a finished/saved sequence.
export function computeNetVolumeSeries(events, t0, nowMs) {
    const zero = [{ x: 0, y: 0 }];
    if (!events || events.length === 0) {
        return zero;
    }

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

// Tares the pressure array against the average of its first samples and
// applies the idle deadband. `t0` is the shared recording-start reference
// from getRecordingStartMs(), used to place each sample on the real
// timeline via its own timestamp — the Arduino does NOT stream these at a
// perfectly fixed 20Hz (it pauses for ~200ms around every button release),
// so assuming fixed spacing would drift out of sync with the volume curve.
// Samples saved before this timestamping existed are plain numbers; those
// fall back to the old fixed-rate assumption since no better info exists.
// Pass `requireFullBaseline: true` for a live-growing array to avoid
// showing a skewed chart before enough samples exist to average.
export function computePressurePoints(pressureSamples, t0, { requireFullBaseline = false } = {}) {
    if (!pressureSamples || pressureSamples.length === 0) return [];
    if (requireFullBaseline && pressureSamples.length < BASELINE_SAMPLE_COUNT) return [];

    const hasTimestamps = typeof pressureSamples[0] === "object" && pressureSamples[0] !== null;
    const values = hasTimestamps ? pressureSamples.map((s) => s.value) : pressureSamples;

    const sampleCount = Math.min(BASELINE_SAMPLE_COUNT, values.length);
    const baseline = values.slice(0, sampleCount).reduce((sum, v) => sum + v, 0) / sampleCount;

    const points = [];
    for (let i = 0; i < values.length; i += CHART_DOWNSAMPLE_FACTOR) {
        const delta = values[i] - baseline;
        const xSeconds = hasTimestamps
            ? (pressureSamples[i].timestamp - t0) / 1000
            : (i * PRESSURE_SAMPLE_INTERVAL_MS) / 1000; // legacy fallback: no per-sample timestamp saved
        points.push({
            x: xSeconds,
            y: Math.abs(delta) < PRESSURE_DEADBAND_PSI ? 0 : parseFloat(delta.toFixed(3)),
        });
    }
    return points;
}

// Builds the Chart.js datasets + y/y1 scale config for the given view mode.
export function buildChartUpdate(mode, volumePoints, pressurePoints, language) {
    const overlaying = mode === VIEW_MODES.BOTH;

    // Monochrome per the redesign: the two series are told apart by a dash
    // pattern rather than by colour.
    const volumeDataset = {
        label: t("chart_air_volume_label", language),
        data: volumePoints,
        borderColor: INK,
        backgroundColor: INK_FILL,
        fill: mode === VIEW_MODES.FLOW,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y",
    };
    const pressureDataset = {
        label: t("chart_pressure_label", language),
        data: pressurePoints,
        borderColor: INK,
        backgroundColor: INK_FILL,
        fill: mode === VIEW_MODES.PRESSURE,
        borderWidth: 2,
        borderDash: overlaying ? [5, 3] : undefined,
        pointRadius: 1,
        yAxisID: overlaying ? "y1" : "y",
    };

    if (mode === VIEW_MODES.FLOW) {
        return { datasets: [volumeDataset], scaleY: { display: false, beginAtZero: true }, scaleY1: null };
    }
    if (mode === VIEW_MODES.PRESSURE) {
        return { datasets: [pressureDataset], scaleY: { display: false }, scaleY1: null };
    }
    return {
        datasets: [volumeDataset, pressureDataset],
        scaleY: { display: false, beginAtZero: true },
        scaleY1: { display: false },
    };
}

// Below the pump's max flow, a hand-drawn slope shallower than this (mL/ms)
// is treated as flat — a hold, not a barely-perceptible inflate/deflate pulse.
const MIN_SLOPE_ML_PER_MS = 0.0005; // ~0.03 mL/s

// Converts a target flow rate (mL/ms, any sign) into the 1-127 MIDI velocity
// that would make the pump produce that flow, given its rated max at 100%.
export function velocityForSlope(mlPerMs) {
    const maxMlPerMs = MAX_FLOW_ML_PER_MIN / 60000;
    const velocity = Math.round((Math.abs(mlPerMs) / maxMlPerMs) * MAX_VELOCITY);
    return Math.min(Math.max(velocity, 1), MAX_VELOCITY);
}

// A drawn segment can ask for a volume change faster than the pump can
// physically deliver even at 100% speed (e.g. filling the whole chamber in
// under a second). Rather than silently clamping the velocity and quietly
// running long, this pushes the later point's TIME forward to the earliest
// moment the target is actually reachable at max flow — the point the user
// dragged stays where they put it on the volume axis, just lands later.
// Every point is checked against its (possibly just-adjusted) predecessor,
// so a single impossible edit cascades forward instead of leaving a broken
// segment further down the curve.
export function enforcePhysicalLimits(points) {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const maxMlPerMs = MAX_FLOW_ML_PER_MIN / 60000;

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const minDurationMs = Math.abs(curr.y - prev.y) / maxMlPerMs;
        const minX = prev.x + minDurationMs / 1000;
        if (curr.x < minX) {
            curr.x = minX;
        }
    }

    return sorted;
}

// Converts a hand-drawn volume-over-time curve (control points in seconds/mL)
// into a sequence of inflate/deflate/hold actions that can be played back on
// the real pump. Run enforcePhysicalLimits() on the points first — this does
// NOT re-check achievability, it assumes the curve is already valid.
export function curveToActions(points) {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const actions = [];

    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        const durationMs = (b.x - a.x) * 1000;
        if (durationMs <= 0) continue;

        const mlPerMs = (b.y - a.y) / durationMs;
        if (Math.abs(mlPerMs) < MIN_SLOPE_ML_PER_MS) {
            actions.push({ type: "hold", durationMs });
        } else {
            actions.push({
                type: mlPerMs > 0 ? "inflate" : "deflate",
                velocity: velocityForSlope(mlPerMs),
                durationMs,
            });
        }
    }

    return actions;
}

// Turns a hand-drawn curve into the same event shape the kit records, so a
// drawn entry is indistinguishable downstream: playbackSequence(), the
// detail chart, the library Play button and Test a touch all keep working
// without knowing how the touch was authored.
//
// The raw curve is still stored alongside it (see createEntryView) — this is
// the derived, playable form, not the source of truth for re-editing.
export function curveToSequence(points, startMs = Date.now()) {
    // The editor already snaps impossible slopes, but re-running it here is
    // idempotent and keeps a raw curve from silently producing a playback that
    // never reaches the volume that was drawn (the pump saturates instead).
    const actions = curveToActions(enforcePhysicalLimits(points));
    const events = [];
    let now = startMs;
    let lastEventAt = startMs;

    function push(button, type, velocity, note) {
        events.push({
            button,
            type,
            pot: velocity,
            singleReadingPressure: null, // Firestore rejects undefined
            note,
            timestamp: now,
            interval: now - lastEventAt, // playbackSequence() waits on this
        });
        lastEventAt = now;
    }

    for (const action of actions) {
        if (action.type === "hold") {
            now += action.durationMs; // nothing to emit; the gap is the hold
            continue;
        }
        const note = action.type === "inflate" ? INFLATE_NOTE : DEFLATE_NOTE;
        push(action.type, "press", action.velocity, note);
        now += action.durationMs;
        push(action.type, "release", action.velocity, note);
    }

    return events;
}

// Base Chart.js options shared by both screens: hidden axes/grid (the thick
// border comes from the surrounding .chart div's CSS), values shown only via
// hover tooltip, and full auto-fit scaling so the whole curve is always visible.
export function baseChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        layout: { padding: 0 },
        interaction: { mode: "index", intersect: false },
        // The redesign's chart block is a bare waveform: no axes, no legend.
        // Callers turn the legend back on for the "both" mode, where the two
        // overlaid series do need to be told apart.
        plugins: {
            legend: {
                display: false,
                labels: { color: INK_SOFT, boxHeight: 1, font: { size: 12 } },
            },
        },
        scales: {
            x: { type: "linear", display: false, min: 0 },
            y: { display: false, beginAtZero: true },
        },
        elements: { line: { tension: 0.1 } },
    };
}
