import React, { useEffect, useRef, useState } from "react";
import { toJS } from "mobx";
import { db } from "../../firebaseModel";
import { doc, setDoc } from "firebase/firestore";
import { Chart } from "chart.js/auto";
import "chartjs-plugin-dragdata";
import "./style.css";

export function UploadView(props) {
    const lineChartRef = useRef(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [recording, setRecording] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [touches, setTouches] = useState([]);
    const [pressureData, setPressureData] = useState([]);
    const pressureIntervalRef = useRef(null);



    function toggleRecording() {
        if (recording) {
            props.stop();
            clearInterval(pressureIntervalRef.current);
            pressureIntervalRef.current = null;
            props.toggleListen()
           

            setTimeout(() => {
                const updatedTouches = toJS(props.sequence);
                setTouches(updatedTouches);
            }, 0);
        } else {
            setPressureData([]);
            props.start();
            props.toggleListen()

            pressureIntervalRef.current = setInterval(() => {
                const intPart = props.model.lastIntPressure || 0;
                const decPart = props.model.lastDecPressure || 0;
                const pressure = parseFloat((intPart + decPart / 100.0).toFixed(2));
                setPressureData(prev => [...prev, pressure]);
            }, 50);
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
        const touchRef = doc(db, "touches", name);

        const touchData = {
            name: name,
            description: description,
            userName: props.userName,
            createdAt: new Date(),
            sequence: touches,
            pressure: props.pressureArray,
        };

        console.log("Saving data:", touchData);

        setDoc(touchRef, touchData)
            .then(() => {
                console.log("Touch metadata saved successfully");
                clearForm();
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
                        dragData: true,
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

              

                <div className="bottom_form">
                    <label>Author</label>
                    <input className="author" value={props.userName} readOnly />
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
        props.inflateDown();
    }

    function inflateStopACB() {
        props.inflateUp();
    }

    function deflateStartACB() {
        props.deflateDown();
    }

    function deflateStopACB() {
        props.deflateUp();
    }

    function fulldeflateStartACB() {
        props.deflateDown();
    }

    function fulldeflateStopACB() {
        props.deflateUp();
    }

    function sliderChangeACB(evt) {
        props.potchange(evt.target.value);
    }
}
