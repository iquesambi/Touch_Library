import { SideMenu } from "./presenters/sideMenuPresenter.jsx";
import { Visualization } from "./presenters/touchVisualizationPresenter.jsx";
import { TouchDetail } from "./presenters/touchDetailPresenter.jsx";
import { MediaStep } from "./presenters/mediaStepPresenter.jsx";
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
      <main className="tl-main">
        <Routes>
          <Route path="/" element={<Library model={model} />} />
          <Route path="/upload" element={<Upload model={model} />} />
          <Route path="/visualization" element={<Visualization model={model} />} />
          <Route path="/chart" element={<ScatterChart model={model} />} />
          <Route path="/playground" element={<Playground model={model} />} />
          <Route path="/pattern" element={<BasicVestPresenter model={model} />} />
          <Route path="/shape" element={<ShapeEditor model={model} />} />
          <Route path="/test" element={<Test model={model} />} />
          {/* Step 3 of the record flow, and the redesigned touch detail page. */}
          <Route path="/media/:id" element={<MediaStep model={model} />} />
          <Route path="/visualization/:id" element={<TouchDetail model={model} />} />
          <Route path="/feedback/:id" element={<Feedback model={model} />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

const ReactRoot = observer(function ReactRootRender({ model }) {
  return (
    <div className="tl-app">{makeRouter(model)}</div>
  );
});

export { ReactRoot };
