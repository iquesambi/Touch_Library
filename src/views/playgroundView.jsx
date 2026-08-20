// src/views/playgroundView.jsx or where your view file is located

import "./style.css";
import { useEffect } from "react";
import { t } from "../i18n";

export function PlaygroundView(props) {
  useEffect(() => {
    function handleKeyDown(event) {
      // Key handling removed as requested
    }

    function handleKeyUp(event) {
      // Key handling removed as requested
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="playground-page">
      {[...Array(1)].map((_, i) => (
        <div key={i} className="playground-controls">
          <div className="pg-row-two-cols">
            <button
              className="playground-button"
              onMouseDown={() => props.inflateDown[i]()}
              onMouseUp={() => props.inflateUp[i]()}
            >
              {t("inflate_button", props.language)}
            </button>
            <button
              className="playground-button"
              onMouseDown={() => props.deflateDown[i]()}
              onMouseUp={() => props.deflateUp[i]()}
            >
              {t("deflate_button", props.language)}
            </button>
          </div>
          <div className="pg-row-full">
            <input
              className="playground-slider"
              type="range"
              min="0"
              max="127"
              value={props.potValues[i]}
              onChange={(evt) => props.potchange[i](evt.target.value)}
            />
          </div>
          <div className="pg-row-full">
            <button
              className="playground-button"
              onMouseDown={() => props.fulldeflateDown[i]()}
              onMouseUp={() => props.fulldeflateUp[i]()}
            >
              {t("fully_deflate_button", props.language)}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}