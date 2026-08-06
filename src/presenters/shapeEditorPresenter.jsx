import { ShapeEditorView } from "../views/shapeEditorView";
import { observer } from "mobx-react-lite";

const ShapeEditor = observer(function (props) {
    return <ShapeEditorView model={props.model} />;
});

export { ShapeEditor };
