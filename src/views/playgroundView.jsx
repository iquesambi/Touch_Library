import "./style.css"

export function PlaygroundView(props){
    return(
      <div className="main">
      
  <button>Inflate</button>
  <button >Deflate</button>
  <button >Fully deflate</button>
  <input type="range" min="0" max="127"  ></input>
  
    </div>
    
    );
}