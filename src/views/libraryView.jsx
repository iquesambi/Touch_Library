import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../../firebaseModel";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { CircumplexChart } from "./circumplexChart";
import { t } from "../i18n";

export function LibraryView(props) {
    const [library, setLibrary] = useState([]);
    const [viewMode, setViewMode] = useState("cards"); // "cards" | "graph"
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLibraryData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "touches"));
                const fetchedLibrary = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        const data = doc.data();
                        const mediaUrls = await fetchFirstImage(doc.id);
                        return {
                            id: doc.id,
                            ...data,
                            imageUrl: mediaUrls, // Add the first image URL to the item
                        };
                    })
                );
                setLibrary(fetchedLibrary);
            } catch (error) {
                console.error("Error fetching data from Firestore: ", error);
            }
        };

        const fetchFirstImage = async (touchId) => {
            try {
                const folderRef = ref(storage, `touchMedia/${touchId}`);
                const result = await listAll(folderRef);
                if (result.items.length > 0) {
                    const firstItemRef = result.items[0];
                    return await getDownloadURL(firstItemRef);
                }
                return null; // No image found
            } catch (error) {
                console.error("Error fetching first image: ", error);
                return null;
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

        const confirmed = window.confirm(t("confirm_delete", props.language));
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

    const filteredLibrary = library.filter((item) =>
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const graphPoints = filteredLibrary.map((item) => ({
        id: item.id,
        name: item.name || t("unnamed_touch", props.language),
        description: item.description || t("no_description", props.language),
        x: item.data?.[0]?.x ?? 0,
        y: item.data?.[0]?.y ?? 0,
    }));

    return (
        <div className="library-view">
            <div className="filter">
                <input
                    type="text"
                    placeholder={t("search_by_name", props.language)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div>
                    <button
                        onClick={() => setViewMode("cards")}
                        disabled={viewMode === "cards"}
                    >
                        {t("view_cards", props.language)}
                    </button>
                    <button
                        onClick={() => setViewMode("graph")}
                        disabled={viewMode === "graph"}
                    >
                        {t("view_graph", props.language)}
                    </button>
                </div>
            </div>

            {viewMode === "graph" ? (
                <CircumplexChart
                    points={graphPoints}
                    onPointClick={(point) => navigate(`/visualization/${point.id}`)}
                    language={props.language}
                />
            ) : (
            <div className="cards-container">
                {filteredLibrary.map((item) => {
                    const isAuthor = item.userName === props.userName;
                    const cardImageStyle = {
                        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                        backgroundColor: item.imageUrl ? 'transparent' : 'black',
                        backgroundPosition: 'center', // Center the image
                        backgroundRepeat: 'no-repeat', // Prevent image repetition
                        backgroundSize: 'cover', // Scale down the image to fit within the container
                    };

                    return (
                        <div className={`card ${isAuthor ? "author-card" : ""}`} key={item.id} onClick={() => navigate(`/visualization/${item.id}`)}>
                            <div className="card-image" style={cardImageStyle}></div>
                            <div className="card-content">
                                <h6>{item.name}</h6>
                                <p>{item.description}</p>
                                <p className="author">{t("author_prefix", props.language)} {item.userName}</p>
                                <p className="created-on">{t("created_on_prefix", props.language)} {formatDate(item.createdAt)}</p>
                            </div>
                            <div className="card-buttons">
                                <button onClick={(e) => handlePlay(e, item.sequence)}>{t("play", props.language)}</button>

                                {isAuthor && (
                                    <button className="delete-button" onClick={(e) => handleDelete(e, item.id)}>
                                        {t("delete", props.language)}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
        </div>
    );
}