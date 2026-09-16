import React, { useRef, useState } from "react";
import "./style.css";
import { t } from "../i18n";

// Russell's circumplex, drawn in plain DOM rather than chart.js.
//
// The redesign specifies absolutely-positioned dots on a crosshair, a black
// hover card, and pan/zoom driven by a CSS transform on an inner wrapper —
// so this deliberately replaces the old chart.js circumplex (and with it the
// boundary circle and data-coordinate zoom) instead of restyling it.

// Data range of each axis, matching what the rest of the app stores (-15..15).
export const AXIS_RANGE = 15;
// The dots span 90% of the box (45% either side of centre), leaving a margin
// so points at the extremes don't sit half-off the edge.
const AXIS_SPAN_PCT = 45;
const ZOOM_STEP = 1.3;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;

export function toPercent(x, y) {
    return {
        left: `${50 + (x / AXIS_RANGE) * AXIS_SPAN_PCT}%`,
        top: `${50 - (y / AXIS_RANGE) * AXIS_SPAN_PCT}%`,
    };
}

function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

function clampRange(n) {
    return Math.min(AXIS_RANGE, Math.max(-AXIS_RANGE, n));
}

// Inverse of toPercent(), so a click lands on the same coordinate the dot is
// then drawn at. The prototype stores raw box percentages here; the app's
// data model is -15..15, and every other plot reads it that way.
function fromClientPoint(rect, clientX, clientY) {
    const leftPct = ((clientX - rect.left) / rect.width) * 100;
    const topPct = ((clientY - rect.top) / rect.height) * 100;
    return {
        x: clampRange(((leftPct - 50) / AXIS_SPAN_PCT) * AXIS_RANGE),
        y: clampRange(((50 - topPct) / AXIS_SPAN_PCT) * AXIS_RANGE),
    };
}

// `valenceOnly` matches the Test a touch screen, where the design labels just
// the horizontal axis and moves those labels up to the box's top corners.
function AxisLabels({ language, valenceOnly = false }) {
    return (
        <>
            {!valenceOnly && (
                <>
                    <span className="tl-plot__label tl-plot__label--arousal tl-plot__label--high">
                        {t("high_arousal", language)}
                    </span>
                    <span className="tl-plot__label tl-plot__label--arousal tl-plot__label--low">
                        {t("low_arousal", language)}
                    </span>
                </>
            )}
            <span className="tl-plot__label tl-plot__label--displeasure">
                {t("displeasure", language)}
            </span>
            <span className="tl-plot__label tl-plot__label--pleasure">
                {t("pleasure", language)}
            </span>
        </>
    );
}

// Library "Graph" view: every touch as a dot, hover for a card, click to open
// the touch, drag the background to pan, +/- to zoom. Always square, so the
// two axes read as equal length at any window width.
export function CircumplexPlot({ points, onPointClick, language }) {
    const panOriginRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const [panning, setPanning] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [hoveredId, setHoveredId] = useState(null);

    const hovered = points.find((p) => p.id === hoveredId) || null;

    // Pan is tracked on the container, not the dots, so dragging the empty
    // background moves the whole plot while a dot still receives its click.
    function handlePointerDown(evt) {
        panOriginRef.current = { x: evt.clientX, y: evt.clientY, panX: pan.x, panY: pan.y };
        setPanning(true);
    }

    function handlePointerMove(evt) {
        if (!panning) return;
        const origin = panOriginRef.current;
        setPan({
            x: origin.panX + (evt.clientX - origin.x),
            y: origin.panY + (evt.clientY - origin.y),
        });
    }

    function handlePointerUp() {
        setPanning(false);
    }

    function zoomBy(factor) {
        setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor)));
    }

    return (
        <div
            className={`tl-plot tl-plot--library${panning ? " is-panning" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div
                className="tl-plot__pan"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
                <div className="tl-plot__axis-v"></div>
                <div className="tl-plot__axis-h"></div>
                <AxisLabels language={language} />

                {points.map((point) => (
                    <button
                        key={point.id}
                        type="button"
                        className="tl-plot__dot"
                        style={toPercent(point.x, point.y)}
                        title={point.name}
                        onMouseEnter={() => setHoveredId(point.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={(evt) => {
                            evt.stopPropagation();
                            if (onPointClick) onPointClick(point);
                        }}
                    ></button>
                ))}
            </div>

            {hovered && (
                <div className="tl-plot__hovercard">
                    <div
                        className={`tl-plot__hovercard-thumb ${hovered.imageUrl ? "" : hovered.texClass || "tl-tex-0"}`}
                        style={hovered.imageUrl ? { backgroundImage: `url(${hovered.imageUrl})` } : undefined}
                    ></div>
                    <div>
                        <div className="tl-plot__hovercard-name">{hovered.name}</div>
                        <div className="tl-plot__hovercard-desc">{hovered.description}</div>
                    </div>
                </div>
            )}

            <div className="tl-plot__zoom">
                <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in">+</button>
                <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">−</button>
            </div>
        </div>
    );
}

// Compact circumplex with a single point.
//   variant="square" — the detail page's 1:1 mood panel
//   variant="test"   — the boxed version on Test a touch (valence labels only)
//   variant="mood"   — Create-an-entry step 2, axes inset from the border
// Passing onPick makes it click-to-place.
export function CircumplexMini({ point, onPick, language, variant = "square" }) {
    const ref = useRef(null);

    function handleClick(evt) {
        if (!onPick || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const value = fromClientPoint(rect, evt.clientX, evt.clientY);
        onPick({ x: round2(value.x), y: round2(value.y) });
    }

    return (
        <div
            ref={ref}
            className={`tl-plot tl-plot--${variant}${onPick ? " tl-plot--pickable" : ""}`}
            onClick={handleClick}
        >
            <div className="tl-plot__axis-v"></div>
            <div className="tl-plot__axis-h"></div>
            <AxisLabels language={language} valenceOnly={variant === "test"} />
            {point && (
                <div
                    className={`tl-plot__dot tl-plot__dot--${variant}`}
                    style={toPercent(point.x, point.y)}
                ></div>
            )}
        </div>
    );
}
