import "./style.css"

export function NavView(props){
    return(
        <nav className="nav-bar">
        <button className="nav-left">Menu</button>
        <button className="nav-center" onClick={clickACB}>Touch Library</button>
        <button className="nav-right">User Name</button>
  
    </nav>
    );

    function clickACB(){
            window.location.hash="#/"
    }
}