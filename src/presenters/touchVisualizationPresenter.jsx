
import { VisualizationView } from "../views/touchVisualizationView";
import { observer } from "mobx-react-lite";

const Visualization = observer(
function (props){
    return <VisualizationView   
    userName={props.model.user?.displayName}/>;

});

export { Visualization }

