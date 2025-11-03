/*
import React, { useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import API from "../api";
import { useTheme } from "../ThemeContext"; // ✅ added theme context

const ChatWindow = ({ user, selectedUser, socket }) => {
  const { darkMode } = useTheme(); // ✅ access dark mode
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userLastSeen, setUserLastSeen] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (socket && user) socket.emit("userOnline", user._id);
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      try {
        const res = await API.get(`/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchLastSeen = async () => {
      if (!selectedUser?._id) return;
      try {
        const res = await API.get(`/users/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUserLastSeen(res.data.lastSeen);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    fetchLastSeen();
  }, [selectedUser, user]);

  const sendMessage = async (formData) => {
    try {
      const res = await API.post("/messages", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const newMsg = res.data;
      socket.emit("sendMessage", newMsg);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("content", text);
    await sendMessage(formData);
    setText("");
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !selectedUser) return;
    socket.emit("typing", [user._id, selectedUser._id].sort().join("_"));
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", [user._id, selectedUser._id].sort().join("_"));
    }, 1500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("file", file);
    await sendMessage(formData);
  };

  const handleMicClick = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setRecording(true);
      recorder.ondataavailable = (e) => setAudioChunks((prev) => [...prev, e.data]);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("receiverId", selectedUser._id);
        formData.append("file", file);
        await sendMessage(formData);
        setRecording(false);
      };
    } else {
      mediaRecorder.stop();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await API.delete(`/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
      socket.emit("deleteMessage", msgId);
      setActiveMenu(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!selectedUser) {
    return (
      <div
        className={`d-flex flex-column justify-content-center align-items-center text-center h-100 ${
          darkMode ? "bg-dark text-light" : "bg-light text-dark"
        }`}
      >
        <i
          className="bi bi-chat-dots display-1 mb-3"
          style={{ opacity: 0.4 }}
        ></i>
        <h5 className="fw-semibold">Welcome to ChatConnect 💬</h5>
        <p className="small">Select a user to start chatting.</p>
      </div>
    );
  }

  return (
    <div
      className={`d-flex flex-column h-100 ${
        darkMode ? "bg-dark text-light" : "bg-light text-dark"
      }`}
    >
     
      <div
        className={`d-flex align-items-center justify-content-between border-bottom px-3 py-2 ${
          darkMode ? "bg-secondary text-light" : "bg-light text-dark"
        }`}
      >
        <div className="d-flex align-items-center">
          <h6 className="mb-0 fw-semibold">{selectedUser.name}</h6>
          <small className="ms-2 text-muted">
            {isTyping
              ? "Typing..."
              : userLastSeen
              ? `Last seen ${new Date(userLastSeen).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Offline"}
          </small>
        </div>
      </div>

     
      <div
        className="flex-grow-1 p-3 overflow-auto"
        style={{
          backgroundColor: darkMode ? "#1e1e1e" : "#f5f7fb",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        {messages.length === 0 ? (
          <p className="text-center text-muted mt-5">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`d-flex mb-2 ${
                msg.sender === user._id
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
            >
              <div
                className={`p-2 px-3 rounded-3 shadow-sm position-relative ${
                  msg.sender === user._id
                    ? darkMode
                      ? "bg-primary text-white"
                      : "bg-primary text-white"
                    : darkMode
                    ? "bg-secondary text-white"
                    : "bg-white border"
                }`}
                style={{ maxWidth: "70%" }}
              >
                {msg.sender === user._id && (
                  <div
                    className="position-absolute"
                    style={{ top: "4px", right: "-20px" }}
                  >
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === msg._id ? null : msg._id)
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: darkMode ? "#ccc" : "#666",
                      }}
                    >
                      ⋮
                    </button>

                    {activeMenu === msg._id && (
                      <div
                        className={`position-absolute border rounded shadow-sm p-1 ${
                          darkMode ? "bg-dark text-light" : "bg-white"
                        }`}
                        style={{
                          right: "0",
                          top: "24px",
                          zIndex: 100,
                          minWidth: "120px",
                        }}
                      >
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="dropdown-item text-danger small"
                        >
                          <i className="bi bi-trash me-1"></i> Delete Message
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {msg.fileType === "image" ? (
                  <img
                    src={`${BASE_URL}${msg.fileUrl}`}
                    alt="Sent"
                    className="img-fluid rounded"
                    style={{ maxHeight: "200px" }}
                  />
                ) : msg.fileType === "audio" ? (
                  <audio controls src={`${BASE_URL}${msg.fileUrl}`} />
                ) : msg.fileType === "file" ? (
                  <a
                    href={`${BASE_URL}${msg.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={darkMode ? "text-info" : ""}
                  >
                    {msg.fileUrl.split("/").pop()}
                  </a>
                ) : (
                  <div>{msg.content}</div>
                )}

                <small
                  className="d-block text-end text-muted"
                  style={{ fontSize: "0.75rem" }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

     
      {showEmojiPicker && (
        <div
          className={`emoji-picker-container position-absolute mb-5 ms-3 rounded shadow-lg p-2 ${
            darkMode ? "bg-dark text-light" : "bg-white text-dark"
          }`}
          style={{ bottom: "60px", zIndex: 20 }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-semibold">
              {darkMode ? "Pick Emoji 🌙" : "Pick Emoji ☀️"}
            </small>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={() => setShowEmojiPicker(false)}
            ></button>
          </div>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            height={350}
            width={300}
            theme={darkMode ? "dark" : "light"}
          />
        </div>
      )}

     
      <form
        onSubmit={handleSend}
        className={`p-3 border-top d-flex align-items-center position-relative ${
          darkMode ? "bg-secondary" : "bg-white"
        }`}
      >
        <button
          type="button"
          onClick={handleMicClick}
          className={`btn me-2 rounded-circle ${
            recording ? "btn-danger" : "btn-secondary"
          }`}
          style={{ width: "40px", height: "40px" }}
        >
          <i className="bi bi-mic-fill"></i>
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`btn rounded-circle me-2 d-flex align-items-center justify-content-center ${
            darkMode ? "btn-dark" : "btn-light"
          }`}
          style={{ width: "40px", height: "40px" }}
        >
          <i className="bi bi-emoji-smile fs-5"></i>
        </button>

        <label
          className={`btn rounded-circle me-2 d-flex align-items-center justify-content-center ${
            darkMode ? "btn-dark" : "btn-secondary"
          }`}
          style={{ width: "40px", height: "40px", cursor: "pointer" }}
        >
          <i className="bi bi-paperclip"></i>
          <input type="file" hidden onChange={handleFileChange} />
        </label>

        <input
          type="text"
          className="form-control me-2 rounded-pill"
          placeholder="Type a message..."
          value={text}
          onChange={handleTyping}
        />

        <button
          type="submit"
          className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px" }}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
*/


