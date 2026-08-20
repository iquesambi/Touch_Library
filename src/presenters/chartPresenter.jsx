import { observer } from "mobx-react-lite";
import { ScatterChartView } from "../views/chartView";

const ScatterChart = observer(
function (props){
    return <ScatterChartView touch={props.model.touchName} language={props.model.language} />;
});

export { ScatterChart }

