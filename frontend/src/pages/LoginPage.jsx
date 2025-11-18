// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate("/chats");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* LEFT: form */}
        <div className="auth-left">
          <div className="auth-logo-row">
            <div className="auth-logo-bubble">
              <span>💬</span>
            </div>
            <span className="auth-logo-text">ChatVerse</span>
          </div>

          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Login to access your account</p>

          <form className="auth-form" onSubmit={handleSubmit}>
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch-text">
            Don’t have an account?{" "}
            <Link to="/register">
              <button type="button">Sign up</button>
            </Link>
          </p>

          <div className="auth-footer-tags">
            <span>Secure</span>
            <span>Fast</span>
            <span>Reliable</span>
          </div>
        </div>

        {/* RIGHT: illustration */}
        <div className="auth-right">
          <div className="auth-illustration-card">
            <div className="auth-cloud cloud-1" />
            <div className="auth-cloud cloud-2" />
            <div className="auth-people" />
          </div>
          <div className="auth-right-caption">
            <h2>Connect Anytime, Anywhere</h2>
            <p>
              Stay close to your friends and team with instant
              messaging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
