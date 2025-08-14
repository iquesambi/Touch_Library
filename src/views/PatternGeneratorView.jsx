
import { toJS } from "mobx";
import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseModel";
import { doc, setDoc } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";
import { Stage, Layer, Rect, Text, Line } from 'react-konva';

export function BasicVestView(props) {

  const [patternName, setPatternName] = useState('');
  const [savedPatterns, setSavedPatterns] = useState([]);


 
console.log(props.multiZoneWiP)
   const commonDivStyle = {
    backgroundColor: 'black',
    padding: '20px',
    margin: '5px',
    minHeight: '50px', // Ensure divs are visible even if empty
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white', // For text if you want to add labels later
    fontSize: '1.2em',
    fontWeight: 'bold',
    borderRadius: '10px'
  };


  function savePatternToDB() {
  if (!patternName) {
    alert("Please enter a pattern name.");
    return;
  }

  const patternRef = doc(db, "patterns", patternName);

  const patternData = {
    name: patternName,
    createdAt: new Date(),
    sequence: props.multiZoneWiP,
    userName: props.userName || "anonymous"
  };

  console.log("Saving pattern:", patternData);

  setDoc(patternRef, patternData)
    .then(() => {
      console.log("Pattern saved successfully");
      alert("Pattern saved!");
      setPatternName('');
    })
    .catch((error) => {
      console.error("Error saving pattern:", error);
      alert("Failed to save pattern.");
    });
}

useEffect(() => {
  async function fetchPatterns() {
    try {
      const querySnapshot = await getDocs(collection(db, "patterns"));
      const patterns = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedPatterns(patterns);
    } catch (error) {
      console.error("Error fetching patterns:", error);
    }
  }

  fetchPatterns();
}, []);


  return (
        <div className="playground-container">
   
<div style={{ marginTop: '40px' }}>
<Stage width={800} height={200}>
  <Layer>
    <Line points={[0, 100, 800, 100]} stroke="black" strokeWidth={2} />

    {props.multiZoneWiP.map((item, index) => {
  const nextItem = props.multiZoneWiP[index + 1];
  const timeScale = 0.5; // scale time to pixels
  const velocityScale = 0.3;

  const x = item.time * timeScale;
  const y = 100;

  const duration = nextItem ? nextItem.time - item.time : 500; // fallback duration
  const rectWidth = item.time * timeScale;
  const rectHeight = item.velocity * velocityScale;

  const colorMap = {
    Inflation: "lime",
    Deflation: "red",
    Holding: "yellow",
    "full deflation": "blue"
  };
  const color = colorMap[item.action] || "white";

  return (
    <Rect
      key={index}
      x={0}
      y={y - rectHeight / 2}
      width={rectWidth}
      height={rectHeight}
      fill={color}
      stroke="white"
      strokeWidth={0.5}
    />
  );
})}


  </Layer>
</Stage>
</div>


<div className="playground-wrapper">
  <div className="playground-grid">
   <input
  value={patternName}
  onChange={(e) => setPatternName(e.target.value)}
  placeholder="Pattern name"
/>

<button onClick={savePatternToDB}>Save Pattern to DB</button>

</div>
  {/* Dummy data table */}
  <div className="playground-table">
    <div className="playground-header">
      <div>Pad</div>
      <div>Action</div>
      <div>Time</div>
      <div>Velocity</div>
    </div>
    {props.multiZoneWiP.map((item, index) => (
      <div className="playground-row" key={index}>
        <div>{item.pad}</div>
          <div>{item.action}</div>
        <div>{item.time} ms</div>
        <div>{item.velocity}</div>
          <button className='grid-button'>X</button>
        
      
      </div>
    ))}
  </div>

  {/* Input grid for adding actions */}
  <div className="playground-grid">
    <select onChange={selectPadACB}>
      <option value={0}>pad 0</option>
      <option value={1}>pad 1</option>
      <option value={2}>pad 2</option>
      <option value={3}>pad 3</option>
      <option value={4}>pad 4</option>
      <option value={5}>pad 5</option>
      <option value={6}>pad 6</option>
    </select>

    <select onChange={selectActionACB}>
      <option value={"Inflation"}>Inflation</option>
      <option value={"Deflation"}>Deflation</option>
      <option value={"Holding"}>Holding</option>
      <option value={"full deflation"}>Full deflation</option>
      
    </select>

    <input placeholder="time in milliseconds"  onChange={selectTimeACB}/>

    <input
      className="playground-slider"
      type="range"
      id="rhythmic"
      min="0"
      max="127"
      onChange={selectVelocityACB}
    />

    <button className="playground-button"  onClick={appendACB}>Add Action</button>
  </div>
</div>



      <button
        onClick={playACB}
        style={{ padding: '10px 20px', fontSize: '1.1em', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background-color 0.2s' }}
      >
        Play Pattern
      </button>


      <div className="pattern-cards">
  {savedPatterns.map((pattern, idx) => (
    <div key={idx} className="pattern-card" style={{
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '15px',
      margin: '10px 0',
      backgroundColor: '#222',
      color: 'white'
    }}>
      <h3>{pattern.name}</h3>
      <button onClick={() => playPattern(pattern.sequence)} style={{ marginTop: '10px' }}>
        Play Pattern
      </button>
    </div>
  ))}
</div>


    </div>

    
  );

  function appendACB(){
    props.appendACB()
    
  }

  function playPattern(sequence) {
  props.playSequence(sequence); // Replace with your actual method
}


 function selectPadACB(event) {
  props.selectpad(event.target.value)
  console.log(event.target.value);
}

 function selectActionACB(event) {
  props.selectaction(event.target.value)
  console.log(event.target.value);
}

 function selectTimeACB(event) {
  props.selectTime(event.target.value)
 
}

function selectVelocityACB(event) {
  props.selectVelocity(event.target.value)
 
}

function playACB() {
  props.play()
 
}


}
