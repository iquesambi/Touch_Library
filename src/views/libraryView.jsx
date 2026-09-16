import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../../firebaseModel";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { CircumplexPlot } from "./circumplexPlot";
import { t } from "../i18n";

// Ribbed placeholder textures stand in for a touch's photo until one exists
// in Storage. Picked by index so a given card keeps the same texture.
const TEXTURES = ["tl-tex-0", "tl-tex-1", "tl-tex-2"];

// How much is actually known about a touch. Each signal counts once, so the
// ordering is "amount of information" rather than a weighting of one kind of
// data over another.
function completenessOf(item) {
    const has = [
        Array.isArray(item.pressure) && item.pressure.length > 0,   // internal pressure
        Array.isArray(item.sequence) && item.sequence.length > 0,   // actions
        Boolean((item.name || "").trim()),
        Boolean((item.description || "").trim()),
        Boolean(item.imageUrl),                                     // at least one photo
        Number.isFinite(item.data?.[0]?.x) && Number.isFinite(item.data?.[0]?.y), // circumplex
    ];
    return has.filter(Boolean).length;
}

function createdMs(item) {
    const date = item.createdAt?.toDate?.();
    return date ? date.getTime() : 0;
}

export function LibraryView(props) {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
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
            } finally {
                // Until this flips, the grid must not claim the library is
                // empty — it just hasn't loaded yet.
                setLoading(false);
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

    const filteredLibrary = library
        .filter((item) => (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
        .map((item) => ({ ...item, completeness: completenessOf(item) }))
        // Richest entries first: a touch with pressure, actions, name,
        // description, a photo and a mood coordinate outranks one that only
        // has a name and actions. Ties keep the newest first.
        .sort((a, b) => b.completeness - a.completeness || createdMs(b) - createdMs(a))
        .map((item, index) => ({ ...item, texClass: TEXTURES[index % TEXTURES.length] }));

    const graphPoints = filteredLibrary.map((item) => ({
        id: item.id,
        name: item.name || t("unnamed_touch", props.language),
        description: item.description || t("no_description", props.language),
        x: item.data?.[0]?.x ?? 0,
        y: item.data?.[0]?.y ?? 0,
        texClass: item.texClass,
        imageUrl: item.imageUrl,
    }));

    return (
        <div className="tl-page">
            <div className="tl-filterbar">
                <input
                    type="text"
                    className="tl-input tl-filterbar__search"
                    placeholder={t("search_by_name", props.language)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="tl-segmented">
                    <button
                        className={`tl-segmented__btn${viewMode === "cards" ? " is-active" : ""}`}
                        onClick={() => setViewMode("cards")}
                    >
                        {t("view_cards", props.language)}
                    </button>
                    <button
                        className={`tl-segmented__btn${viewMode === "graph" ? " is-active" : ""}`}
                        onClick={() => setViewMode("graph")}
                    >
                        {t("view_graph", props.language)}
                    </button>
                </div>
            </div>

            {loading && viewMode === "graph" ? (
                <div className="tl-loading" role="status" aria-label={t("loading_label", props.language)}>
                    <div className="tl-spinner"></div>
                </div>
            ) : viewMode === "graph" ? (
                <CircumplexPlot
                    points={graphPoints}
                    onPointClick={(point) => navigate(`/visualization/${point.id}`)}
                    language={props.language}
                />
            ) : loading ? (
                <div className="tl-loading" role="status" aria-label={t("loading_label", props.language)}>
                    <div className="tl-spinner"></div>
                </div>
            ) : filteredLibrary.length === 0 ? (
                <div className="tl-empty">{t("no_touches_found", props.language)}</div>
            ) : (
                <div className="tl-cards">
                    {filteredLibrary.map((item) => {
                        const isAuthor = item.userName === props.userName;

                        return (
                            <div
                                className="tl-card"
                                key={item.id}
                                onClick={() => navigate(`/visualization/${item.id}`)}
                            >
                                <div
                                    className={`tl-card__image ${item.imageUrl ? "" : item.texClass}`}
                                    style={
                                        item.imageUrl
                                            ? { backgroundImage: `url(${item.imageUrl})` }
                                            : undefined
                                    }
                                >
                                    <h3 className="tl-card__title">{item.name}</h3>
                                </div>

                                <div className="tl-card__body">
                                    <p className="tl-card__desc">{item.description}</p>
                                    <p className="tl-card__meta tl-card__meta--first">
                                        {t("author_prefix", props.language)} {item.userName}
                                    </p>
                                    <p className="tl-card__meta">
                                        {t("created_on_prefix", props.language)} {formatDate(item.createdAt)}
                                    </p>

                                    <div className="tl-card__actions">
                                        <button
                                            className="tl-card__play"
                                            onClick={(e) => handlePlay(e, item.sequence)}
                                        >
                                            {t("play", props.language)}
                                        </button>

                                        {isAuthor && (
                                            <button
                                                className="tl-card__delete"
                                                onClick={(e) => handleDelete(e, item.id)}
                                            >
                                                {t("delete", props.language)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
