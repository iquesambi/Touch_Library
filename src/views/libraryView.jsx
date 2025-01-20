import React, { useState } from "react";
import "./style.css";
import { useNavigate } from 'react-router-dom';


export function LibraryView(props) {
    const navigate = useNavigate();
    const [filterTerm, setFilterTerm] = useState("");
    const [filterType, setFilterType] = useState("title");

  
    function handleInputChange(event) {
        setFilterTerm(event.target.value);
    }

   
    function handleFilterTypeChange(event) {
        setFilterType(event.target.value);
    }

 
    function clearFilter() {
        setFilterTerm("");
        setFilterType("title");
    }


    const filteredLibrary = props.library.filter(item => {
        if (filterType === "title") {
            return item.name.toLowerCase().includes(filterTerm.toLowerCase());
        } else if (filterType === "author") {
            return item.created.toLowerCase().includes(filterTerm.toLowerCase());
        }
        return true;
    });

    return (
        <div className="main">
     
            <div className="filter">
                <select value={filterType} onChange={handleFilterTypeChange}>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                </select>
                <input 
                    type="text" 
                    placeholder={`Filter by ${filterType}...`} 
                    value={filterTerm} 
                    onChange={handleInputChange}
                />
                <button onClick={clearFilter}>Clear Filter</button>
            </div>

            {filteredLibrary.map(CardsRender)}
        </div>
    );

    function CardsRender(x) {
        return (
            <div className="card" key={x.name} onClick={navigateACB} id={"qw3Gr"}>
                <div className="image" id={"qw3Gr"}></div>

                <div className="card_center" id={"qw3Gr"}>
                    <h6 id={"qw3Gr"}>{x.name}</h6>
                    <p id={"qw3Gr"}>{x.description}</p>
                    <p className="author_tag" id={"qw3Gr"}>created by {x.created}</p>
                </div>

                <button id={"qw3Gr"} className="card_button" onClick={playACB}>play</button>
            </div>
        );
    }

    function playACB(event) {
        props.selectArrayFromLibrary(event.target.id);
    }

    function navigateACB(evt){
       // console.log(evt.target.id)
       navigate('/visualization/');  

    }
}
