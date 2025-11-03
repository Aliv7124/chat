/*
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const LoginSignup = () => {
  const { login, signup } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(name, email, password);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background:
          "linear-gradient(135deg, #6e8efb, #a777e3)",
      }}
    >
      <div
        className="card shadow-lg border-0 rounded-4 p-4 text-dark"
        style={{
          width: "25rem",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          transition: "transform 0.3s ease",
        }}
      >
        <div className="text-center mb-4">
          <h3 className="fw-bold text-primary">
            {isLogin ? "Welcome Back!" : "Create an Account"}
          </h3>
          <p className="text-muted small">
            {isLogin
              ? "Please login to continue"
              : "Join us and start chatting instantly"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Full Name</label>
              <input
                type="text"
                className="form-control form-control-lg rounded-3"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control form-control-lg rounded-3"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control form-control-lg rounded-3"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold rounded-3"
            style={{
              background:
                "linear-gradient(135deg, #6e8efb, #a777e3)",
              border: "none",
            }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link text-decoration-none fw-semibold"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don’t have an account? Sign Up"
                : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;
*/

import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const LoginSignup = () => {
  const { login, signup } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (isLogin) {
    await login(email, password);
  } else {
    await signup(name, email, password, avatar);
  }
};


  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #6e8efb, #a777e3)",
      }}
    >
      <div
        className="card shadow-lg border-0 rounded-4 p-4 text-dark"
        style={{
          width: "25rem",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          transition: "transform 0.3s ease",
        }}
      >
        <div className="text-center mb-4">
          <h3 className="fw-bold text-primary">
            {isLogin ? "Welcome Back!" : "Create an Account"}
          </h3>
          <p className="text-muted small">
            {isLogin
              ? "Please login to continue"
              : "Join us and start chatting instantly"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="mb-3 text-center">
                <label
                  htmlFor="avatar"
                  className="form-label fw-semibold d-block"
                >
                  Profile Picture (Optional)
                </label>
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="rounded-circle mb-2"
                    width="80"
                    height="80"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light d-flex justify-content-center align-items-center mb-2"
                    style={{
                      width: "80px",
                      height: "80px",
                      border: "2px dashed #ccc",
                      cursor: "pointer",
                    }}
                    onClick={() => document.getElementById("avatar").click()}
                  >
                    <span className="text-muted small">+</span>
                  </div>
                )}
                <input
                  type="file"
                  id="avatar"
                  className="form-control form-control-sm mt-2"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-3"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control form-control-lg rounded-3"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control form-control-lg rounded-3"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold rounded-3"
            style={{
              background: "linear-gradient(135deg, #6e8efb, #a777e3)",
              border: "none",
            }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link text-decoration-none fw-semibold"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don’t have an account? Sign Up"
                : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;
