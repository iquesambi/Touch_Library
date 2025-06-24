//import React, { useState, useRef, useEffect } from 'react';
import { BasicVestView } from '../views/PatternGeneratorView';
import { observer } from "mobx-react-lite";

const BasicVestPresenter = observer(function (props) {
  // State for the three slider values
  //const [deliberateness, setDeliberateness] = useState(64);
 // const [spatiality, setSpatiality] = useState(64);
 // const [rhythmic, setRhythmic] = useState(64);

  // State for the visualization of the 7 actuators
  // `true` means inflated, `false` means deflated
 // const [actuatorStates, setActuatorStates] = useState(Array(7).fill(false));

  // Message to display below the button
 // const [message, setMessage] = useState("Adjust sliders and click 'Play Dummy Pattern'");

  // Ref to store setTimeout IDs for clearing them if playback is stopped
  //const playbackTimeouts = useRef([]);

  // Function to stop any ongoing pattern playback and reset actuators
 // const stopPlayback = () => {
  //  playbackTimeouts.current.forEach(clearTimeout); // Clear all scheduled timeouts
  //  playbackTimeouts.current = []; // Reset the ref array
 //   setActuatorStates(Array(7).fill(false)); // Set all actuators to deflated
 //   setMessage("Playback stopped.");
 //   console.log("Playback stopped and actuators reset.");
 // };

  // Dummy pattern playback function
  //const playDummyPattern = () => {
  //  stopPlayback(); // Stop any currently playing pattern

  //  setMessage("Playing dummy pattern...");

    // Define a simple, hardcoded sequence of events
  //  const dummySequence = [
  //    { timeOffset: 0, actuatorIndex: 0, action: 'inflate' },
  //    { timeOffset: 150, actuatorIndex: 0, action: 'deflate' },
  //    { timeOffset: 200, actuatorIndex: 1, action: 'inflate' },
  //  { timeOffset: 350, actuatorIndex: 1, action: 'deflate' },
  //  { timeOffset: 400, actuatorIndex: 2, action: 'inflate' },
  //  { timeOffset: 550, actuatorIndex: 2, action: 'deflate' },
  //  { timeOffset: 600, actuatorIndex: 3, action: 'inflate' },
  //  { timeOffset: 750, actuatorIndex: 3, action: 'deflate' },
  //  { timeOffset: 800, actuatorIndex: 4, action: 'inflate' },
  //  { timeOffset: 950, actuatorIndex: 4, action: 'deflate' },
  //  { timeOffset: 1000, actuatorIndex: 5, action: 'inflate' },
  //  { timeOffset: 1150, actuatorIndex: 5, action: 'deflate' },
  //  { timeOffset: 1200, actuatorIndex: 6, action: 'inflate' },
  //  { timeOffset: 1350, actuatorIndex: 6, action: 'deflate' },
      // A small "wave" effect
    //  { timeOffset: 1500, actuatorIndex: 0, action: 'inflate' },
      //{ timeOffset: 1600, actuatorIndex: 1, action: 'inflate' },
    //  { timeOffset: 1700, actuatorIndex: 2, action: 'inflate' },
 //     { timeOffset: 1800, actuatorIndex: 3, action: 'inflate' },
  //   { timeOffset: 1900, actuatorIndex: 4, action: 'inflate' },
  //{ timeOffset: 2000, actuatorIndex: 5, action: 'inflate' },
  //    { timeOffset: 2100, actuatorIndex: 6, action: 'inflate' },
  //    { timeOffset: 2200, actuatorIndex: 0, action: 'deflate' },
  //    { timeOffset: 2300, actuatorIndex: 1, action: 'deflate' },
   //   { timeOffset: 2400, actuatorIndex: 2, action: 'deflate' },
  //    { timeOffset: 2500, actuatorIndex: 3, action: 'deflate' },
  //    { timeOffset: 2600, actuatorIndex: 4, action: 'deflate' },
   //   { timeOffset: 2700, actuatorIndex: 5, action: 'deflate' },
  //    { timeOffset: 2800, actuatorIndex: 6, action: 'deflate' },
   // ];

    // Schedule each event in the dummy sequence
   // dummySequence.forEach(event => {
  //    const timeoutId = setTimeout(() => {
  //      setActuatorStates(prevStates => {
    //      const newStates = [...prevStates]; // Create a new array for immutability
   //       newStates[event.actuatorIndex] = (event.action === 'inflate'); // Update the state based on action
  //        return newStates;
   //     });
  //      console.log(`Visual: Actuator ${event.actuatorIndex} ${event.action === 'inflate' ? 'inflated' : 'deflated'}`);
   //   }, event.timeOffset);
  //    playbackTimeouts.current.push(timeoutId); // Store the timeout ID
  //  });

    // Schedule a final message and cleanup after the pattern is expected to finish
  //  const lastEventTime = dummySequence.length > 0 ? dummySequence[dummySequence.length - 1].timeOffset : 0;
 //   const finalCleanupTimeoutId = setTimeout(() => {
//      setMessage("Dummy pattern finished!");
 //     setActuatorStates(Array(7).fill(false)); // Ensure all are deflated at the very end
 //     playbackTimeouts.current = [];
 //   }, lastEventTime + 500); // Add a small buffer after the last event
 //   playbackTimeouts.current.push(finalCleanupTimeoutId);
//  };

  // Clean up timeouts if the component unmounts
 // useEffect(() => {
 //   return () => {
 //     stopPlayback();
 //   };
 // }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <BasicVestView
  multiZoneWiP = {props.model.multiZoneWiP}
  appendACB={appendACB}
  selectpad={padACB}
  selectaction = {actionACB}
  selectTime = {timeACB}
  selectVelocity = {velocityACB}
  play= {play}

      // Pass state values to the view
   //   deliberatenessValue={deliberateness}
  //    spatialityValue={spatiality}
    //  rhythmicValue={rhythmic}
    //  actuatorStates={actuatorStates}
   //   message={message}

      // Pass event handlers to the view
     // onDeliberatenessChange={setDeliberateness}
  //    onSpatialityChange={setSpatiality}
   //   onRhythmicChange={setRhythmic}
  //    onPlayPattern={playDummyPattern} // Button triggers the dummy pattern

    />
  );

  function appendACB(){
    props.model.appenMZ()
  }

   function padACB(x){
    props.model.addMZpad(x)
  }

   function actionACB(x){
    props.model.addMZaction(x)
  }

   function timeACB(x){
    props.model.addMZtime(x)
  }

   function velocityACB(x){
    props.model.addMZvelocity(x)
  }
  
  function play(){
    props.model.performMultiZoneSequence()
    console.log("test")
  }

}
)

export { BasicVestPresenter };