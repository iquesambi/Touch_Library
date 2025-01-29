import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseModel"; // Ensure to import Firestore db
import { collection, getDocs } from "firebase/firestore"; // Firestore functions

export function LibraryView(props) {
    const [library, setLibrary] = useState([]); // State to hold the fetched library items
    const navigate = useNavigate();

    // Fetch data from Firestore on component mount
    useEffect(() => {
        const fetchLibraryData = async () => {
            try {
                // Get all documents from the "touches" collection
                const querySnapshot = await getDocs(collection(db, "touches"));
                
                // Map the documents to an array of data
                const fetchedLibrary = querySnapshot.docs.map((doc) => ({
                    id: doc.id, // Get the document ID (could be useful later)
                    ...doc.data(), // Get the document data
                }));

                // Update the state with the fetched data
                setLibrary(fetchedLibrary);
            } catch (error) {
                console.error("Error fetching data from Firestore: ", error);
            }
        };

        fetchLibraryData();
    }, []); // Empty dependency array to fetch once when the component mounts

    // Function to format the Firestore Timestamp to a readable date format (Day, Month, Year)
    const formatDate = (timestamp) => {
        const date = timestamp?.toDate(); // Convert Firestore Timestamp to JavaScript Date
        if (date) {
            const day = date.getDate(); // Get the day
            const month = date.getMonth() + 1; // Get the month (0-based, so add 1)
            const year = date.getFullYear(); // Get the year
            return `${day}/${month < 10 ? '0' : ''}${month}/${year}`; // Format as DD/MM/YYYY
        }
        return '';
    };

    const handlePlay = (e, sequence) => {
        e.stopPropagation(); // Prevent the event from bubbling up to the card
        if (sequence && Array.isArray(sequence)) {
            props.sequenceSave(sequence);
            // Pass the sequence to props for playback (assuming props.playSequence handles it)
            // props.playSequence(sequence);
        }
    };

    return (
        <div className="library-view">
            <div className="cards-container">
                {library.map((item) => {
                    // Check if the author matches the userName passed through props
                    const isAuthor = item.userName === props.userName;

                    return (
                        <div
                            className={`card ${isAuthor ? 'author-card' : ''}`} // Add class for border if it's the author's card
                            key={item.id}
                            onClick={() => navigate('/visualization')}
                        >
                            <div className="card-image"></div>
                            <div className="card-content">
                                <h6>{item.name}</h6>
                                <p>{item.description}</p>
                                <p className="author">Author: {item.userName}</p> {/* Show the author's name */}
                                <p className="created-on">Created on {formatDate(item.createdAt)}</p>
                            </div>
                            <button onClick={(e) => handlePlay(e, item.sequence)}>Play</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
