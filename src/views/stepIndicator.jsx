import React from "react";
import "./style.css";

// The three-circle progress indicator shared by the record flow's screens.
// The steps are the app's real save sequence, not a new wizard:
//   1. Record a touch  (/upload)      — waveform + name/description
//   2. Mood & sensation (/chart)      — circumplex point + felt sensation
//   3. Media            (/media/:id)  — reference photos
export const RECORD_FLOW_STEPS = 3;

export function StepIndicator({ current }) {
    return (
        <div className="tl-steps">
            {Array.from({ length: RECORD_FLOW_STEPS }, (_, i) => i + 1).map((step) => (
                <span key={step} className={`tl-step${step === current ? " is-active" : ""}`}>
                    {step}
                </span>
            ))}
        </div>
    );
}
