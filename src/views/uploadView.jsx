import { toJS } from "mobx"; // Import MobX's toJS function
import { db } from "../../firebaseModel"; // Ensure to import Firestore db
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore"; // Firestore functions

export function UploadView(props) {
    const [name, setName] = useState(''); // Touch name state
    const [description, setDescription] = useState(''); // Description state
    const [recording, setRecording] = useState(false); // Track recording state
    const [replaying, setReplaying] = useState(false); // Track replaying state
    const [touches, setTouches] = useState([]); // Track touches with React state

    function toggleRecording() {
        if (recording) {
            props.stop(); // Stop recording
            console.log("Sequence before toJS:", props.sequence);

            // Use a timeout to allow MobX state to update
            setTimeout(() => {
                const updatedTouches = toJS(props.sequence); // Convert MobX sequence to plain object
                console.log("Converted touches:", updatedTouches);

                // Update the React state to trigger a re-render
                setTouches(updatedTouches);
            }, 0);
        } else {
            props.start(); // Start recording
        }
        setRecording(!recording); // Update recording state
    }

    function toggleReplay() {
        if (!replaying) {
            props.replay(); // Start replay
            setReplaying(true);
        } else {
            props.stopReplay(); // Stop replay
            setReplaying(false);
        }
    }

    // Function to save data to Firestore
    function saveACB() {
        if (!name || !description) {
            alert("Please fill in the name and description.");
            return;
        }
    
        // Convert MobX sequence to plain object inside the save function
        const touches = toJS(props.sequence); // Convert MobX sequence to plain object
        
        // Log each item in the touches array to check for undefined values
        touches.forEach((touch, index) => {
            console.log(`Touch at index ${index}:`, touch);
        });
    
        // Correct Firestore collection reference for metadata
        const touchRef = doc(db, "touches", name); // Creates or updates a document with the touch name as its ID
    
        // Log the data to be saved to Firestore before saving
        console.log("Touch data to be saved:", touches);
    
        // Prepare the touch metadata
        const touchData = {
            name: name,
            description: description,
            createdAt: new Date(), // Timestamp for when it was created
            sequence: touches
        };
    
        // Log the final touch data
        console.log("Final touch data: ", touchData);
    
        // Save the metadata to Firestore
        setDoc(touchRef, touchData)
            .then(() => {
                console.log("Touch metadata saved successfully");
                clearForm();
            })
            .catch((error) => {
                console.error("Error saving touch data:", error);
            });
    }
    

    // Function to clear the form after save
    function clearForm() {
        setName('');
        setDescription('');
    }

    return (
        <div className="main">
            <div className="holder">
                <input
                    type="text"
                    placeholder="Touch name"
                    value={name}
                    onChange={(e) => setName(e.target.value)} // Update the name state
                />
                <button
                    onClick={saveACB}
                    disabled={!name || !description || touches.length === 0} // Disable if name, description, or touches are missing
                >
                    Save
                </button>
                <button onClick={toggleRecording}>
                    {recording ? "Stop Recording" : "Start Recording"}
                </button>
                <button onClick={toggleReplay}>
                    {replaying ? "Stop" : "Replay"}
                </button>

                <div className="chart"></div> {/* Chart rendering will happen here */}
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
                </div>

                <div className="bottom_form">
                    <label>Author</label>
                    <input className="author" onChange={authorInputACB} />
                    <textarea
                        maxLength="200"
                        placeholder="Add a short description here..."
                        rows="5"
                        cols="33"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)} // Update description state
                    ></textarea>
                </div>
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

    function sliderChangeACB(evt) {
        props.potchange(evt.target.value);
    }

    function authorInputACB(evt) {
        props.author(evt.target.value);
    }
}
