import React, { useState, useEffect } from "react";
import { db } from "../../firebaseModel";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { CircumplexMini } from "./circumplexPlot";
import "./style.css";
import { t } from "../i18n";

export function TestView(props) {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [touches, setTouches] = useState([]);
  const [selectedTouchName, setSelectedTouchName] = useState("");
  const [feltSensation, setFeltSensation] = useState("");
  const [testerName, setTesterName] = useState("");

  useEffect(() => {
    const fetchTouches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "touches"));
        const fetchedTouches = querySnapshot.docs.map((doc) => ({
          name: doc.data().name,
          // The recorded inflate/deflate events live in `sequence` — the same
          // field the library and detail pages play from.
          sequence: doc.data().sequence,
          id: doc.id,
        }));
        setTouches(fetchedTouches);
      } catch (error) {
        console.error("Error fetching touches: ", error);
      }
    };

    fetchTouches();
  }, []);

  const selectedTouch = touches.find((touch) => touch.name === selectedTouchName) || null;

  const handlePlayClick = () => {
    if (selectedTouch?.sequence) {
      props.onPlay(selectedTouch.sequence);
    } else {
      console.warn("No touch sequence selected to play.");
    }
  };

  const saveDataToFirestore = async (touchName, data, sensation, tester) => {
    try {
      if (!touchName) {
        console.error("Touch name is undefined or empty. Cannot save to Firestore.");
        return;
      }
      const testDataRef = doc(db, "testData", `${touchName}-${Date.now()}`); // Unique ID

      const saveData = {
        testedTouch: touchName,
        testData: [{ x: data.x, y: data.y }],
        feltSensation: sensation,
        testerName: tester,
        timestamp: Date.now(),
      };

      await setDoc(testDataRef, saveData);
      console.log("Test data saved to Firestore successfully for touch:", touchName);
    } catch (error) {
      console.error("Error saving test data to Firestore:", error);
    }
  };

  const handleSaveTest = () => {
    if (!testerName.trim()) {
      alert(t("enter_your_name_alert", props.language));
      return;
    }
    saveDataToFirestore(selectedTouchName, point, feltSensation, testerName);
    setFeltSensation("");
    setTesterName("");
    setPoint({ x: 0, y: 0 });
  };

  return (
    <div className="tl-page">
      <h1 className="tl-h1">{t("test_a_touch_title", props.language)}</h1>

      <div className="tl-row">
        <select
          className="tl-select"
          style={{ flex: 1, minWidth: 200, width: "auto" }}
          value={selectedTouchName}
          onChange={(e) => setSelectedTouchName(e.target.value)}
        >
          <option value="">{t("select_a_touch", props.language)}</option>
          {touches.map((touch) => (
            <option key={touch.id} value={touch.name}>
              {touch.name}
            </option>
          ))}
        </select>
        <button className="tl-btn" onClick={handlePlayClick} disabled={!selectedTouchName}>
          {t("play_touch", props.language)}
        </button>
      </div>

      <CircumplexMini
        variant="test"
        point={point}
        onPick={setPoint}
        language={props.language}
      />

      <textarea
        className="tl-textarea"
        style={{ maxWidth: 500 }}
        placeholder={t("felt_sensation_placeholder", props.language)}
        value={feltSensation}
        onChange={(e) => setFeltSensation(e.target.value)}
        rows={4}
      />

      <input
        type="text"
        className="tl-input"
        style={{ maxWidth: 500 }}
        placeholder={t("your_name_placeholder", props.language)}
        value={testerName}
        onChange={(e) => setTesterName(e.target.value)}
      />

      <button className="tl-btn" style={{ alignSelf: "flex-start" }} onClick={handleSaveTest}>
        {t("save_test_data", props.language)}
      </button>
    </div>
  );
}
