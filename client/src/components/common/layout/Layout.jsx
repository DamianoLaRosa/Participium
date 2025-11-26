import { useState } from "react";
import { Outlet } from "react-router";
import { Header } from "../header/Header";
import { Footer } from "../footer/Footer";
import { LogoutModal } from "../logoutModal/LogoutModal";
import styles from "./layout.module.css";

export function DefaultLayout(props) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    if (props.handleLogout) {
      await props.handleLogout();
    }
    setShowLogoutModal(false);
  };

  return (
    <div className={styles.pageLayout}>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
      <Header
        user={props.user}
        citizenProfile={props.citizenProfile}
        onLogoutClick={() => setShowLogoutModal(true)}
      />

      <div className={styles.contentArea}>
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}
