import React, { useEffect, useRef, useState } from "react";
import { toJS } from "mobx";
import { db } from "../../firebaseModel";
import { doc, setDoc } from "firebase/firestore";
import { Chart } from "chart.js/auto";
import "chartjs-plugin-dragdata"; // Import the dragdata plugin
import "./style.css";

export function UploadView(props) {
    const lineChartRef = useRef(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [recording, setRecording] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [touches, setTouches] = useState([]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "a") {
                console.log("Key 'i' pressed: Inflate start");
                inflateStartACB();
            } else if (event.key === "s") {
                console.log("Key 's' pressed: Deflate start");
                deflateStartACB();
            } else if (event.key === "d") {
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
            } else if (event.key === "d") {
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

    function toggleRecording() {
        if (recording) {
            props.stop();
            setTimeout(() => {
                const updatedTouches = toJS(props.sequence);
                setTouches(updatedTouches);
            }, 0);
        } else {
            props.start();
        }
        setRecording(!recording);
    }

    function toggleReplay() {
        if (!replaying) {
            props.replay();
            setReplaying(true);
        } else {
            props.stopReplay();
            setReplaying(false);
        }
    }

    function saveACB() {
        if (!name || !description) {
            alert("Please fill in the name and description.");
            return;
        }

        const touches = toJS(props.sequence);

        touches.forEach((touch, index) => {
            console.log(`Touch at index ${index}:`, touch);
        });

        const touchRef = doc(db, "touches", name);

        console.log("Touch data to be saved:", touches);

        const touchData = {
            name: name,
            description: description,
            userName: props.userName,
            createdAt: new Date(),
            sequence: touches
        };

        console.log("Final touch data: ", touchData);

        setDoc(touchRef, touchData)
            .then(() => {
                console.log("Touch metadata saved successfully");
                clearForm();
            })
            .then(() => {
                // Pass the name as a URL parameter
                window.location.hash = `#/chart?name=${encodeURIComponent(name)}`;
            })
            .catch((error) => {
                console.error("Error saving touch data:", error);
            });

        if (props.ChangeTouchName) {
            props.ChangeTouchName(name);
        }
    }

    function clearForm() {
        setName('');
        setDescription('');
    }

    useEffect(() => {
        const lineCtx = lineChartRef.current?.getContext("2d");

        if (lineCtx) {
            const lineData = {
                labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
                datasets: [
                    {
                        label: "Pressure over Time",
                        data: [12, 19, 3, 5, 2, 2, 12, 19, 3, 10, 10],
                        borderColor: "rgba(0, 0, 0, 1)",
                        backgroundColor: "rgba(241, 245, 249, 1)",
                        fill: true,
                        borderWidth: 3,
                        dragData: true, // Enable dragData for this dataset
                    },
                ],
            };

            const lineConfig = {
                type: "line",
                data: lineData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        dragData: {
                            round: false,
                            showTooltip: true,
                            dragX: true,
                        },
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false },
                    },
                    elements: {
                        line: { tension: 0.1 },
                    },
                },
            };

            const lineChart = new Chart(lineCtx, lineConfig);

            return () => {
                lineChart.destroy();
            };
        }
    }, []);

    return (
        <div className="main">
            <div className="holder">
                <input
                    type="text"
                    placeholder="Touch name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    onClick={saveACB}
                    disabled={!name || !description || touches.length === 0}
                >
                    Save
                </button>
                <button onClick={toggleRecording}>
                    {recording ? "Stop Recording" : "Start Recording"}
                </button>
                <button onClick={toggleReplay}>
                    {replaying ? "Stop" : "Replay"}
                </button>

                <div className="chart">
                    <canvas ref={lineChartRef}></canvas>
                </div>

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
                        <button className="playground-button" onMouseDown={fulldeflateStartACB}
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
                </div>

                <div className="bottom_form">
                    <label>Author</label>
                    <input
                        className="author"
                        value={props.userName}
                        readOnly
                    />
                    <textarea
                        maxLength="200"
                        placeholder="Add a short description here..."
                        rows="5"
                        cols="33"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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

    function fulldeflateStartACB() {
        console.log("full Deflate started");
        props.deflateDown();
    }

    function fulldeflateStopACB() {
        console.log("full Deflate stopped");
        props.deflateUp();
    }

    function sliderChangeACB(evt) {
        props.potchange(evt.target.value);
    }
}
