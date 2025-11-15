import { useRef } from "react";
import styles from "./logoutModal.module.css";

export function LogoutModal({ isOpen, onClose, onConfirm }) {
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.logoutModal} ref={modalRef}>
        <p className={styles.logoutQuestion}>
          Are you sure you want to logout?
        </p>
        <div className={styles.modalButtons}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.logoutButton} onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

