import { model } from "../model";
import { observable, configure } from "mobx";
import { ReactRoot } from "./reactRoot";
import React from "react";
import { createRoot } from "react-dom/client";
import { connectToFirebase } from "../firebaseModel";
import { LANGUAGE_STORAGE_KEY } from "./i18n";
// Imported last on purpose: design.css layers the redesign's tokens and
// components over the legacy rules in style.css, which the screens that
// haven't been redesigned yet still depend on.
import "./views/design.css";

configure({ enforceActions: "never" });




const reactiveModel = observable(model);
window.myModel = reactiveModel;

try {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage) {
    reactiveModel.language = savedLanguage;
  }
} catch (error) {
  console.error("Could not read saved language preference:", error);
}


function setupPathListener(model) {
  const handlePathChange = () => {
    model.side = false; 
  };


  window.addEventListener("popstate", handlePathChange);
  window.addEventListener("hashchange", handlePathChange);

  handlePathChange();
}

setupPathListener(reactiveModel);
connectToFirebase(reactiveModel)

// Try to reconnect MIDI automatically on load. If the browser already granted
// MIDI permission before (Chrome remembers it per-origin), this reconnects
// silently with no picker/prompt — avoids needing "Authorize Midi Devices"
// again after every page refresh.
reactiveModel.connectToMIDI()

document.body.classList.add("tl-body");

createRoot(document.getElementById("root")).render(<ReactRoot model={reactiveModel} />);
