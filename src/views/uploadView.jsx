import "./style.css";
import { storage } from "../../firebaseModel";
import { uploadBytes, getDownloadURL, ref as ref_storage } from "firebase/storage";
import { useState } from "react";

export function UploadView(props) {
    const [selectedFiles, setSelectedFiles] = useState([]); // Stores the files for upload
    var name = undefined

    return (
        <div className="main">
            <div className="holder">
                <input type="text" onChange={nameInputACB} placeholder="touch name"></input>
                <button onClick={saveACB} disabled={!selectedFiles.length || !props.touch.name}>save</button>
                <div className="chart"></div> {/* Chart rendering will happen here */}
                
                <div className="bottom_form">
                   {/* <label>Zones</label>
                    <button onClick={decreaseACB}>-</button>
                    {props.zones}
                    <button onClick={increaseACB}>+</button>
                    <label htmlFor="tube">group number</label>
                    <select id="tube" onChange={tubeInputACB}>
                        <option disabled defaultValue>group number</option>
                        <option value="group_1">1</option>
                        <option value="group_2">2</option>
                        <option value="group_3">3</option>
                        <option value="group_4">4</option>
                    </select>
                    */}
                    <label>Author</label>
                    <input className="author" onChange={authorInputACB}></input>
                    <textarea maxLength="200" placeholder="Add a short description here..." rows="5" cols="33" onChange={descriptionInputACB}></textarea>
                    <input type="file" accept="image/*,video/*" onChange={previewImagesACB} multiple></input>
                </div>
                
                 
                <div id="previewContainer">
                    {selectedFiles.map((file, index) => (
                        <div key={index} style={{ display: 'inline-block', position: 'relative', margin: '10px' }}>
                            <img src={file.preview} alt={`Preview ${index}`} style={{ maxWidth: '200px' }} />
                            <button onClick={() => deleteImageACB(index)} style={{
                                position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', cursor: 'pointer'
                            }}>Delete</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    function previewImagesACB(evt) {
        const files = Array.from(evt.target.files);
        const previews = files.map(file => {
            file.preview = URL.createObjectURL(file);
            return file;
        });
        setSelectedFiles(previews);
    }

    function deleteImageACB(index) {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
    }

    function saveACB() {
        let group = "group_1";
        let subpath = name;
        
        selectedFiles.forEach((file) => {
            const path = file.name;
            const imageRef = ref_storage(storage, `${group}/${name}/${path}`);

            uploadBytes(imageRef, file).then((snapshot) => {
                console.log('Uploaded a blob or file!');
                
                getDownloadURL(imageRef)
                    .then((url) => {
                        console.log('Image URL:', url);
                        // Optionally handle the URL or display the uploaded image
                    })
                    .catch((error) => {
                        console.error('Error getting download URL:', error);
                    });
            }).catch((error) => {
                console.error('Error uploading file:', error);
            });
        });

        // Clear previews after upload if needed
        setSelectedFiles([]);
    }

    function tubeInputACB(evt) {
        props.tube(evt.target.value);
    }

    function decreaseACB() {
        props.decrease();
    }

    function increaseACB() {
        props.increase();
    }
    
    function authorInputACB(evt) {
        props.author(evt.target.value);
    }

    function nameInputACB(evt) {
        props.name(evt.target.value);
        name = evt.target.value
    }

    function descriptionInputACB(evt) {
        props.description(evt.target.value);
    }
}
