import { model } from "../model";
import { observable, configure } from "mobx";
configure({ enforceActions: "never" }); 

// Making the model reactive
const reactiveModel = observable(model);
window.myModel = reactiveModel; // Expose model to the Console

// React and Router setup
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SideMenu } from "./presenters/sideMenuPresenter";
import { Playground } from "./presenters/playgroundPresenter";
import { Upload } from "./presenters/uploadPresenter";
import { Visualization } from "./presenters/touchVisualizationPresenter";
import { Library } from "./presenters/libraryPresenter";
import { ScatterChart } from "./presenters/chartPresenter";
import { Nav } from "./presenters/navPresenter";


function makeRouter(model) {
  return (
    <div>
       <Nav model={model} /> 
       <SideMenu model={model} /> 
    <HashRouter>
    
   
    

          <Routes>
            <Route path="/playground" element={<Playground model={model} />} />
            <Route path="/upload" element={<Upload model={model} />} />
            <Route path="/visualization" element={<Visualization model={model} />} />
            <Route path="/chart" element={<ScatterChart model={model} />} />
            <Route path="/" element={<Library model={model} />} />
          </Routes>
    </HashRouter>
    </div>
  );
}

createRoot(document.getElementById("root")).render(makeRouter(reactiveModel));

