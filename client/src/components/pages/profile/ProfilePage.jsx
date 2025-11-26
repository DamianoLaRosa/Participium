import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import API from "../../../API/API.js";
import styles from "./profilePage.module.css";

export default function ProfilePage({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    telegram_username: "",
    email_notifications: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await API.getCitizenProfile();
      setProfile(data);
      setFormData({
        username: data.username || "",
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        telegram_username: data.telegram_username || "",
        email_notifications: data.email_notifications || false,
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await API.updateCitizenProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        telegram_username: formData.telegram_username,
        email_notifications: formData.email_notifications,
      });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <h1 className={styles.title}>My Profile</h1>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              className={styles.input}
              disabled
            />
            <span className={styles.hint}>Username cannot be changed</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className={styles.input}
              disabled
            />
            <span className={styles.hint}>Email cannot be changed</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={styles.input}
              disabled={!isEditing}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={styles.input}
              disabled={!isEditing}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telegram Username</label>
            <input
              type="text"
              name="telegram_username"
              value={formData.telegram_username}
              onChange={handleChange}
              className={styles.input}
              placeholder="@username"
              disabled={!isEditing}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="email_notifications"
                checked={formData.email_notifications}
                onChange={handleChange}
                className={styles.checkbox}
                disabled={!isEditing}
              />
              <span>Receive email notifications</span>
            </label>
          </div>

          <div className={styles.actions}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
