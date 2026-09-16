import React, { useEffect } from "react";
import { isVideoUrl } from "./mediaUtils";
import "./style.css";
import { t } from "../i18n";

// Full-screen media viewer: dark overlay, the item centred and square, arrows
// to cycle, × or a click outside to close.
export function Lightbox({ items, index, onIndexChange, onClose, language }) {
    // Arrow keys and Escape are the reflex for a viewer like this, and they
    // cost nothing to support alongside the on-screen buttons.
    useEffect(() => {
        function onKeyDown(evt) {
            if (evt.key === "Escape") onClose();
            else if (evt.key === "ArrowLeft") onIndexChange((index + items.length - 1) % items.length);
            else if (evt.key === "ArrowRight") onIndexChange((index + 1) % items.length);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [index, items.length, onClose, onIndexChange]);

    const url = items[index];

    function step(delta, evt) {
        evt.stopPropagation();
        onIndexChange((index + items.length + delta) % items.length);
    }

    return (
        <div className="tl-lightbox" onClick={onClose}>
            <button className="tl-lightbox__close" onClick={onClose} aria-label={t("close", language)}>
                ×
            </button>
            <button className="tl-lightbox__nav tl-lightbox__nav--prev" onClick={(e) => step(-1, e)} aria-label={t("previous", language)}>
                ‹
            </button>
            <button className="tl-lightbox__nav tl-lightbox__nav--next" onClick={(e) => step(1, e)} aria-label={t("next", language)}>
                ›
            </button>
            <div className="tl-lightbox__stage" onClick={(e) => e.stopPropagation()}>
                {isVideoUrl(url) ? (
                    <video src={url} controls autoPlay />
                ) : (
                    <img src={url} alt={`${t("media_alt_label", language)} ${index + 1}`} />
                )}
            </div>
        </div>
    );
}
