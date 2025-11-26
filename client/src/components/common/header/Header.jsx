import { useState, useRef, useEffect } from "react";
import logo from "../../../images/logo.svg";
import styles from "./header.module.css";
import { Link, useNavigate } from "react-router";

export function Header(props) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCitizen = props.user?.role === "user";
  const citizenProfile = props.citizenProfile;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = () => {
    if (isCitizen && citizenProfile) {
      const first = citizenProfile.first_name?.[0] || "";
      const last = citizenProfile.last_name?.[0] || "";
      if (first || last) return (first + last).toUpperCase();
    }
    return props.user?.username?.[0]?.toUpperCase() || "?";
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLogoContainer}>
        <img src={logo} alt="Logo" className={styles.headerLogo} />

        <Link to={"/"} className={styles.headerBrand}>
          Participium
        </Link>
      </div>
      {props.user && (
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.headerGreeting}>
              Hello,{" "}
              {props.user.username || props.user.name || props.user.email}
            </div>

            {/* Avatar with dropdown menu */}
            <div className={styles.avatarContainer} ref={menuRef}>
              <div 
                className={styles.headerAvatar}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Menu"
              >
                {isCitizen && citizenProfile?.profile_photo_url ? (
                  <img 
                    src={citizenProfile.profile_photo_url} 
                    alt="Avatar" 
                    className={styles.headerAvatarImg}
                  />
                ) : (
                  <span className={styles.headerAvatarInitials}>
                    {getInitials()}
                  </span>
                )}
              </div>

              {isMenuOpen && (
                <div className={styles.avatarDropdown}>
                  {isCitizen && (
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                    >
                      Edit profile
                    </button>
                  )}
                  <button 
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    onClick={() => {
                      props.onLogoutClick();
                      setIsMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
