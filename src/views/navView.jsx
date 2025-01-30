import "./style.css";

export function NavView(props) {
    return (
        <nav className="nav-bar">
            {/* Hamburger menu button */}
            <button className="nav-left" onClick={toggleACB}>
                <span className="hamburger-icon">☰</span>
            </button>

            {/* Clickable text for the middle button */}
            <button className="nav-center" onClick={clickACB}>
               <h2> Touch Library</h2>
            </button>

            {/* User profile on the right */}
            <div className="nav-right">
                {props.userImage ? (
                    <div className="user-profile" onClick={props.onUserClick}>
                        <img
                            src={props.userImage}
                            alt="User"
                            className="user-image"
                        />
                        <span className="user-name">{props.userName}</span>
                    </div>
                ) : (
                    <div className="login-container">
                        <button className="login-button" onClick={props.onLoginClick}>
                            Login
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );

    function clickACB() {
        window.location.hash = "#/";
    }

    function toggleACB() {
        props.toogle();
    }
}
