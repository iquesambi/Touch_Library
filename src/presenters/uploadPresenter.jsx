
import { UploadView } from "../views/uploadView";
import { observer } from "mobx-react-lite";

const Upload = observer(
function (props){
    return <UploadView   
    zones ={props.model.zones} 
    decrease={decreaseACB}
    increase={increaseACB}
    name ={addNameACB}
    author ={addAuthorACB}
    tube ={addInputACB}
    description ={addDescriptionACB} 
    saveLibrary ={saveLibrary}
    user ={props.model.user}
    touch = {props.model.currentTouch} />;

  
    function decreaseACB(){
        props.model.decreaseZone()
        props.model.addZones()
    }

    function increaseACB(){
        props.model.increaseZone()
        props.model.addZones()
    }

    function addNameACB(input){
        props.model.addName(input)
    }

    function addAuthorACB(input){
        props.model.addAuthor(input)
    }

    function addInputACB(input){
        props.model.addTube(input)
    }

    function addDescriptionACB(input){
        props.model.addDescription(input)
        console.log(props.model.currentTouch)
    }

    function saveLibrary(){
        console.log(props.model.currentTouch)
      
        props.model.saveToLibrary()
        saveLibraryToFirebase(props.model);
    }
    
});

export { Upload }

