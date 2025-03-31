import { initializeApp } from "firebase/app";
import { getDatabase, set, ref, get, onValue, off } from "firebase/database";
import { firebaseConfig} from "./firebaseConfig";
import { signInWithPopup, getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCredential} from "firebase/auth";

import { model } from "./model";


import {getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion} from "firebase/firestore";



const app= initializeApp(firebaseConfig);
export const db= getFirestore(app);


import { getStorage } from "firebase/storage";
import { ref as ref_storage } from "firebase/storage";



export const auth = getAuth(app);


export const provider = new GoogleAuthProvider();



const PATH="touchLibrary/";

// Create a root reference
export const storage = getStorage();

// Create a reference to 'mountains.jpg'
const group = "group1"
export const imageRef = ref_storage(storage, "files/image");

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


  export function connectToFirebase(model) {
      onAuthStateChanged(auth, async (user) => {
          console.log("State changed");
          if (user) {
              model.user = user;
              model.changeUser();
  
              const userRef = doc(db, "users", user.displayName);
              const userSnapshot = await getDoc(userRef);
  
              if (!userSnapshot.exists()) {
                  // If user does not exist, ask for additional data
                  await promptForUserConsent(user);
              } else {
                  // Update last login time
                  await updateDoc(userRef, {
                      lastLogin: new Date().toISOString(),
                  });
              }
  
              // Save display name in "user" document
              await saveDisplayName(user.displayName);
          } else {
              model.user = null;
          }
      });
  }
  
  export function loginFirebase() {
      signInWithPopup(auth, provider)
          .then(() => {
              console.log("User signed in");
          })
          .catch((error) => {
              console.error("Error during sign-in: ", error);
          });
  }
  
  async function promptForUserConsent(user) {
      const agreesToResearch = window.confirm("Do you agree to have your data collected for research?");
      const agreesToContact = window.confirm("Do you agree to be contacted for further questions?");
  
      const userRef = doc(db, "users", user.displayName);
  
      await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          agreesToResearch,
          agreesToContact,
      });
  }

  async function saveDisplayName(displayName) {
      const userListRef = doc(db, "users", "users");
  
      await setDoc(userListRef, {
          displayNames: arrayUnion(displayName),
      }, { merge: true });     
  }
  