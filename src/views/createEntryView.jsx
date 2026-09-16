import React, { useRef, useState } from "react";
import { db, storage } from "../../firebaseModel";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { curveToSequence } from "./touchChartConfig";
import { KitCapturePanel } from "./kitCapturePanel";
import { ShapeDrawPanel } from "./shapeDrawPanel";
import { CircumplexMini } from "./circumplexPlot";
import "./style.css";
import { t } from "../i18n";

const TOTAL_STEPS = 3;

// Create an entry — the merged flow that replaced the separate "Record touch"
// and "Shape editor" screens.
//
//   Step 1  source (capture from the kit / draw a shape) + name, author, description
//   Step 2  mood placement on the pleasure-arousal square + felt sensation
//   Step 3  reference media
//
// Nothing is written until "Save touch" on step 3: the Firestore document and
// every media file go up together, so an abandoned draft leaves nothing behind.
export function CreateEntryView(props) {
    const [step, setStep] = useState(1);
    const [sourceMode, setSourceMode] = useState("kit"); // "kit" | "draw"
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [moodPoint, setMoodPoint] = useState(null);
    const [feltSensation, setFeltSensation] = useState("");
    const [media, setMedia] = useState([]); // { file, url } — url is an object URL for preview
    const [saving, setSaving] = useState(false);

    // Panel output, kept in refs so typing in the shared fields doesn't
    // re-render the charts underneath.
    const captureRef = useRef({ sequence: [], pressure: [] });
    const curveRef = useRef(null);
    const fileInputRef = useRef(null);

    const isFinalStep = step >= TOTAL_STEPS;

    function handleAddMediaClick() {
        fileInputRef.current?.click();
    }

    function handleFilesPicked(evt) {
        const picked = Array.from(evt.target.files || []);
        setMedia((prev) => [...prev, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
        evt.target.value = ""; // let the same file be picked again after a remove
    }

    function removeMedia(index) {
        setMedia((prev) => {
            URL.revokeObjectURL(prev[index]?.url);
            return prev.filter((_, i) => i !== index);
        });
    }

    async function saveTouch() {
        if (saving) return;
        if (!name.trim() || !description.trim()) {
            alert(t("fill_name_description_alert", props.language));
            setStep(1);
            return;
        }

        // A drawn curve is converted to the same event shape the kit records,
        // so playback and every chart downstream treat both kinds alike.
        const isDrawn = sourceMode === "draw";
        const curve = curveRef.current;
        if (isDrawn && !curve) {
            alert(t("draw_a_shape_alert", props.language));
            setStep(1);
            return;
        }

        const sequence = isDrawn ? curveToSequence(curve.points) : captureRef.current.sequence;
        if (!sequence.length) {
            alert(t("record_something_alert", props.language));
            setStep(1);
            return;
        }

        setSaving(true);
        const touchId = name.trim();

        try {
            await setDoc(doc(db, "touches", touchId), {
                name: touchId,
                description: description.trim(),
                userName: props.userName,
                createdAt: new Date(),
                sequence,
                pressure: isDrawn ? [] : captureRef.current.pressure,
                // Written straight from step 2 — this used to be a separate
                // screen reached after saving.
                data: moodPoint ? [{ x: moodPoint.x, y: moodPoint.y }] : [],
                feltSensation: feltSensation.trim(),
                // The hand-drawn curve is kept as the source of truth for
                // re-editing; `sequence` above is the playable form derived
                // from it.
                source: isDrawn ? "draw" : "kit",
                shape: isDrawn ? { points: curve.points, maxVolume: curve.maxVolume } : null,
            });

            for (const item of media) {
                await uploadBytes(ref(storage, `touchMedia/${touchId}/${item.file.name}`), item.file);
            }

            media.forEach((item) => URL.revokeObjectURL(item.url));
            window.location.hash = `#/visualization/${encodeURIComponent(touchId)}`;
        } catch (error) {
            console.error("Error saving touch:", error);
            alert(t("save_touch_failed_alert", props.language));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="tl-page">
            <div className="tl-titlerow">
                <div className="tl-titlerow__left">
                    <h1 className="tl-h1">{t("create_entry_title", props.language)}</h1>
                    <div className="tl-steps">
                        {[1, 2, 3].map((n) => (
                            <button
                                key={n}
                                type="button"
                                className={`tl-step${step >= n ? " is-active" : ""}`}
                                onClick={() => setStep(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {isFinalStep ? (
                    <button className="tl-btn tl-btn--sm" onClick={saveTouch} disabled={saving}>
                        {saving ? t("saving_label", props.language) : t("save_touch", props.language)}
                    </button>
                ) : (
                    <button
                        className="tl-btn tl-btn--text"
                        onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                    >
                        {t("next_step", props.language)} ›
                    </button>
                )}
            </div>

            {step === 1 && (
                <div className="tl-stack">
                    <div className="tl-segmented tl-segmented--pill">
                        <button
                            className={`tl-segmented__btn tl-segmented__btn--sm${sourceMode === "kit" ? " is-active" : ""}`}
                            onClick={() => setSourceMode("kit")}
                        >
                            {t("capture_from_kit", props.language)}
                        </button>
                        <button
                            className={`tl-segmented__btn tl-segmented__btn--sm${sourceMode === "draw" ? " is-active" : ""}`}
                            onClick={() => setSourceMode("draw")}
                        >
                            {t("draw_shape", props.language)}
                        </button>
                    </div>

                    {/* Both panels stay mounted so switching modes doesn't throw
                        away a take or a curve the user already made. */}
                    <div hidden={sourceMode !== "kit"}>
                        <KitCapturePanel
                            model={props.model}
                            language={props.language}
                            start={props.start}
                            stop={props.stop}
                            replay={props.replay}
                            stopReplay={props.stopReplay}
                            toggleListen={props.toggleListen}
                            onCaptured={(take) => { captureRef.current = take; }}
                        />
                    </div>
                    <div hidden={sourceMode !== "draw"}>
                        <ShapeDrawPanel
                            model={props.model}
                            language={props.language}
                            onCurveChange={(curve) => { curveRef.current = curve; }}
                        />
                    </div>

                    <div className="tl-fields">
                        <div className="tl-fields__left">
                            <div className="tl-field">
                                <label className="tl-label">{t("touch_name_label", props.language)}</label>
                                <input
                                    type="text"
                                    className="tl-input tl-input--sm"
                                    placeholder={t("touch_name_placeholder", props.language)}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            {/* The author is system-provided, so it reads as
                                plain text rather than an editable input. */}
                            <div className="tl-static-field">
                                {t("author_label", props.language)} <strong>{props.userName}</strong>
                            </div>
                        </div>

                        <div className="tl-fields__right">
                            <label className="tl-label">{t("description_label", props.language)}</label>
                            <textarea
                                className="tl-textarea"
                                maxLength="200"
                                placeholder={t("description_placeholder", props.language)}
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="tl-stack">
                    <p className="tl-lead tl-lead--narrow">{t("mood_step_intro", props.language)}</p>
                    <div className="tl-moodrow">
                        <CircumplexMini
                            variant="mood"
                            point={moodPoint}
                            onPick={setMoodPoint}
                            language={props.language}
                        />
                        <div className="tl-moodrow__field">
                            <label className="tl-label">{t("felt_sensation_label", props.language)}</label>
                            <textarea
                                className="tl-textarea"
                                placeholder={t("felt_sensation_placeholder", props.language)}
                                rows="8"
                                value={feltSensation}
                                onChange={(e) => setFeltSensation(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="tl-stack">
                    <p className="tl-lead tl-lead--narrow">{t("media_step_intro", props.language)}</p>
                    <div className="tl-tilegrid">
                        {media.map((item, index) => (
                            <div key={item.url} className="tl-tile">
                                {item.file.type.startsWith("video/") ? (
                                    <video src={item.url} />
                                ) : (
                                    <img src={item.url} alt="" />
                                )}
                                <button
                                    type="button"
                                    className="tl-tile__remove"
                                    onClick={() => removeMedia(index)}
                                    aria-label={t("remove", props.language)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button type="button" className="tl-tile tl-tile--add" onClick={handleAddMediaClick}>
                            +
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        onChange={handleFilesPicked}
                    />
                </div>
            )}
        </div>
    );
}
