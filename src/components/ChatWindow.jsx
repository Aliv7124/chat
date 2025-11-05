
/*
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
  const messagesEndRef = useRef(null); // ✅ added

  const BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com";

  useEffect(() => {
    if (socket && user) socket.emit("userOnline", user._id);
  }, [socket, user]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });
  }, [socket, user, selectedUser]);

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
    if (!socket || !selectedUser) return;
    const handleReceive = (message) => {
      const isForThisChat =
        (message.sender === selectedUser._id && message.receiver === user._id) ||
        (message.sender === user._id && message.receiver === selectedUser._id);
      if (isForThisChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };
    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [socket, selectedUser?._id, user?._id]);

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

  useEffect(() => {
    if (!socket || !selectedUser) return;

    let lastOnlineUpdate = 0;

    const formatLastSeen = (timestamp) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `Last seen ${hours}:${minutes}`;
    };

    const handleUserStatus = ({ userId, status, lastSeen }) => {
      if (userId !== selectedUser._id) return;
      const now = Date.now();
      if (status === "online") {
        lastOnlineUpdate = now;
        setUserLastSeen("online");
      } else if (status === "offline" && lastSeen && now - lastOnlineUpdate > 500) {
        setUserLastSeen(formatLastSeen(lastSeen));
      }
    };

    const handleOnlineUsers = (onlineUsers) => {
      if (onlineUsers.includes(selectedUser._id)) {
        lastOnlineUpdate = Date.now();
        setUserLastSeen("online");
      }
    };

    socket.on("userStatusChange", handleUserStatus);
    socket.on("updateOnlineUsers", handleOnlineUsers);

    return () => {
      socket.off("userStatusChange", handleUserStatus);
      socket.off("updateOnlineUsers", handleOnlineUsers);
    };
  }, [socket, selectedUser]);

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

  // ✅ Scroll to bottom on load and when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, selectedUser]);

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

  const handleEmojiClick = (emojiData) => setText((p) => p + emojiData.emoji);

  const handleDeleteMessage = async (msgId) => {
    try {
      await API.delete(`/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
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
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      className={darkMode ? "bg-dark text-light" : "bg-light text-dark"}
    >
      <div
        className={`d-flex align-items-center justify-content-between border-bottom px-3 py-2 ${
          darkMode ? "bg-secondary text-light" : "bg-light text-dark"
        }`}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          minHeight: "60px",
        }}
      >
        <div className="d-flex flex-column text-center w-100">
          <h6 className="mb-0 fw-semibold">{selectedUser.name}</h6>

         {userLastSeen === "online" && (
      <span
        style={{
          width: "10px",
          height: "10px",
          backgroundColor: "limegreen",
          borderRadius: "50%",
          display: "inline-block",
        }}
      />
    )}


          <small className="text-muted">
            {isTyping
              ? "Typing..."
              : userLastSeen === "online"
              ? "Online"
              : userLastSeen
              ? userLastSeen.startsWith("Last seen")
                ? userLastSeen
                : `Last seen ${new Date(userLastSeen).toLocaleTimeString([], {
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
                msg.sender === user._id
                  ? "justify-content-end"
                  : "justify-content-start"
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
        <div ref={messagesEndRef} /> 

      {showEmojiPicker && (
        <div
          ref={emojiRef}
          className={`position-fixed rounded shadow-lg p-2 ${
            darkMode ? "bg-dark text-light" : "bg-white text-dark"
          }`}
          style={{
            bottom: "90px",
            left: "60px",
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

/*
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
  const messagesEndRef = useRef(null);

  const BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com";

  // ✅ Notify backend user is online
  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("userOnline", user._id);
    }
  }, [socket, user]);

  // ✅ Join private room
  useEffect(() => {
    if (!socket || !selectedUser) return;
    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });
  }, [socket, user, selectedUser]);

  // ✅ Typing indicators
  useEffect(() => {
    if (!socket) return;
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket]);

  // ✅ Receive messages in real time
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleReceive = (message) => {
      const isForThisChat =
        (message.sender === selectedUser._id && message.receiver === user._id) ||
        (message.sender === user._id && message.receiver === selectedUser._id);
      if (isForThisChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [socket, selectedUser?._id, user?._id]);

  // ✅ Fetch chat history & last seen
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

  // ✅ Real-time Online/Offline status
useEffect(() => {
  if (!socket || !selectedUser) return;

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `Last seen ${hours}:${minutes}`;
  };

  const handleUserStatus = ({ userId, status, lastSeen }) => {
    if (userId === selectedUser._id) {
      setUserLastSeen(status === "online" ? "online" : formatLastSeen(lastSeen));
    }
  };

  const handleOnlineUsers = (onlineUsers) => {
    if (onlineUsers.includes(selectedUser._id)) {
      setUserLastSeen("online");
    } else {
      // Keep last seen if we have it
      setUserLastSeen((prev) =>
        typeof prev === "string" && prev.startsWith("Last seen") ? prev : "offline"
      );
    }
  };

  socket.on("userStatusChange", handleUserStatus);
  socket.on("updateOnlineUsers", handleOnlineUsers);

  // Ask backend for current online users instantly
  socket.emit("getOnlineUsers");

  return () => {
    socket.off("userStatusChange", handleUserStatus);
    socket.off("updateOnlineUsers", handleOnlineUsers);
  };
}, [socket, selectedUser]);


  // ✅ Close emoji picker when clicked outside
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

  // ✅ Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, selectedUser]);

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

  const handleEmojiClick = (emojiData) => setText((p) => p + emojiData.emoji);

  const handleDeleteMessage = async (msgId) => {
    try {
      await API.delete(`/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
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
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      className={darkMode ? "bg-dark text-light" : "bg-light text-dark"}
    >
      <div
        className={`d-flex align-items-center justify-content-between border-bottom px-3 py-2 ${
          darkMode ? "bg-secondary text-light" : "bg-light text-dark"
        }`}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          minHeight: "60px",
        }}
      >
        <div className="d-flex flex-column text-center w-100">
          <h6 className="mb-0 fw-semibold">{selectedUser.name}</h6>

          {userLastSeen === "online" && (
            <span
              style={{
                width: "10px",
                height: "10px",
                backgroundColor: "limegreen",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
          )}

          <small className="text-muted">
            {isTyping
              ? "Typing..."
              : userLastSeen === "online"
              ? "Online"
              : userLastSeen
              ? userLastSeen.startsWith("Last seen")
                ? userLastSeen
                : `Last seen ${new Date(userLastSeen).toLocaleTimeString([], {
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
                msg.sender === user._id
                  ? "justify-content-end"
                  : "justify-content-start"
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
        <div ref={messagesEndRef} />
      </div>

     
      {showEmojiPicker && (
        <div
          ref={emojiRef}
          className={`position-fixed rounded shadow-lg p-2 ${
            darkMode ? "bg-dark text-light" : "bg-white text-dark"
          }`}
          style={{
            bottom: "90px",
            left: "60px",
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
import Call from "../Call.jsx"; // ✅ Call component should respect type prop

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
  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);

  const emojiRef = useRef(null);
  const messagesEndRef = useRef(null);

  const BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com";

  // ------------------- Socket Events -------------------
  useEffect(() => {
    if (socket && user?._id) socket.emit("userOnline", user._id);
  }, [socket, user]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });
  }, [socket, user, selectedUser]);

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
    if (!socket || !selectedUser) return;

    const handleReceive = (message) => {
      const isForThisChat =
        (message.sender === selectedUser._id && message.receiver === user._id) ||
        (message.sender === user._id && message.receiver === selectedUser._id);
      if (isForThisChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [socket, selectedUser?._id, user?._id]);

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

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const formatLastSeen = (timestamp) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `Last seen ${hours}:${minutes}`;
    };

    const handleUserStatus = ({ userId, status, lastSeen }) => {
      if (userId === selectedUser._id) {
        setUserLastSeen(status === "online" ? "online" : formatLastSeen(lastSeen));
      }
    };

    const handleOnlineUsers = (onlineUsers) => {
      if (onlineUsers.includes(selectedUser._id)) {
        setUserLastSeen("online");
      } else {
        setUserLastSeen((prev) =>
          typeof prev === "string" && prev.startsWith("Last seen") ? prev : "offline"
        );
      }
    };

    socket.on("userStatusChange", handleUserStatus);
    socket.on("updateOnlineUsers", handleOnlineUsers);
    socket.emit("getOnlineUsers");

    return () => {
      socket.off("userStatusChange", handleUserStatus);
      socket.off("updateOnlineUsers", handleOnlineUsers);
    };
  }, [socket, selectedUser]);

  // ------------------- Emoji Picker -------------------
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, selectedUser]);

  // ------------------- Message Handlers -------------------
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

  const handleEmojiClick = (emojiData) => setText((p) => p + emojiData.emoji);

  const handleDeleteMessage = async (msgId) => {
    try {
      await API.delete(`/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
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
      style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      className={darkMode ? "bg-dark text-light" : "bg-light text-dark"}
    >
    {/* ------------------- Header with Call Buttons ------------------- */}
