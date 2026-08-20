
import { VisualizationView } from "../views/touchVisualizationView";
import { observer } from "mobx-react-lite";

const Visualization = observer(
function (props){
    return <VisualizationView
    userName={props.model.user?.displayName}
    language={props.model.language}
    onPlay={playACB}/>;

    function playACB(sequence) {
        if (!sequence) return;
        props.model.savesequence(sequence);
        props.model.playbackSequence();
    }
});

export { Visualization }

