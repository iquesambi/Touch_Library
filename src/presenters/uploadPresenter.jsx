import { CreateEntryView } from "../views/createEntryView";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { t } from "../i18n";

const Upload = observer(function (props) {
    const loggedOut = props.model.user == null;

    // Runs once per actual login-state change instead of on every render —
    // doing this directly in the render body caused alert()/redirect to fire
    // repeatedly (once per re-render) any time something else on the page
    // changed state, e.g. MIDI (re)connecting.
    useEffect(() => {
        if (loggedOut) {
            alert(t("login_to_save_alert", props.model.language));
            window.location.hash = "#/";
        }
    }, [loggedOut]);

    if (loggedOut) {
        return null; // Prevent rendering if no user is logged in
    }

    return (
        <CreateEntryView
            model={props.model}
            userName={props.model.user?.displayName}
            language={props.model.language}
            start={startACB}
            stop={stopACB}
            replay={replayACB}
            stopReplay={stopReplayACB}
            toggleListen={toggleMIDIListenACB}
        />
    );

    function toggleMIDIListenACB() {
        props.model.toggleMIDIListener();
    }

    function startACB() {
        props.model.startRecording();
    }

    function stopACB() {
        props.model.stopRecording();
    }

    function replayACB() {
        props.model.playbackSequence();
    }

    function stopReplayACB() {
        props.model.stopReplay();
    }
});

export { Upload };
