import { TouchDetailView } from "../views/touchDetailView";
import { observer } from "mobx-react-lite";

const TouchDetail = observer(function (props) {
    return (
        <TouchDetailView
            userName={props.model.user?.displayName}
            language={props.model.language}
            onPlay={playACB}
        />
    );

    function playACB(sequence) {
        if (!sequence) return;
        props.model.savesequence(sequence);
        props.model.playbackSequence();
    }
});

export { TouchDetail }
