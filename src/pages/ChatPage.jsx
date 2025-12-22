/*
import React, { useContext, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../ThemeContext"; // ✅ use global ThemeContext
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import API from "../api";

const socket = io("https://chat-b-7y5f.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});
const ChatPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useTheme(); // ✅ global theme
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

 // ✅ Real-time online + last seen emitter (instant update)
useEffect(() => {
  if (!socket || !user?._id) return;

  const goOnline = () => {
    socket.emit("userOnline", user._id);
    console.log("🟢 You are now online");
  };

  // emit immediately
  goOnline();

  // re-emit if socket reconnects
  socket.on("connect", goOnline);

  // clean up listener
  return () => socket.off("connect", goOnline);
}, [socket, user?._id]);

  const themeStyles = {
    light: {
      bgColor: "#f8f9fa",
      textColor: "#212529",
      sidebarBg: "#ffffff",
      chatBg: "linear-gradient(180deg, #eef3ff 0%, #ffffff 100%)",
      navBg: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
      accent: "#ffffff",
    },
    dark: {
      bgColor: "#121212",
      textColor: "#e4e4e4",
      sidebarBg: "#1e1e1e",
      chatBg: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)",
      navBg: "linear-gradient(90deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      accent: "#ffcc00",
    },
  };

  const currentTheme = darkMode ? themeStyles.dark : themeStyles.light;

  return (
    <div
      style={{
        backgroundColor: currentTheme.bgColor,
        color: currentTheme.textColor,
        height: "100vh",
        transition: "all 0.3s ease",
      }}
    >
      
      <nav
        className="navbar navbar-expand-lg shadow-sm"
        style={{
          background: currentTheme.navBg,
          color: currentTheme.textColor,
        }}
      >
        <div className="container-fluid">
          <span
            className="navbar-brand fw-semibold d-flex align-items-center"
            style={{ color: currentTheme.accent }}
          >
            <i className="bi bi-chat-dots-fill me-2"></i> ChatConnect
          </span>

          <div className="ms-auto d-flex align-items-center">
          
            <button
              className="btn btn-outline-light rounded-circle me-3"
              onClick={toggleTheme}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                borderColor: currentTheme.accent,
                color: currentTheme.accent,
              }}
            >
              {darkMode ? (
                <i className="bi bi-sun-fill"></i>
              ) : (
                <i className="bi bi-moon-stars-fill"></i>
              )}
            </button>

           
            <span className="me-3 fw-medium d-flex align-items-center text-white">
              {user?.avatar ? (
                <img
                  src={
                   user.avatar.startsWith("http")
  ? user.avatar
  : `https://chat-b-7y5f.onrender.com${
      user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`
    }`

                  }
                  alt="avatar"
                  className="rounded-circle me-2"
                  style={{
                    width: "35px",
                    height: "35px",
                    objectFit: "cover",
                    border: `2px solid ${currentTheme.accent}`,
                  }}
                />
              ) : (
                <i
                  className="bi bi-person-circle me-2"
                  style={{ fontSize: "1.8rem", color: currentTheme.accent }}
                ></i>
              )}
              {user?.name || "Guest"}
            </span>

           
            <button
              className="btn btn-sm rounded-pill px-3"
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{
                background: "transparent",
                color: currentTheme.accent,
                border: `1px solid ${currentTheme.accent}`,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      
      <div className="container-fluid p-0">
        <div className="row g-0" style={{ height: "calc(100vh - 56px)" }}>
          <div
            className="col-md-3 border-end"
            style={{
              background: currentTheme.sidebarBg,
              color: currentTheme.textColor,
              borderRight: `1px solid ${
                darkMode ? "#333" : "#dee2e6"
              }`,
              overflowY: "auto",
              transition: "all 0.3s ease",
            }}
          >
            <Sidebar setSelectedUser={setSelectedUser} socket={socket} />
          </div>

          <div
            className="col-md-9 d-flex flex-column"
            style={{
              background: currentTheme.chatBg,
              color: currentTheme.textColor,
              transition: "all 0.3s ease",
            }}
          >
            <ChatWindow user={user} selectedUser={selectedUser} socket={socket} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
*/

import React, { useContext, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import Call from "../Call";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../ThemeContext";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const SOCKET_URL = "https://chat-b-7y5f.onrender.com";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: true,
});

const ChatPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useTheme();
  const [selectedUser, setSelectedUser] = useState(null);
  const [callOpen, setCallOpen] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // ---------------- Online status ----------------
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("userOnline", user._id);

    socket.on("connect", () => {
      socket.emit("userOnline", user._id);
    });

    window.addEventListener("beforeunload", () => {
      socket.emit("userOffline", user._id);
    });

    return () => {
      socket.off("connect");
      socket.emit("userOffline", user._id);
    };
  }, [user?._id]);

  // ---------------- Incoming call ----------------
  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", ({ from, offer }) => {
      setIncomingCallInfo({ from, offer });
      setCallOpen(true); // show call modal automatically
      setSelectedUser(from);
    });

    return () => socket.off("incomingCall");
  }, []);

  const handleCallUser = (userToCall) => {
    setSelectedUser(userToCall);
    setCallOpen(true);
  };

  const theme = {
    light: {
      bg: "#f8f9fa",
      text: "#212529",
      sidebar: "#ffffff",
      chat: "linear-gradient(180deg, #eef3ff 0%, #ffffff 100%)",
      nav: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
      accent: "#ffffff",
    },
    dark: {
      bg: "#121212",
      text: "#e4e4e4",
      sidebar: "#1e1e1e",
      chat: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)",
      nav: "linear-gradient(90deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      accent: "#ffcc00",
    },
  };

  const current = darkMode ? theme.dark : theme.light;

  return (
    <div style={{ background: current.bg, color: current.text, height: "100vh" }}>
      <nav
        className="navbar navbar-expand-lg shadow-sm"
        style={{ background: current.nav }}
      >
        <div className="container-fluid">
          <span className="navbar-brand fw-semibold text-white">
            <i className="bi bi-chat-dots-fill me-2"></i>ChatConnect
          </span>

          <div className="ms-auto d-flex align-items-center">
            <button
              className="btn btn-outline-light rounded-circle me-3"
              onClick={toggleTheme}
            >
              {darkMode ? (
                <i className="bi bi-sun-fill"></i>
              ) : (
                <i className="bi bi-moon-stars-fill"></i>
              )}
            </button>

            <span className="me-3 text-white fw-medium">{user?.name}</span>

            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid p-0">
        <div className="row g-0" style={{ height: "calc(100vh - 56px)" }}>
          <div
            className="col-md-3 border-end"
            style={{
              background: current.sidebar,
              overflowY: "auto",
            }}
          >
            <Sidebar socket={socket} setSelectedUser={setSelectedUser} handleCallUser={handleCallUser} />
          </div>

          <div
            className="col-md-9 d-flex flex-column"
            style={{
              background: current.chat,
            }}
          >
            <ChatWindow socket={socket} user={user} selectedUser={selectedUser} />
          </div>
        </div>
      </div>

      {/* ---------------- Call Modal ---------------- */}
      {callOpen && selectedUser && (
        <Call
          socket={socket}
          user={user}
          selectedUser={selectedUser}
          type="video"
          onClose={() => {
            setCallOpen(false);
            setIncomingCallInfo(null);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;

