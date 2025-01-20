import { SideMenuView } from "../views/sideMenuView";
import { provider } from "../../firebaseModel";
import { signInWithRedirect, signOut } from "firebase/auth";
import { auth } from "../../firebaseModel";
import { observer } from "mobx-react-lite";
import { model } from "../../model";

const SideMenu = observer(function (props) {
    return (
        <SideMenuView login={loginACB} />
    );

    function loginACB() {
        if (!props.model.user) {
            // Sign in without a popup, using redirect
            signInWithRedirect(auth, provider);
     
            console.log(model.user)
        } else {
            signOut(auth);
        }
    }
});

export { SideMenu };
