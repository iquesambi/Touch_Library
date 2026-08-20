import { SideMenu } from "./presenters/sideMenuPresenter.jsx";
import { Visualization } from "./presenters/touchVisualizationPresenter.jsx";
import { Upload } from "./presenters/uploadPresenter.jsx";
import { Library } from "./presenters/libraryPresenter.jsx";
import { ScatterChart } from "./presenters/chartPresenter.jsx";
import { Playground } from "./presenters/playgroundPresenter.jsx";
import { Nav } from "./presenters/navPresenter.jsx";
import { Test } from "./presenters/testPresenter.jsx";
import { BasicVestPresenter } from "./presenters/patternGeneratorPresenter.jsx";
import { ShapeEditor } from "./presenters/shapeEditorPresenter.jsx";
import { Feedback } from "./presenters/feedbackPresenter.jsx";


import { observer } from "mobx-react-lite";
import { HashRouter, Routes, Route } from "react-router-dom";

function makeRouter(model) {
  return (
    <HashRouter>
      <Nav model={model} />
      {model.side && <SideMenu model={model} />}
      <Routes>
        <Route path="/" element={<Library model={model} />} />
        <Route path="/upload" element={<Upload model={model} />} />
        <Route path="/visualization" element={<Visualization model={model} />} />
        <Route path="/chart" element={<ScatterChart model={model} />} />
        <Route path="/playground" element={<Playground model={model} />} />
        <Route path="/pattern" element={<BasicVestPresenter model={model} />} />
        <Route path="/shape" element={<ShapeEditor model={model} />} />
        <Route path="/test" element={<Test model={model} />} />
        <Route path="/visualization/:id" element={<Visualization model={model} />} />
        <Route path="/feedback/:id" element={<Feedback model={model} />} />

      </Routes>
    </HashRouter>
  );
}

const ReactRoot = observer(function ReactRootRender({ model }) {
  return (
    <div>{makeRouter(model)}</div>
  );
});

export { ReactRoot };
