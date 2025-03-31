import { observer } from "mobx-react-lite";
import { AnalysisView } from "../views/analysisView";

const Analysis = observer(
function (props){
    return <AnalysisView />;
});

export { Analysis }