<div
  className={`d-flex align-items-center justify-content-between border-bottom px-3 py-2 ${
    darkMode ? "bg-secondary text-light" : "bg-light text-dark"
  }`}
  style={{ position: "sticky", top: 0, zIndex: 20, minHeight: "60px" }}
>
  {/* User Info */}
  <div className="d-flex flex-column text-center">
    <h6 className="mb-0 fw-semibold">{selectedUser.name}</h6>
    {userLastSeen === "online" && (
      <span
        style={{
          width: "10px",
          height: "10px",
          backgroundColor: "limegreen",
          borderRadius: "50%",
          display: "inline-block",
        }}
      />
    )}
    <small className="text-muted">
      {isTyping
        ? "Typing..."
        : userLastSeen === "online"
        ? "Online"
        : userLastSeen
        ? userLastSeen.startsWith("Last seen")
          ? userLastSeen
          : `Last seen ${new Date(userLastSeen).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`
        : "Offline"}
    </small>
  </div>

  {/* Call Buttons */}
 <div className="d-flex align-items-center">
  {/* Audio Call */}
  <button
    className={`btn btn-sm ms-2 d-flex align-items-center justify-content-center ${darkMode ? "btn-dark" : "btn-light"}`}
    style={{ width: "35px", height: "35px", borderRadius: "50%" }}
    onClick={() => {
      if (!user || !selectedUser || showAudioCallModal) return; // ✅ Guard

      setShowAudioCallModal(true); // ✅ Open modal only
    }}
  >
    <i className="bi bi-telephone-fill"></i>
  </button>

  {/* Video Call */}
  <button
    className={`btn btn-sm ms-2 d-flex align-items-center justify-content-center ${darkMode ? "btn-dark" : "btn-light"}`}
    style={{ width: "35px", height: "35px", borderRadius: "50%" }}
    onClick={() => {
      if (!user || !selectedUser || showVideoCallModal) return; // ✅ Guard

      setShowVideoCallModal(true); // ✅ Open modal only
    }}
  >
    <i className="bi bi-camera-video-fill"></i>
  </button>
