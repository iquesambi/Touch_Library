import { initializeApp } from "firebase/app";
import { getDatabase, set, ref, get, onValue, off } from "firebase/database";
import { firebaseConfig} from "./firebaseConfig";
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCredential} from "firebase/auth";

import { model } from "./model";


import { getStorage } from "firebase/storage";
import { ref as ref_storage } from "firebase/storage";




const app= initializeApp(firebaseConfig)
export const auth = getAuth(app);
const db= getDatabase(app);

export const provider = new GoogleAuthProvider();



const PATH="touchLibrary/";

// Create a root reference
export const storage = getStorage();

// Create a reference to 'mountains.jpg'
const group = "group1"
export const imageRef = ref_storage(storage, "files/image");






export function modelToPersistence(model){
    return {
        zones: model.zones
    }
}

export function LibraryToPersistence(model){
 
    return {
        library: model.testPersist
    }
}



 export function persistenceToModel(firebaseObj, model){
    
    if (firebaseObj != undefined){
        model.zones = firebaseObj.zones 
    }

}

export function persistedLibraryToModel(firebaseObj, model){
    
    if (firebaseObj != undefined){
         model.testPersist = firebaseObj.library 
    }

}



export function saveToFirebase(model){
    if (model.ready == true){
        set(ref(db, PATH+uid), modelToPersistence(model))
    }
}

export function saveLibraryToFirebase(model){
    if (model.ready == true){
        set(ref(db, PATH), LibraryToPersistence(model))
    }
}



export function readFromFirebase(model){
   // console.log("reading from firebase")
    model.ready = false
   return get(ref(db, PATH+uid))
              .then(function convertACB(snapshot){
                     // return promise
                    return persistenceToModel(snapshot.val(), model);
               }).then(function setModelReadyACB(){model.ready=true})      
  }

  export function readFLibraryromFirebase(model){
     model.ready = false
    return get(ref(db, PATH))
               .then(function convertACB(snapshot){
                     return persistedLibraryToModel(snapshot.val(), model);
                }).then(function setModelReadyACB(){model.ready=true})      
   }

  var uid = null


export function connectToFirebase(model, watch){


onAuthStateChanged(auth, loginOrOutACB);

function loginOrOutACB(id){
    if (id){
        model.user = id
   console.log(model.user)
        uid = model.user.uid 
        }else{  
        model.user = null
        uid = null
    }
   
    readFromFirebase(model);
    readFLibraryromFirebase(model)
    
    function effectACB(){
        saveToFirebase(model);
    }
    
    function checkACB(){
        return [ model.zones,]
    }
  



}}








 