import { ShapeEditorView } from "../views/shapeEditorView";
import { observer } from "mobx-react-lite";

const ShapeEditor = observer(function (props) {
    return <ShapeEditorView model={props.model} language={props.model.language} />;
});

export { ShapeEditor };
