import { SideMenuView } from "../views/sideMenuView";
import { provider } from "../../firebaseModel";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../firebaseModel";
import { observer } from "mobx-react-lite";
import { model } from "../../model";

const SideMenu = observer(function (props) {
    return (
        <SideMenuView login={loginACB} close={closeACB} connect={connectACB} midiAuth={props.model.midiAuth}/>
    );

    function loginACB() {
        if (!props.model.user) {
            // Sign in without a popup, using redirect
            signInWithPopup(auth, provider);
     
            console.log(model.user)
        } else {
            signOut(auth);
        }
    }

    function closeACB(){
        props.model.toggleMenu()
    }

    function connectACB(){
        props.model.connectToSerialAndMIDI()
    }
});

export { SideMenu };
