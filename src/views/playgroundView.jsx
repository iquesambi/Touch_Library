// src/views/playgroundView.jsx or where your view file is located

import "./style.css";
import { useEffect } from "react";

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
    <div className="playground-container">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="playground-row">
          <div className="button-row">
            <button
              className="playground-button"
              onMouseDown={() => props.inflateDown[i]()}
              onMouseUp={() => props.inflateUp[i]()}
            >
              Inflate
            </button>
            <button
              className="playground-button"
              onMouseDown={() => props.deflateDown[i]()}
              onMouseUp={() => props.deflateUp[i]()}
            >
              Deflate
            </button>
            <button
              className="playground-button"
              onMouseDown={() => props.fulldeflateDown[i]()}
              onMouseUp={() => props.fulldeflateUp[i]()}
            >
              Fully deflate
            </button>
          </div>
          <div className="slider-container">
            <input
              className="playground-slider"
              type="range"
              min="0"
              max="127"
              value={props.potValues[i]} // <--- ADD THIS LINE to make it a controlled component
              onChange={(evt) => props.potchange[i](evt.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}