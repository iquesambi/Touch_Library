import { model } from "../model";
import { observable, configure } from "mobx";
import { ReactRoot } from "./reactRoot";
import React from "react";
import { createRoot } from "react-dom/client";
import { connectToFirebase } from "../firebaseModel";

configure({ enforceActions: "never" });




const reactiveModel = observable(model);
window.myModel = reactiveModel; 


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

createRoot(document.getElementById("root")).render(<ReactRoot model={reactiveModel} />);
