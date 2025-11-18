// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/authSlice";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) {
      navigate("/chats");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-logo-row">
            <div className="auth-logo-bubble">
              <span>💬</span>
            </div>
            <span className="auth-logo-text">ChatVerse</span>
          </div>

          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join and start chatting in seconds
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="jesse@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? "Creating..." : "Sign up"}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account?{" "}
            <Link to="/login">
              <button type="button">Sign in</button>
            </Link>
          </p>

          <div className="auth-footer-tags">
            <span>Secure</span>
            <span>Fast</span>
            <span>Reliable</span>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-illustration-card">
            <div className="auth-cloud cloud-1" />
            <div className="auth-cloud cloud-2" />
            <div className="auth-people" />
          </div>
          <div className="auth-right-caption">
            <h2>Connect Anytime, Anywhere</h2>
            <p>
              Your conversations sync instantly across all your
              devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
