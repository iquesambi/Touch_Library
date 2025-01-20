import { observer } from "mobx-react-lite";
import { NavView } from "../views/navView";

const Nav = observer(
function (props){
    return <NavView />;
});

export { Nav }

