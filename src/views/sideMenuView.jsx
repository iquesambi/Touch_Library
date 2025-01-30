import "./style.css"
import { model } from "../../model";
import { loginFirebase } from "../../firebaseModel";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseModel";



export function SideMenuView(props){
    return (
        <nav className="side">
      <button onClick={closesideACB}>x</button>
        <ul>
        <li><h4><a href="#/" >Library</a></h4></li>
        <li><h4><a href="#/upload">Upload</a></h4></li>
        <li><h4><a href="#/playground">Playground</a></h4></li>
        </ul>

        <button  disabled={props.midiAuth} onClick={connectACB} className="button_side">Authorize Midi Devices</button>
        <button onClick={loginACB} className="button_side">Log in</button> 

     
        </nav>
      );

      function connectACB(){
        props.connect()

      }

      function loginACB(){
        if ( !model.user){
       props.login()
       
        } else{
            signOut(auth)
            console.log(model.user)
        }
       
    }

    function closesideACB(){
        props.close()
    }

}