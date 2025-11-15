import logo from "../../../images/logo.svg";
import styles from "./header.module.css";
import { Link } from "react-router";

export function Header(props) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLogoContainer}>
        <img src={logo} alt="Logo" className={styles.headerLogo} />

        <span className={styles.headerBrand}>
          <Link to={"/"} className="navbar-brand">
            Participium
          </Link>
        </span>
      </div>
      {props.user && (
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.headerGreeting}>
              Hello,{" "}
              {props.user.username || props.user.name || props.user.email}
            </div>
            <button
              className={styles.logoutIconButton}
              onClick={props.onLogoutClick}
              aria-label="Logout"
            >
              <svg
                className={styles.logoutIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M16 17L21 12L16 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
