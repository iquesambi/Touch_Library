import { LibraryView } from "../views/libraryView";
import { observer } from "mobx-react-lite";

const Library = observer(
function (props){
    return <LibraryView library={props.model.library} sequenceSave={sequenceSaveACB}
    userName={props.model.user?.displayName}/>;

    function sequenceSaveACB(x){
        console.log("oi")
     props.model.savesequence(x)
       props.model.playbackSequence()
    }
});

export { Library }

