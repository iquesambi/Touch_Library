import "./style.css"
import { model } from "../../model";
import { loginFirebase } from "../../firebaseModel";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseModel";
import { t } from "../i18n";



export function SideMenuView(props){
    return (
        <nav className="side">
      <button onClick={closesideACB}>x</button>
        <ul>
        <li><h4><a href="#/" >{t("nav_library", props.language)}</a></h4></li>
        <li><h4><a href="#/upload">{t("nav_upload", props.language)}</a></h4></li>
        <li><h4><a href="#/shape">{t("nav_shape", props.language)}</a></h4></li>



        </ul>

        <button  disabled={props.midiAuth} onClick={connectACB} className="button_side">{t("authorize_midi", props.language)}</button>
        {props.midiAuth && (
            <div className="midi-status">
                <span className={props.midiConnected ? "midi-dot midi-dot-on" : "midi-dot midi-dot-off"}></span>
                {props.midiConnected ? props.midiInputName : `${props.midiInputName} (disconnected)`}
            </div>
        )}
        <button onClick={loginACB} className="button_side">{t("login", props.language)}</button>

        <label className="language-picker">
            {t("language_label", props.language)}:{" "}
            <select value={props.language} onChange={(e) => props.onLanguageChange(e.target.value)}>
                <option value="en">English</option>
                <option value="pt">Português</option>
            </select>
        </label>


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