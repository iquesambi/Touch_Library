import { FeedbackView } from "../views/feedbackView";
import { provider } from "../../firebaseModel";
import { signInWithPopup } from "firebase/auth";
import { auth } from "../../firebaseModel";
import { observer } from "mobx-react-lite";

const Feedback = observer(function (props) {
    return <FeedbackView
        userName={props.model.user?.displayName}
        language={props.model.language}
        onPlay={playACB}
        onLoginClick={loginACB}
    />;

    function playACB(sequence) {
        if (!sequence) return;
        props.model.savesequence(sequence);
        props.model.playbackSequence();
    }

    function loginACB() {
        signInWithPopup(auth, provider);
    }
});

export { Feedback };
