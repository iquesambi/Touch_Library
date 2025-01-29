import React, { useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";

export function LibraryView(props) {
    const navigate = useNavigate();
  


    return (
        <div div className="library-view">
  
            <div className="cards-container">
                {props.library.map((item) => (
                    <div className="card" key={item.name} onClick={() => navigate('/visualization')}>
                        <div className="card-image"></div>
                        <div className="card-content">
                            <h6>{item.name}</h6>
                            <p>{item.description}</p>
                            <p className="author">Created by {item.created}</p>
                        </div>
                        <button onClick={() => props.selectArrayFromLibrary(item.name)}>Play</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
