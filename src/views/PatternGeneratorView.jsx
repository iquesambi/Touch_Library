import React from 'react';

export function BasicVestView(props) {
 
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

  return (
        <div className="playground-container">
    {/*  <h1 style={{ marginBottom: '20px', color: '#333' }}>Vest Pattern Visualizer</h1>

      {/* Vest Representation 
      <div style={{
        position: 'relative',
        width: '300px',
        height: '300px',
        border: '2px solid #666',
        borderRadius: '15px',
        marginBottom: '30px',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>

        
        <h2 style={{ position: 'absolute', top: '15px', color: '#555', fontSize: '1.2em' }}>Vest Actuators</h2>
 
      </div>
<div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr', // Two equal columns
      gap: '10px', // Gap between rows and columns
      padding: '20px',
      backgroundColor: '#f0f0f0', // Light background for the overall grid container
      maxWidth: '800px',
      margin: '20px auto', // Center the grid on the page
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Row 1: Spans both columns 
  
    </div>



    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr', // Two equal columns
      gap: '10px', // Gap between rows and columns
      padding: '20px',
      maxWidth: '800px',
      margin: '20px auto', // Center the grid on the page
   
    }}>
      {/* Row 1: Spans both columns 
      <div style={{
        ...commonDivStyle,
        gridColumn: 'span 2', // This div spans both columns
      }}>
         Pad 6
         
      </div>

      {/* Row 2 
      <div style={commonDivStyle}>
        Pad 5
      </div>
      <div style={commonDivStyle}>
         Pad 4
      </div>

      {/* Row 3 
      <div style={commonDivStyle}>
        Pad 3
      </div>
      <div style={commonDivStyle}>
         Pad 2
      </div>

      {/* Row 4 
      <div style={commonDivStyle}>
     Pad 1
      </div>
      <div style={commonDivStyle}>
       Pad 0
      </div>
    </div>
      {/* Sliders 
      <div >
        <h2 style={{ marginBottom: '15px', color: '#555', fontSize: '1.1em' }}>Parameters (Dummy)</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="deliberateness" style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
            Deliberateness: <span style={{ fontWeight: 'bold', color: '#333' }}>{props.deliberatenessValue}</span>
          </label>
          <input
          className="playground-slider"
            type="range"
            id="deliberateness"
            min="0"
            max="100"
            value={props.deliberatenessValue}
            onChange={(e) => props.onDeliberatenessChange(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="spatiality" style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
            Spatiality: <span style={{ fontWeight: 'bold', color: '#333' }}>{props.spatialityValue}</span>
          </label>
          <input
          className="playground-slider"
            type="range"
            id="spatiality"
            min="0"
            max="100"
            value={props.spatialityValue}
            onChange={(e) => props.onSpatialityChange(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label htmlFor="rhythmic" style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
            Rhythmic: <span style={{ fontWeight: 'bold', color: '#333' }}>{props.rhythmicValue}</span>
          </label>
          <input
          className="playground-slider"
            type="range"
            id="rhythmic"
            min="0"
            max="100"
            value={props.rhythmicValue}
            onChange={(e) => props.onRhythmicChange(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      */}

<div className="playground-wrapper">
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
        onClick={props.onPlayPattern}
        style={{ padding: '10px 20px', fontSize: '1.1em', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background-color 0.2s' }}
      >
        Play Dummy Pattern
      </button>

    </div>

    
  );

  function appendACB(){
    props.appendACB()
    
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



}
