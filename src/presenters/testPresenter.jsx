import { TestView } from "../views/testView";
import { observer } from "mobx-react-lite";

const Test = observer(function (props) {
    return <TestView language={props.model.language} onPlay={playACB} />;

    function playACB(sequence) {
        if (!sequence) return;
        props.model.savesequence(sequence);
        props.model.playbackSequence();
    }
});

export { Test }
