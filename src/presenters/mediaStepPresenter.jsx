import { MediaStepView } from "../views/mediaStepView";
import { observer } from "mobx-react-lite";

const MediaStep = observer(function (props) {
    return <MediaStepView language={props.model.language} />;
});

export { MediaStep }
