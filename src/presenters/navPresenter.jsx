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
            onUserClick={userClickACB}
            onLoginClick={loginACB}
        />
    );

    function toogleACB() {
        props.model.toggleMenu();
        console.log("Menu toggled");
    }

    function userClickACB() {
        console.log("User image clicked");
        // Add additional logic here if needed
    }

    function loginACB() {
        console.log("Login button clicked");
        signInWithPopup(auth, provider);
    }
});

export { Nav };
