import "./style.css"
import { model } from "../../model";

export function SideMenuView(props){
    return (
        <nav className="side">
            <p>react</p>
        <ul>
        <li><h4><a href="#/" >Library</a></h4></li>
        <li><h4><a href="#/upload">Upload</a></h4></li>
        <li><h4><a href="#/playground">Playground</a></h4></li>
        </ul>

        <button  disabled={props.midiAuth}>Authorize Midi Devices</button>
        <button >Test connection</button>
     
 
        <button disabled={props.isSerialConnected}>Connect serial</button>
        <button onClick={loginACB}>Log in</button> 
        </nav>
      );

      function loginACB(){
        props.login()
        console.log(model.user)
    }

}