</div>
</div>


      {/* ------------------- Messages ------------------- */}
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
                        style={{ right: "0", top: "24px", zIndex: 100, minWidth: "120px" }}
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
        <div ref={messagesEndRef} />
      </div>

      {/* ------------------- Emoji Picker ------------------- */}
      {showEmojiPicker && (
        <div
          ref={emojiRef}
          className={`position-fixed rounded shadow-lg p-2 ${
            darkMode ? "bg-dark text-light" : "bg-white text-dark"
          }`}
          style={{ bottom: "90px", left: "60px", zIndex: 2000, transition: "all 0.2s ease" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-semibold">{darkMode ? "Pick Emoji 🌙" : "Pick Emoji ☀️"}</small>
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

      {/* ------------------- Input Form ------------------- */}
      <form
        onSubmit={handleSend}
        className={`p-3 border-top d-flex align-items-center position-relative ${
          darkMode ? "bg-secondary" : "bg-white"
        }`}
      >
        <button
          type="button"
          onClick={handleMicClick}
          className={`btn me-2 rounded-circle ${recording ? "btn-danger" : "btn-secondary"}`}
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

      {/* ------------------- Call Modals ------------------- */}
      {showAudioCallModal && (
        <Call
          type="audio"
          user={user}
          selectedUser={selectedUser}
          socket={socket}
          onClose={() => setShowAudioCallModal(false)}
        />
      )}

      {showVideoCallModal && (
        <Call
          type="video"
          user={user}
          selectedUser={selectedUser}
          socket={socket}
          onClose={() => setShowVideoCallModal(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