import React, { useEffect, useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import API from "../api";
import { useTheme } from "../ThemeContext";

const ChatWindow = ({ user, selectedUser, socket }) => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userLastSeen, setUserLastSeen] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const emojiRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com"


  // user online
  useEffect(() => {
    if (socket && user) socket.emit("userOnline", user._id);
  }, [socket, user]);

  // typing
  useEffect(() => {
    if (!socket) return;
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket]);

  // fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      try {
        const res = await API.get(`/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchLastSeen = async () => {
      if (!selectedUser?._id) return;
      try {
        const res = await API.get(`/users/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUserLastSeen(res.data.lastSeen);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    fetchLastSeen();
  }, [selectedUser, user]);

  // click outside emoji/delete menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // send message helper
  const sendMessage = async (formData) => {
    try {
      const res = await API.post("/messages", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const newMsg = res.data;
      socket.emit("sendMessage", newMsg);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("content", text);
    await sendMessage(formData);
    setText("");
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !selectedUser) return;
    socket.emit("typing", [user._id, selectedUser._id].sort().join("_"));
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", [user._id, selectedUser._id].sort().join("_"));
    }, 1500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("file", file);
    await sendMessage(formData);
  };

  // mic record
  const handleMicClick = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setRecording(true);
      recorder.ondataavailable = (e) => setAudioChunks((prev) => [...prev, e.data]);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("receiverId", selectedUser._id);
        formData.append("file", file);
        await sendMessage(formData);
        setRecording(false);
      };
    } else {
      mediaRecorder.stop();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await API.delete(`/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
      socket.emit("deleteMessage", msgId);
      setActiveMenu(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!selectedUser)
    return (
      <div
        className={`d-flex flex-column justify-content-center align-items-center text-center h-100 ${
          darkMode ? "bg-dark text-light" : "bg-light text-dark"
        }`}
      >
        <i className="bi bi-chat-dots display-1 mb-3" style={{ opacity: 0.4 }}></i>
        <h5 className="fw-semibold">Welcome to ChatConnect 💬</h5>
        <p className="small">Select a user to start chatting.</p>
      </div>
    );

  return (
    <div
      className={`d-flex flex-column h-100 ${
        darkMode ? "bg-dark text-light" : "bg-light text-dark"
      }`}
    >
      {/* Header */}
      <div
        className={`d-flex align-items-center justify-content-between border-bottom px-3 py-2 ${
          darkMode ? "bg-secondary text-light" : "bg-light text-dark"
        }`}
      >
        <div className="d-flex align-items-center">
          <h6 className="mb-0 fw-semibold">{selectedUser.name}</h6>
          <small className="ms-2 text-muted">
            {isTyping
              ? "Typing..."
              : userLastSeen
              ? `Last seen ${new Date(userLastSeen).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Offline"}
          </small>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-grow-1 p-3 overflow-auto"
        style={{
          backgroundColor: darkMode ? "#1e1e1e" : "#f5f7fb",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none;}`}</style>
        {messages.length === 0 ? (
          <p className="text-center text-muted mt-5">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`d-flex mb-2 ${
                msg.sender === user._id ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                className={`p-2 px-3 rounded-3 shadow-sm position-relative ${
                  msg.sender === user._id
                    ? "bg-primary text-white"
                    : darkMode
                    ? "bg-secondary text-white"
                    : "bg-white border"
                }`}
                style={{ maxWidth: "70%" }}
              >
                {msg.sender === user._id && (
                  <div className="position-absolute" style={{ top: "4px", right: "-20px" }}>
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === msg._id ? null : msg._id)
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: darkMode ? "#ccc" : "#666",
                      }}
                    >
                      ⋮
                    </button>

                    {activeMenu === msg._id && (
                      <div
                        className={`position-absolute border rounded shadow-sm p-1 ${
                          darkMode ? "bg-dark text-light" : "bg-white"
                        }`}
                        style={{
                          right: "0",
                          top: "24px",
                          zIndex: 100,
                          minWidth: "120px",
                        }}
                      >
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="dropdown-item text-danger small"
                        >
                          <i className="bi bi-trash me-1"></i> Delete Message
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {msg.fileType === "image" ? (
                  <img
                    src={`${BASE_URL}${msg.fileUrl}`}
                    alt="Sent"
                    className="img-fluid rounded"
                    style={{ maxHeight: "200px" }}
                  />
                ) : msg.fileType === "audio" ? (
                  <audio controls src={`${BASE_URL}${msg.fileUrl}`} />
                ) : msg.fileType === "document" ? (
                  <a
                    href={`${BASE_URL}${msg.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={darkMode ? "text-info" : ""}
                  >
                    {msg.fileUrl.split("/").pop()}
                  </a>
                ) : (
                  <div>{msg.content}</div>
                )}

                <small
                  className="d-block text-end text-muted"
                  style={{ fontSize: "0.75rem" }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
  <div
    ref={emojiRef}
    className={`position-fixed rounded shadow-lg p-2 ${
      darkMode ? "bg-dark text-light" : "bg-white text-dark"
    }`}
    style={{
      bottom: "90px", // stays just above input bar
      left: "60px",   // slightly aligned with emoji button
      zIndex: 2000,
      transition: "all 0.2s ease",
    }}
  >
    <div className="d-flex justify-content-between align-items-center mb-1">
      <small className="fw-semibold">
        {darkMode ? "Pick Emoji 🌙" : "Pick Emoji ☀️"}
      </small>
      <button
        type="button"
        className="btn-close btn-sm"
        onClick={() => setShowEmojiPicker(false)}
      ></button>
    </div>
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      height={350}
      width={300}
      theme={darkMode ? "dark" : "light"}
    />
  </div>
)}

         

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`p-3 border-top d-flex align-items-center position-relative ${
          darkMode ? "bg-secondary" : "bg-white"
        }`}
      >
        <button
          type="button"
          onClick={handleMicClick}
          className={`btn me-2 rounded-circle ${
            recording ? "btn-danger" : "btn-secondary"
          }`}
          style={{ width: "40px", height: "40px" }}
        >
          <i className="bi bi-mic-fill"></i>
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`btn rounded-circle me-2 d-flex align-items-center justify-content-center ${
            darkMode ? "btn-dark" : "btn-light"
          }`}
          style={{ width: "40px", height: "40px" }}
        >
          <i className="bi bi-emoji-smile fs-5"></i>
        </button>

        <label
          className={`btn rounded-circle me-2 d-flex align-items-center justify-content-center ${
            darkMode ? "btn-dark" : "btn-secondary"
          }`}
          style={{ width: "40px", height: "40px", cursor: "pointer" }}
        >
          <i className="bi bi-paperclip"></i>
          <input type="file" hidden onChange={handleFileChange} />
        </label>

        <input
          type="text"
          className="form-control me-2 rounded-pill"
          placeholder="Type a message..."
          value={text}
          onChange={handleTyping}
        />

        <button
          type="submit"
          className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px" }}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
