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

import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import Call from "../components/Call";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

// Connect to your backend URL
const socket = io(import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com");

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [callData, setCallData] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Notify server that user is online
    socket.emit("user-online", user._id);

    socket.on("incoming-call", ({ from, type }) => {
      setIncomingCall({ from, type });
    });

    socket.on("call-accepted", () => {
      // Caller transitions to active call
      setCallData((prev) => ({ ...prev, active: true }));
    });

    socket.on("call-rejected", () => {
      alert("Call was rejected");
      setCallData(null);
    });

    socket.on("call-ended", () => {
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

  const startCall = (type) => {
    if (!selectedUser) return;
    socket.emit("call-user", { from: user._id, to: selectedUser._id, type });
    // Set state to "Waiting" (active: false)
    setCallData({ user: selectedUser, type, isCaller: true, active: false });
  };

  const onAccept = () => {
    socket.emit("accept-call", { to: incomingCall.from });
    // Callee joins immediately (active: true)
    setCallData({
      user: { _id: incomingCall.from },
      type: incomingCall.type,
      isCaller: false,
      active: true,
    });
    setIncomingCall(null);
  };

  const onReject = () => {
    socket.emit("reject-call", { to: incomingCall.from });
    setIncomingCall(null);
  };

  return (
    <div className="container-fluid vh-100 p-0 overflow-hidden">
      <div className="row g-0 h-100">
        {/* Sidebar: Pass setSelectedUser to update the chat */}
        <div className="col-md-4 col-lg-3 border-end h-100">
          <Sidebar 
            user={user} 
            setSelectedUser={setSelectedUser} 
            socket={socket} 
          />
        </div>

        {/* Chat Window: Pass startCall to trigger calls */}
        <div className="col-md-8 col-lg-9 h-100">
          <ChatWindow
            user={user}
            selectedUser={selectedUser}
            socket={socket}
            startCall={startCall}
          />
        </div>
      </div>

      {/* --- CALL OVERLAYS --- */}

      {/* 1. Incoming Call UI */}
      {incomingCall && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75" style={{ zIndex: 10001 }}>
          <div className="bg-white p-4 rounded-3 text-center shadow-lg">
            <h4>Incoming {incomingCall.type} Call...</h4>
            <div className="d-flex gap-3 justify-content-center mt-4">
              <button className="btn btn-success px-4" onClick={onAccept}>Accept ✅</button>
              <button className="btn btn-danger px-4" onClick={onReject}>Reject ❌</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Outgoing Call "Ringing" Screen */}
      {callData && !callData.active && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-primary" style={{ zIndex: 10001 }}>
          <div className="text-white text-center">
            <div className="spinner-border mb-3" role="status"></div>
            <h3>Calling {callData.user.name}...</h3>
            <button className="btn btn-light mt-4" onClick={() => {
              socket.emit("end-call", { to: callData.user._id });
              setCallData(null);
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* 3. The Actual WebRTC Video/Audio Component */}
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
    </div>
  );
};

export default ChatPage;