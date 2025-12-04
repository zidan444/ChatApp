// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProfile, updateProfile, logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, token } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    avatar:"",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null); // local preview

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    } else {
      setForm((f) => ({
        ...f,
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || "",
      }));
      setAvatarPreview(user.avatar || null);
      // if backend has avatar URL, you can use user.avatar here
    
    }
  }, [token, user, dispatch, navigate]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || "",
      }));
    setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setAvatarPreview(base64);
      setForm((f) => ({ ...f, avatar: base64 }));
    };
    reader.readAsDataURL(file);

    // later you can append this `file` to FormData
    // and send to backend to actually save avatar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");

    const payload = {
      name: form.name,
      email: form.email,
      avatar: form.avatar,
    };

    if (form.currentPassword && form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    // if you later support avatar, this will change to FormData
    const result = await dispatch(updateProfile(payload));

    if (updateProfile.fulfilled.match(result)) {
      setSuccessMsg("Profile updated successfully");
      setForm((f) => ({
        ...f,
        currentPassword: "",
        newPassword: "",
      }));
    }
  };

  const handleGoBack = () => {
    navigate("/chats");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // helper to show initials when no avatar
  const initials = (form.name || user?.name || "U")
    .trim()
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="profile-root">
      <div className="profile-card">
        {/* Top bar */}
        <div className="profile-top-bar">
          <button className="profile-back-btn" onClick={handleGoBack}>
            ← Back
          </button>
          <button className="profile-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Avatar + header */}
        <div className="profile-header">
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrapper">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {initials}
                </div>
              )}
              <button
                type="button"
                className="profile-avatar-edit-btn"
                onClick={() => document.getElementById("avatar-input").click()}
              >
                Change
              </button>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <div className="profile-tag">Account</div>
              <h1 className="profile-title">Profile settings</h1>
              <p className="profile-subtitle">
                Update your name, email and password. Your changes apply to the whole chat app.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-field">
            <label className="profile-label">Name</label>
            <input
              type="text"
              name="name"
              className="profile-input"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">Email</label>
            <input
              type="email"
              name="email"
              className="profile-input"
              placeholder="Your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="profile-password-section">
            <div className="profile-password-heading">
              Change password (optional)
            </div>

            <div className="profile-password-inputs">
              <input
                type="password"
                name="currentPassword"
                className="profile-input"
                placeholder="Current password"
                value={form.currentPassword}
                onChange={handleChange}
              />
              <input
                type="password"
                name="newPassword"
                className="profile-input"
                placeholder="New password"
                value={form.newPassword}
                onChange={handleChange}
              />
            </div>

            <div className="profile-password-hint">
              Leave these fields empty if you do not want to change your password.
            </div>
          </div>

          {error && <p className="profile-error-text">{error}</p>}
          {successMsg && (
            <p className="profile-success-text">{successMsg}</p>
          )}

          <button
            type="submit"
            className="profile-save-btn"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
