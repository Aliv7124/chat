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


import React, { useState, useEffect, useContext, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import Call from "../Call";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { useTheme } from "../ThemeContext";

const socket = io(import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com");

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [callData, setCallData] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  
  // 1. Get darkMode from context and define currentTheme LOCALLY
  const { darkMode, toggleTheme } = useTheme();
  
  const currentTheme = {
    navBg: darkMode ? "#212529" : "#ffffff",
    textColor: darkMode ? "#f8f9fa" : "#212529",
    accent: "#0d6efd",
  };

  const ringtoneRef = useRef(new Audio("/ringtone.mp3"));

  useEffect(() => {
    if (!user) return;

    socket.emit("user-online", user._id);

    socket.on("incoming-call", ({ from, type }) => {
      setIncomingCall({ from, type });
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(err => console.log("Audio play blocked"));
    });

    socket.on("call-accepted", () => {
      stopRingtone();
      setCallData((prev) => ({ ...prev, active: true }));
    });

    socket.on("call-rejected", () => {
      stopRingtone();
      alert("Call was rejected");
      setCallData(null);
    });

    socket.on("call-ended", () => {
      stopRingtone();
      setCallData(null);
      setIncomingCall(null);
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-rejected");
      socket.off("call-ended");
    };
  }, [user]);

  const stopRingtone = () => {
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  };

  const startCall = (type) => {
    if (!selectedUser) return;
    socket.emit("call-user", { from: user._id, to: selectedUser._id, type });
    setCallData({ user: selectedUser, type, isCaller: true, active: false });
  };

  const onAccept = () => {
    stopRingtone();
    socket.emit("accept-call", { to: incomingCall.from });
    setCallData({
      user: { _id: incomingCall.from, name: "Partner" }, 
      type: incomingCall.type,
      isCaller: false,
      active: true,
    });
    setIncomingCall(null);
  };

  const onReject = () => {
    stopRingtone();
    socket.emit("reject-call", { to: incomingCall.from });
    setIncomingCall(null);
  };

  return (
    /* MASTER WRAPPER */
    <div className="d-flex flex-column vh-100 p-0 overflow-hidden">
      
      {/* 1. NAVBAR */}
     {/* 1. NAVBAR */}
<nav 
  className="navbar navbar-expand-lg shadow-sm" 
  style={{
    background: currentTheme.navBg,
    color: currentTheme.textColor,
    flexShrink: 0 
  }}
>
  <div className="container-fluid d-flex align-items-center">
    
    {/* LEFT: Brand */}
    <div className="d-flex align-items-center">
      <span className="navbar-brand fw-semibold d-flex align-items-center mb-0" style={{ color: currentTheme.accent }}>
        <i className="bi bi-chat-dots-fill me-2"></i> ChatConnect
      </span>
    </div>

    {/* RIGHT: Profile, Theme, and Logout */}
    <div className="ms-auto d-flex align-items-center gap-3">
      
      {/* 1. Profile Name & Photo */}
      <div className="d-flex align-items-center gap-2">
        <span className="fw-medium d-none d-sm-inline" style={{ color: currentTheme.textColor }}>
          {user?.name}
        </span>
        {user?.avatar ? (
          <img
            src={user.avatar.startsWith("http") ? user.avatar : `https://chat-b-7y5f.onrender.com${user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`}`}
            alt="profile"
            className="rounded-circle border"
            style={{ width: "35px", height: "35px", objectFit: "cover", borderColor: currentTheme.accent }}
          />
        ) : (
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "35px", height: "35px" }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* 2. Dark/Light Theme Toggle */}
      <button 
        className="btn btn-link nav-link p-0 border-0" 
        onClick={toggleTheme} 
        style={{ color: currentTheme.accent, fontSize: "1.2rem" }}
      >
        {darkMode ? <i className="bi bi-sun-fill"></i> : <i className="bi bi-moon-stars-fill"></i>}
      </button>

      {/* 3. Logout Option */}
      <button 
        className="btn btn-sm btn-outline-danger rounded-pill px-3 ms-2"
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
        }}
      >
        <i className="bi bi-box-arrow-right"></i> <span className="d-none d-md-inline">Logout</span>
      </button>

    </div>
  </div>
</nav>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-grow-1 overflow-hidden position-relative">
        <div className="row g-0 h-100">
          
          {/* SIDEBAR */}
          <div className={`col-md-4 col-lg-3 border-end h-100 ${selectedUser ? "d-none d-md-block" : "d-block"}`}>
            <Sidebar user={user} setSelectedUser={setSelectedUser} socket={socket} />
          </div>

          {/* CHAT WINDOW */}
          <div className={`col-md-8 col-lg-9 h-100 ${!selectedUser ? "d-none d-md-block" : "d-block"}`}>
            <ChatWindow 
              user={user} 
              selectedUser={selectedUser} 
              setSelectedUser={setSelectedUser} 
              socket={socket} 
              startCall={startCall} 
            />
          </div>
        </div>
      </div>

      {/* 3. CALL SCREENS */}
      {incomingCall && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75" style={{ zIndex: 10001 }}>
          <div className="bg-white p-5 rounded-4 text-center shadow-lg border border-primary">
            <div className="mb-3 display-4">📞</div>
            <h3 className="fw-bold">Incoming {incomingCall.type} Call</h3>
            <div className="d-flex gap-3 justify-content-center mt-4">
              <button className="btn btn-success btn-lg rounded-pill px-5 shadow-sm" onClick={onAccept}>Accept</button>
              <button className="btn btn-danger btn-lg rounded-pill px-5 shadow-sm" onClick={onReject}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {callData && !callData.active && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-primary text-white" style={{ zIndex: 10001 }}>
          <div className="text-center">
            <div className="pulse-container mb-4">
              <div className="pulse-ring"></div>
              <div className="avatar-placeholder">{callData.user.name?.charAt(0)}</div>
            </div>
            <h2 className="fw-light">Calling {callData.user.name}...</h2>
            <button className="btn btn-outline-light rounded-pill px-5 mt-5" onClick={() => {
              socket.emit("end-call", { to: callData.user._id });
              setCallData(null);
            }}>Cancel Call</button>
          </div>
        </div>
      )}

      {callData?.active && (
        <Call
          socket={socket}
          user={user}
          otherUser={callData.user}
          type={callData.type}
          isCaller={callData.isCaller}
          onEnd={() => setCallData(null)}
        />
      )}

      <style>{`
        .pulse-container { position: relative; width: 120px; height: 120px; margin: 0 auto; }
        .avatar-placeholder { width: 100%; height: 100%; background: white; color: #007bff; font-size: 3rem; font-weight: bold; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(255, 255, 255, 0.4); animation: pulse 2s infinite; z-index: 1; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default ChatPage;