// src/presenters/playground.jsx or where your presenter file is located

import { PlaygroundView } from "../views/playgroundView";
import { observer } from "mobx-react-lite";
import { useState } from "react"; // <--- IMPORT useState

const Playground = observer(function (props) {
  const model = props.model;

  // 1. Initialize local state for pot values
  // Fill with a default velocity (e.g., 64, a common middle value for MIDI velocity)
  // for all 7 sliders.
  const [pots, setPots] = useState(Array(7).fill(64));

  // The ACB functions must be defined inside the component
  // to have access to the 'pots' state via closure.

  function inflateDownACB(index) {
    // Use the value from the local 'pots' state
    model.recordEvent(`inflate${index}`, "press", pots[index]);
    model.buttonDownNote(36 + (index * 2), pots[index]); // MIDI note C2 (36) + (index * 2)
  }

  function inflateUpACB(index) {
    // Use the value from the local 'pots' state
    model.recordEvent(`inflate${index}`, "release", pots[index]);
    model.buttonUpNote(36 + (index * 2), pots[index]);
  }

  function deflateDownACB(index) {
    // Use the value from the local 'pots' state
    model.recordEvent(`deflate${index}`, "press", pots[index]);
    model.buttonDownNote(37 + (index * 2), pots[index]); // MIDI note C#2 (37) + (index * 2)
  }

  function deflateUpACB(index) {
    // Use the value from the local 'pots' state
    model.recordEvent(`deflate${index}`, "release", pots[index]);
    model.buttonUpNote(37 + (index * 2), pots[index]);
  }

  function fulldeflateDownACB(index) {
      model.buttonDownNote(50 + index, 100);
    // Skipped as requested for now.
    // If enabled, it would use pots[index] for velocity:
    // model.buttonDownNote(71 + index, pots[index]);
  }

  function fulldeflateUpACB(index) {
    // Skipped as requested for now.
    // If enabled, it would use pots[index] for velocity:
    model.buttonUpNote(50 + index, 100);;
  }

  function potchangeACB(index, value) {
    // 2. Update the local 'pots' state when a slider changes
    // Create a new array to ensure immutability for React state updates
    const newPots = [...pots];
    newPots[index] = parseInt(value, 10); // Convert slider value (string) to integer
    setPots(newPots); // Update the state
  }

  function startACB() {
    model.startRecording();
  }

  function replayACB() {
    model.playbackSequence();
  }

  function stopACB() {
    model.stopRecording();
    console.log(model.sequence);
  }

  return (
    <PlaygroundView
      inflateDown={Array(7).fill().map((_, i) => () => inflateDownACB(i))}
      inflateUp={Array(7).fill().map((_, i) => () => inflateUpACB(i))}
      deflateDown={Array(7).fill().map((_, i) => () => deflateDownACB(i))}
      deflateUp={Array(7).fill().map((_, i) => () => deflateUpACB(i))}
      fulldeflateDown={Array(7).fill().map((_, i) => () => fulldeflateDownACB(i))}
      fulldeflateUp={Array(7).fill().map((_, i) => () => fulldeflateUpACB(i))}
      potchange={Array(7).fill().map((_, i) => (val) => potchangeACB(i, val))}
      potValues={pots} // <--- PASS THE LOCAL 'pots' STATE TO THE VIEW
      start={startACB}
      stop={stopACB}
      replay={replayACB}
    />
  );
});

export { Playground };