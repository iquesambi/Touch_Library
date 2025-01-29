import "./style.css";
import { useEffect } from "react";

export function PlaygroundView(props) {
 useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "i") {
        console.log("Key 'i' pressed: Inflate start");
        inflateStartACB();
      } else if (event.key === "s") {
        console.log("Key 's' pressed: Deflate start");
        deflateStartACB();
      }
    }

    function handleKeyUp(event) {
      if (event.key === "a") {
        console.log("Key 'i' released: Inflate stop");
        inflateStopACB();
      } else if (event.key === "s") {
        console.log("Key 's' released: Deflate stop");
        deflateStopACB();
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
        <button className="playground-button">Fully deflate</button>
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
  <button onClick={startACB}>Start Recording</button>
  <button onClick={stopACB}>Stop Recording</button>
  <button onClick={replayACB}>replay</button>
</div>
    </div>

  );

  function startACB(){
   props.start()
  }

  function replayACB(){
    props.replay()
   }
 
  function stopACB(){
    props.stop()
   }
 
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

  function sliderChangeACB(evt) {
    props.potchange(evt.target.value);
  }
}
