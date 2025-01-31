import { observer } from "mobx-react-lite";
import { NavView } from "../views/navView";
import { provider } from "../../firebaseModel";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../firebaseModel";

const Nav = observer(function (props) {
    return (
        <NavView
            toogle={toogleACB}
            userImage={props.model.user?.photoURL}
            userName={props.model.user?.displayName}
            onLoginClick={loginACB}
        />
    );

    function toogleACB() {
        props.model.toggleMenu();    
    }

    function loginACB() {
        signInWithPopup(auth, provider);
    }
});

export { Nav };
