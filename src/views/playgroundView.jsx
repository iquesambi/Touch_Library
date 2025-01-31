import "./style.css";
import { useEffect } from "react";

export function PlaygroundView(props) {
 useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "a") {
        console.log("Key 'i' pressed: Inflate start");
        inflateStartACB();
      } else if (event.key === "s") {
        console.log("Key 's' pressed: Deflate start");
        deflateStartACB();
      }else if (event.key === "d") {
        console.log("Key 'd' pressed: full Deflate start");
        fulldeflateStartACB();
      }
    }

    function handleKeyUp(event) {
      if (event.key === "a") {
        console.log("Key 'i' released: Inflate stop");
        inflateStopACB();
      } else if (event.key === "s") {
        console.log("Key 's' released: Deflate stop");
        deflateStopACB();
      }else if (event.key === "d") {
        console.log("Key 'd' released: Deflate stop");
        fulldeflateStopACB();
      }
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
      <div className="button-row">
        <button
          className="playground-button"
          onMouseDown={inflateStartACB}
          onMouseUp={inflateStopACB}
        >
          Inflate
        </button>
        <button
          className="playground-button"
          onMouseDown={deflateStartACB}
          onMouseUp={deflateStopACB}
        >
          Deflate
        </button>
      </div>
      <div className="single-button">
        <button className="playground-button"  onMouseDown={fulldeflateStartACB}
          onMouseUp={fulldeflateStopACB}>Fully deflate</button>
      </div>
      <div className="slider-container">
        <input
          className="playground-slider"
          type="range"
          min="0"
          max="127"
          onChange={sliderChangeACB}
        />
      </div>
      <div className="record-controls">

</div>
    </div>

  );

 
 
  function inflateStartACB() {
    console.log("Inflate started");
    props.inflateDown();
  }

  function inflateStopACB() {
    console.log("Inflate stopped");
    props.inflateUp();
  }

  function deflateStartACB() {
    console.log("Deflate started");
    props.deflateDown();
  }

  function deflateStopACB() {
    console.log("Deflate stopped");
    props.deflateUp();
  }

  function fulldeflateStartACB() {
    console.log("Deflate started");
    props.fulldeflateDown();
  }

  function fulldeflateStopACB() {
    console.log("Deflate stopped");
    props.fulldeflateUp();
  }

  function sliderChangeACB(evt) {
    props.potchange(evt.target.value);
  }
}
