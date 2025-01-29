import { PlaygroundView } from "../views/playgroundView";
import { observer } from "mobx-react-lite";

const Playground = observer(
function (props){
  var pot = props.model.pot
    return <PlaygroundView inflateDown={inflateDownACB} inflateUp={inflateUpACB} deflateDown={deflateDownACB} 
    deflateUp={deflateUpACB} potchange={potchangeACB} start={startACB} stop={stopACB} replay={replayACB}/>;

    function inflateDownACB(){
        props.model.recordEvent("inflate", "press",pot);
        props.model.buttonDownNote(60,pot)
    }
    function inflateUpACB(){
        props.model.recordEvent("inflate", "release",pot);
        props.model.buttonUpNote(60,pot)
    }

    function deflateDownACB(){
        props.model.recordEvent("deflate", "press",pot);
        props.model.buttonDownNote(67,pot)
    }
    function deflateUpACB(){
        props.model.recordEvent("deflate", "release",pot);
        props.model.buttonUpNote(67,pot)
    }

    function potchangeACB(x){
       props.model.changePot(x)
    }

    function startACB(){
        props.model.startRecording()
    }

    function replayACB(){
        props.model.playbackSequence()
    }

    function stopACB(){
        props.model.stopRecording()
        console.log(props.model.sequence)
    }
});

export { Playground }

