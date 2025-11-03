/*
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import API from "../api";

const socket = io("http://localhost:5000");

const MessageInput = ({ user, selectedUser, onSend }) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (selectedUser) {
      socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });
    }
  }, [selectedUser, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    try {
      const res = await API.post(
        "/messages",
        { receiverId: selectedUser._id, content: text },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const msgWithTime = { ...res.data, createdAt: new Date().toISOString() };
      socket.emit("sendMessage", msgWithTime);
      onSend(msgWithTime);
      setText("");
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="d-flex align-items-center border-top bg-white p-3 shadow-sm"
      style={{
        position: "sticky",
        bottom: 0,
        borderTopLeftRadius: "1rem",
        borderTopRightRadius: "1rem",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="input-group rounded-pill overflow-hidden shadow-sm">
        <input
          type="text"
          className="form-control border-0 py-2 ps-3"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            outline: "none",
            background: "#f8f9fa",
          }}
        />
        <button
          type="submit"
          className="btn btn-primary px-4"
          style={{
            background: "linear-gradient(135deg, #6e8efb, #a777e3)",
            border: "none",
          }}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
*/

import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import API from "../api";
import { useTheme } from "../ThemeContext"; // ✅ import the theme hook

const socket = io("https://chat-b-7y5f.onrender.com");

const MessageInput = ({ user, selectedUser, onSend }) => {
  const [text, setText] = useState("");
  const { darkMode } = useTheme(); // ✅ access dark/light mode

  useEffect(() => {
    if (selectedUser) {
      socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });
    }
  }, [selectedUser, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    try {
      const res = await API.post(
        "/messages",
        { receiverId: selectedUser._id, content: text },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const msgWithTime = { ...res.data, createdAt: new Date().toISOString() };
      socket.emit("sendMessage", msgWithTime);
      onSend(msgWithTime);
      setText("");
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className={`d-flex align-items-center border-top p-3 shadow-sm ${
        darkMode ? "bg-dark" : "bg-white"
      }`}
      style={{
        position: "sticky",
        bottom: 0,
        borderTopLeftRadius: "1rem",
        borderTopRightRadius: "1rem",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="input-group rounded-pill overflow-hidden shadow-sm"
        style={{
          backgroundColor: darkMode ? "#222" : "#f8f9fa",
        }}
      >
        <input
          type="text"
          className={`form-control border-0 py-2 ps-3 ${
            darkMode ? "text-white bg-dark" : "text-dark bg-light"
          }`}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ outline: "none" }}
        />
        <button
          type="submit"
          className="btn btn-primary px-4"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, #5a67d8, #805ad5)"
              : "linear-gradient(135deg, #6e8efb, #a777e3)",
            border: "none",
          }}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </div>
    </form>
  );
};

export default MessageInput;

