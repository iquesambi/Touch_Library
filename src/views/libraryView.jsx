import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseModel";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export function LibraryView(props) {
    const [library, setLibrary] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLibraryData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "touches"));
                const fetchedLibrary = querySnapshot.docs.map((doc) => ({
                    id: doc.id, // Firestore document name (already formatted)
                    ...doc.data(),
                }));
                setLibrary(fetchedLibrary);
            } catch (error) {
                console.error("Error fetching data from Firestore: ", error);
            }
        };

        fetchLibraryData();
    }, []);

    const formatDate = (timestamp) => {
        const date = timestamp?.toDate();
        if (date) {
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            return `${day}/${month < 10 ? "0" : ""}${month}/${year}`;
        }
        return "";
    };

    const handlePlay = (e, sequence) => {
        e.stopPropagation();
        if (sequence && Array.isArray(sequence)) {
            props.sequenceSave(sequence);
        }
    };

    const handleDelete = async (e, itemId) => {
        e.stopPropagation();

        const confirmed = window.confirm("Are you sure you want to delete this file?");
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, "touches", itemId));
            setLibrary((prevLibrary) => prevLibrary.filter((item) => item.id !== itemId));
            console.log("Document deleted successfully.");
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const formatId = (name) => name.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="library-view">
            <div className="cards-container">
                {library.map((item) => {
                    const isAuthor = item.userName === props.userName;

                    return (
                        <div className={`card ${isAuthor ? "author-card" : ""}`} key={item.id} onClick={() => navigate(`/visualization/${item.id}`)}>
                            <div className="card-image"></div>
                            <div className="card-content">
                                <h6>{item.name}</h6>
                                <p>{item.description}</p>
                                <p className="author">Author: {item.userName}</p>
                                <p className="created-on">Created on {formatDate(item.createdAt)}</p>
                            </div>
                            <div className="card-buttons">
                                <button onClick={(e) => handlePlay(e, item.sequence)}>Play</button>
                                
                                {isAuthor && (
                                    <button className="delete-button" onClick={(e) => handleDelete(e, item.id)}>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
