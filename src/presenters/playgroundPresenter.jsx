import { PlaygroundView } from "../views/playgroundView";
import { observer } from "mobx-react-lite";

const Playground = observer(
function (props){
    return <PlaygroundView/>;
});

export { Playground }

