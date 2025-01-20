import { LibraryView } from "../views/libraryView";
import { observer } from "mobx-react-lite";

const Library = observer(
function (props){
    return <LibraryView library={props.model.library}/>;
});

export { Library }

