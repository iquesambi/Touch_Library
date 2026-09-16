import "./style.css";
import { model } from "../../model";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseModel";
import { t } from "../i18n";

// "Shape editor" is gone from here — it became the "Draw shape" mode inside
// Create an entry. The route itself still resolves for anyone holding a link.
const LINKS = [
    { hash: "#/", labelKey: "nav_library", match: (path) => path === "" || path === "/" },
    { hash: "#/upload", labelKey: "nav_create_entry", match: (path) => path.startsWith("/upload") },
    { hash: "#/test", labelKey: "nav_test", match: (path) => path.startsWith("/test") },
];

function initialsOf(name) {
    if (!name) return "";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

export function SideMenuView(props) {
    // Read straight off the hash rather than useLocation: this view renders
    // outside the router's <Routes>, so it has no router context.
    const currentPath = (window.location.hash || "").replace(/^#/, "").split("?")[0];

    return (
        <>
            <div className="tl-menu-backdrop" onClick={closesideACB}></div>

            <nav className="tl-menu tl-menu--open">
                <div className="tl-menu__header">
                    <button className="tl-menu__close" onClick={closesideACB} aria-label={t("close", props.language)}>
                        ×
                    </button>
                </div>

                <div className="tl-menu__links">
                    {LINKS.map((link) => (
                        <a
                            key={link.hash}
                            href={link.hash}
                            className={`tl-menu__link${link.match(currentPath) ? " is-current" : ""}`}
                            onClick={closesideACB}
                        >
                            {t(link.labelKey, props.language)}
                        </a>
                    ))}
                </div>

                <div className="tl-menu__footer">
                    {/* Identity sits where the old Login button did. Signed in,
                        it's the avatar chip with a "Log out" tooltip on hover;
                        signed out, the same slot is the way back in. */}
                    {props.userName ? (
                        <button className="tl-menu__identity" onClick={loginACB}>
                            {props.userImage ? (
                                <img src={props.userImage} alt="" className="tl-menu__avatar" />
                            ) : (
                                <span className="tl-menu__avatar">{initialsOf(props.userName)}</span>
                            )}
                            <span className="tl-menu__identity-name">{props.userName}</span>
                            <span className="tl-menu__tooltip">{t("logout", props.language)}</span>
                        </button>
                    ) : (
                        <button onClick={loginACB} className="tl-menu__btn tl-menu__btn--solid">
                            {t("login", props.language)}
                        </button>
                    )}

                    <button disabled={props.midiAuth} onClick={connectACB} className="tl-menu__btn">
                        {t("connect_kit", props.language)}
                    </button>

                    {props.midiAuth && (
                        <div className="tl-menu__midi">
                            <span
                                className={`tl-menu__midi-dot${props.midiConnected ? "" : " tl-menu__midi-dot--off"}`}
                            ></span>
                            {props.midiConnected
                                ? props.midiInputName
                                : `${props.midiInputName} (disconnected)`}
                        </div>
                    )}

                    <label className="tl-menu__lang">
                        {t("language_label", props.language)}:
                        <select
                            value={props.language}
                            onChange={(e) => props.onLanguageChange(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="pt">Português</option>
                        </select>
                    </label>
                </div>
            </nav>
        </>
    );

    function connectACB() {
        props.connect();
    }

    function loginACB() {
        if (!model.user) {
            props.login();
        } else {
            signOut(auth);
        }
    }

    function closesideACB() {
        props.close();
    }
}
