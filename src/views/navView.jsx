import "./style.css";

export function NavView(props) {
    return (
        <nav className="tl-nav">
            <button className="tl-nav__burger" onClick={toggleACB} aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <button className="tl-nav__wordmark" onClick={clickACB}>
                Touch Library
            </button>

            {/* User identity lives at the bottom of the side menu now; this
                spacer keeps the wordmark optically centred. */}
            <div className="tl-nav__spacer" aria-hidden="true"></div>
        </nav>
    );

    function clickACB() {
        window.location.hash = "#/";
    }

    function toggleACB() {
        props.toogle();
    }
}
