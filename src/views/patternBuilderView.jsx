// PatternBuilder.js (Conceptual)
import React, { useState, useEffect } from 'react';
import { BasicVestView } from './BasicVestView'; // Assuming BasicVestView is in the same directory

function PatternBuilder() {
  const [patternSteps, setPatternSteps] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [actuatorStates, setActuatorStates] = useState(new Array(7).fill(false)); // For visualization

  // Function to add a new step
  const addStep = () => {
    setPatternSteps(prevSteps => [
      ...prevSteps,
      {
        id: prevSteps.length > 0 ? Math.max(...prevSteps.map(s => s.id)) + 1 : 0, // Simple ID generation
        time: 0, // Default time
        pad: 0, // Default pad
        action: 'inflate', // Default action
        velocity: 100, // Default velocity
      },
    ]);
  };

  // Function to update a step
  const updateStep = (id, field, value) => {
    setPatternSteps(prevSteps =>
      prevSteps.map(step => (step.id === id ? { ...step, [field]: value } : step))
    );
  };

  // Function to delete a step
  const deleteStep = (id) => {
    setPatternSteps(prevSteps => prevSteps.filter(step => step.id !== id));
  };

  // --- Playback Logic (Simplified) ---
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPlaybackTime(prevTime => {
          const newTime = prevTime + 0.1; // Increment by 0.1 seconds
          // Update actuator states for visualization based on newTime and patternSteps
          const newActuatorStates = new Array(7).fill(false); // Reset
          patternSteps.forEach(step => {
            if (newTime >= step.time && step.action === 'inflate') {
              newActuatorStates[step.pad] = true;
            } else if (newTime >= step.time && step.action === 'deflate') {
              newActuatorStates[step.pad] = false;
            }
            // Add 'hold' logic if needed
          });
          setActuatorStates(newActuatorStates);

          // Stop playback if all actions are done
          const maxTime = Math.max(...patternSteps.map(step => step.time));
          if (newTime > maxTime + 1) { // Add a buffer
            setIsPlaying(false);
            setCurrentPlaybackTime(0);
            setActuatorStates(new Array(7).fill(false)); // Reset visualization
          }
          return newTime;
        });
      }, 100); // Update every 100ms
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, patternSteps]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentPlaybackTime(0); // Reset time when playing
    }
  };

  return (
    <div className="pattern-builder-container">
      <BasicVestView
        actuatorStates={actuatorStates}
        deliberatenessValue={0} // Dummy for now
        spatialityValue={0} // Dummy for now
        rhythmicValue={0} // Dummy for now
        onDeliberatenessChange={() => {}}
        onSpatialityChange={() => {}}
        onRhythmicChange={() => {}}
        onPlayPattern={togglePlay}
        message={isPlaying ? `Playing... Time: ${currentPlaybackTime.toFixed(1)}s` : 'Ready to build pattern'}
      />

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginBottom: '15px', color: '#555', fontSize: '1.2em' }}>Build Your Pattern</h2>
        <button onClick={addStep} style={{ marginBottom: '15px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Add New Action
        </button>

        {patternSteps.length === 0 && <p>No actions yet. Click "Add New Action" to start!</p>}

        {patternSteps.map(step => (
          <div key={step.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center', border: '1px solid #eee', padding: '10px', borderRadius: '5px', backgroundColor: '#fff' }}>
            <label>
              Time (s):
              <input
                type="number"
                step="0.1"
                value={step.time}
                onChange={(e) => updateStep(step.id, 'time', parseFloat(e.target.value))}
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
            <label>
              Pad:
              <select
                value={step.pad}
                onChange={(e) => updateStep(step.id, 'pad', parseInt(e.target.value, 10))}
                style={{ marginLeft: '5px' }}
              >
                {/* Dynamically generate options based on actuatorLayout in BasicVestView or a shared constant */}
                {[...Array(7).keys()].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            <label>
              Action:
              <select
                value={step.action}
                onChange={(e) => updateStep(step.id, 'action', e.target.value)}
                style={{ marginLeft: '5px' }}
              >
                <option value="inflate">Inflate</option>
                <option value="deflate">Deflate</option>
                <option value="hold">Hold</option>
              </select>
            </label>
            <label>
              Velocity:
              <input
                type="range"
                min="0"
                max="127"
                value={step.velocity}
                onChange={(e) => updateStep(step.id, 'velocity', parseInt(e.target.value, 10))}
                style={{ width: '80px', marginLeft: '5px' }}
              />
              <span>{step.velocity}</span>
            </label>
            <button onClick={() => deleteStep(step.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatternBuilder;