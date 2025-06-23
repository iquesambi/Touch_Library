import { TestView } from "../views/testView";
import { observer } from "mobx-react-lite";

const Test = observer(
function (props){
    return <TestView />;

  
});

export { Test }

