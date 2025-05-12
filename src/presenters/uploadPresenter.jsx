import { UploadView } from "../views/uploadView";
import { observer } from "mobx-react-lite";

const Upload = observer(function (props) {
    if (props.model.user == null) {
        alert("Please, log in to save");
        window.location.hash = "#/";

        return null; // Prevent rendering if no user is logged in
    }

    const pot = props.model.pot; // Move `pot` here

    return (
        <UploadView
            zones={props.model.zones}
            decrease={decreaseACB}
            increase={increaseACB}
            name={addNameACB}
            author={addAuthorACB}
            tube={addInputACB}
            description={addDescriptionACB}
            saveLibrary={saveLibrary}
            user={props.model.user}
            recording={props.model.recording}
            touch={props.model.currentTouch}
            inflateDown={inflateDownACB}
            inflateUp={inflateUpACB}
            deflateDown={deflateDownACB}
            deflateUp={deflateUpACB}
            fulldeflateDown={fulldeflateDownACB}
            fulldeflateUp={fulldeflateUpACB}
            potchange={potchangeACB}
            start={startACB}
            stop={stopACB}
            replay={replayACB}
            stopReplay={stopACB}
            sequence={props.model.sequence}
            replayStatus={props.model.replaying}
            userName={props.model.user?.displayName}
            ChangeTouchName={changeNameACB}
        />
    );

    function decreaseACB() {
        props.model.decreaseZone();
        props.model.addZones();
    }

    function changeNameACB(name) {
        props.model.changeName(name);
        console.log(props.model.touchName);
    }

    function stopACB() {
        props.model.stopReplay();
    }

    function increaseACB() {
        props.model.increaseZone();
        props.model.addZones();
    }

    function addNameACB(input) {
        props.model.addName(input);
    }

    function addAuthorACB(input) {
        props.model.addAuthor(input);
    }

    function addInputACB(input) {
        props.model.addTube(input);
    }

    function addDescriptionACB(input) {
        props.model.addDescription(input);
        console.log(props.model.currentTouch);
    }

    function saveLibrary() {
        console.log("Saving touch data...");
        props.model.saveToLibrary();
    }

    function inflateDownACB() {
        props.model.recordEvent("inflate", "press", pot);
        props.model.buttonDownNote(60, pot);
    }

    function inflateUpACB() {
        props.model.recordEvent("inflate", "release", pot);
        props.model.buttonUpNote(60, pot);
    }

    function deflateDownACB() {
        props.model.recordEvent("deflate", "press", pot);
        props.model.buttonDownNote(67, pot);
    }

    function deflateUpACB() {
        props.model.recordEvent("deflate", "release", pot);
        props.model.buttonUpNote(67, pot);
    }

    function fulldeflateDownACB() {
        props.model.stopRecording()
        props.model.buttonDownNote(71, pot);
    }

    function fulldeflateUpACB() {
       // props.model.recordEvent("deflate", "release", pot);
        props.model.buttonUpNote(71, pot);
    }

    function potchangeACB(x) {
        props.model.changePot(x);
    }

    function startACB() {
        props.model.startRecording();
    }

    function replayACB() {
        props.model.playbackSequence();
    }

    function stopACB() {
        props.model.stopRecording();
        console.log(props.model.sequence);
    }
});

export { Upload };
