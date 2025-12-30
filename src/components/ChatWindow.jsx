
/*
import React, { useEffect, useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import API from "../api";
import { useTheme } from "../ThemeContext";

const ChatWindow = ({ user, selectedUser, socket, startCall }) => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userLastSeen, setUserLastSeen] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com";

  // 1. Join Room on user change
  useEffect(() => {
    if (!socket || !selectedUser?._id) return;
    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });
    
    // Reset state for new user
    setMessages([]);
    setIsTyping(false);
  }, [socket, user._id, selectedUser?._id]);

  // 2. Socket Listeners
  useEffect(() => {
    if (!socket || !selectedUser?._id) return;

    const handleReceive = (message) => {
      const isForThisChat =
        (message.sender === selectedUser._id && message.receiver === user._id) ||
        (message.sender === user._id && message.receiver === selectedUser._id);
      if (isForThisChat) setMessages((prev) => [...prev, message]);
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    
    socket.on("user-status", ({ userId, status, lastSeen }) => {
      if (userId === selectedUser._id) {
        setUserLastSeen(status === "online" ? "online" : formatLastSeen(lastSeen));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("user-status");
    };
  }, [socket, selectedUser?._id, user._id]);

  // 3. Fetch Initial Data
  useEffect(() => {
    const fetchChatData = async () => {
      if (!selectedUser?._id) return;
      try {
        const [msgRes, userRes] = await Promise.all([
          API.get(`/messages/${selectedUser._id}`, { headers: { Authorization: `Bearer ${user.token}` } }),
          API.get(`/users/${selectedUser._id}`, { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setMessages(msgRes.data);
        setUserLastSeen(userRes.data.lastSeen ? formatLastSeen(userRes.data.lastSeen) : "Offline");
      } catch (err) {
        console.error("Error fetching chat data:", err);
      }
    };
    fetchChatData();
  }, [selectedUser?._id, user.token]);

  // 4. Scroll to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Offline";
    if (timestamp === "online") return "online";
    const date = new Date(timestamp);
    return `Last seen at ${date.toLocaleString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const sendMessage = async (formData) => {
    try {
      const res = await API.post("/messages", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      socket.emit("sendMessage", res.data);
    } catch (err) {
      console.error("Send failed", err);
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
    socket.emit("stopTyping", [user._id, selectedUser._id].sort().join("_"));
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !selectedUser) return;
    
    const roomId = [user._id, selectedUser._id].sort().join("_");
    socket.emit("typing", roomId);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", roomId);
    }, 2000);
  };

  const handleMicClick = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "voice.webm", { type: "audio/webm" });
          const formData = new FormData();
          formData.append("receiverId", selectedUser._id);
          formData.append("file", file);
          await sendMessage(formData);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
      } catch (err) {
        console.error("Mic access denied", err);
      }
    } else {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // CRITICAL GUARD: This prevents the "Cannot read properties of null (reading 'name')" error
  if (!selectedUser || !selectedUser._id) {
    return (
      <div className={`d-flex flex-column justify-content-center align-items-center h-100 ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
        <h5>Welcome to ChatConnect 💬</h5>
        <p>Select a user to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100 position-relative">
      
      <div className={`d-flex align-items-center justify-content-between p-3 border-bottom ${darkMode ? "bg-secondary text-light" : "bg-light text-dark"}`}>
        <div>
          <h6 className="mb-0">{selectedUser.name}</h6>
          <small className={userLastSeen === "online" ? "text-success fw-bold" : "text-muted"}>
            {isTyping ? "Typing..." : userLastSeen || "Offline"}
          </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => startCall("audio")}>📞</button>
          <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => startCall("video")}>🎥</button>
        </div>
      </div>

      
      <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: darkMode ? "#121212" : "#f5f7fb" }}>
        {messages.map((msg) => (
          <div key={msg._id} className={`d-flex mb-3 ${msg.sender === user._id ? "justify-content-end" : "justify-content-start"}`}>
            <div className={`p-2 px-3 rounded-3 shadow-sm ${msg.sender === user._id ? "bg-primary text-white" : darkMode ? "bg-dark text-white border-secondary border" : "bg-white border"}`} style={{ maxWidth: "75%" }}>
              {msg.fileUrl && (
                <div className="mb-1">
                  {msg.fileType === "image" && <img src={`${BASE_URL}${msg.fileUrl}`} className="img-fluid rounded" alt="sent" style={{maxHeight: '300px'}}/>}
                  {msg.fileType === "audio" && <audio controls preload="metadata" src={`${BASE_URL}${msg.fileUrl}`} className="w-100" />}
                  {msg.fileType === "document" && <a href={`${BASE_URL}${msg.fileUrl}`} className="text-info d-block p-1" target="_blank" rel="noreferrer">📄 View Document</a>}
                </div>
              )}
              <div className="text-break">{msg.content}</div>
              <small className={`d-block text-end mt-1 ${msg.sender === user._id ? "text-white-50" : "text-muted"}`} style={{ fontSize: "0.65rem" }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      
      <form onSubmit={handleSend} className={`p-3 border-top d-flex align-items-center gap-2 ${darkMode ? "bg-dark" : "bg-white"}`}>
        <button type="button" onClick={handleMicClick} className={`btn rounded-circle ${recording ? "btn-danger" : "btn-outline-secondary"}`}>
          {recording ? "⏹️" : "🎤"}
        </button>
        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="btn btn-link p-0 text-decoration-none fs-4">😊</button>
        
        <label className="btn btn-link p-0 mb-0 fs-4" style={{ cursor: "pointer" }}>
          📎 <input type="file" hidden onChange={(e) => {
             const file = e.target.files[0];
             if (file) {
               const formData = new FormData();
               formData.append("receiverId", selectedUser._id);
               formData.append("file", file);
               sendMessage(formData);
             }
          }} />
        </label>

        <input 
          type="text" 
          className={`form-control rounded-pill ${darkMode ? "bg-secondary text-white border-0" : ""}`} 
          placeholder="Type a message..." 
          value={text} 
          onChange={handleTyping} 
        />
        <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={!text.trim()}>Send</button>
      </form>

    
      {showEmojiPicker && (
        <div className="position-absolute" style={{ bottom: "85px", left: "15px", zIndex: 100 }}>
          <EmojiPicker 
            onEmojiClick={(emoji) => setText(prev => prev + emoji.emoji)} 
            theme={darkMode ? "dark" : "light"}
            height={400}
            width={300}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
*/


import React, { useEffect, useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import API from "../api";
import { useTheme } from "../ThemeContext";

const ChatWindow = ({ user, selectedUser, setSelectedUser, socket, startCall }) => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userLastSeen, setUserLastSeen] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://chat-b-7y5f.onrender.com";

  // 1. Socket Listeners (Moved BEFORE the guard)
  useEffect(() => {
    // We check for selectedUser INSIDE the hook logic, not outside
    if (!socket || !selectedUser?._id) return;

    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });

    const handleReceive = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleDelete = (msgId) => {
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageDeleted", handleDelete);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageDeleted", handleDelete);
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, selectedUser?._id, user._id]);

  // 2. Fetch History (Moved BEFORE the guard)
  useEffect(() => {
    const fetchChatData = async () => {
      if (!selectedUser?._id) return;
      try {
        const res = await API.get(`/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMessages(res.data);
      } catch (err) { console.error(err); }
    };
    fetchChatData();
  }, [selectedUser?._id, user.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Guards and Handlers
  const handleDeleteAction = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await API.delete(`/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      const roomId = [user._id, selectedUser._id].sort().join("_");
      socket.emit("deleteMessage", { msgId, roomId });
    } catch (err) { console.error(err); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("content", text);
    try {
      const res = await API.post("/messages", formData, {
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "multipart/form-data" },
      });
      socket.emit("sendMessage", res.data);
      setText("");
    } catch (err) { console.error(err); }
  };

  // --- CRITICAL GUARD: Move this after all hooks ---
  if (!selectedUser) {
    return (
      <div className={`d-flex flex-column justify-content-center align-items-center h-100 ${darkMode ? "bg-dark text-white" : "bg-light text-muted"}`}>
        <h5>Select a chat to start messaging</h5>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden bg-white shadow">
      
      {/* HEADER: Fixed with Back Button */}
      <div className={`d-flex align-items-center justify-content-between p-3 border-bottom ${darkMode ? "bg-dark text-white" : "bg-light text-dark"}`} style={{ flexShrink: 0, zIndex: 10 }}>
        <div className="d-flex align-items-center overflow-hidden">
          
          <button 
            className="btn btn-link p-0 me-3 text-decoration-none d-md-none" 
            onClick={() => setSelectedUser(null)}
            style={{ fontSize: "1.4rem", color: darkMode ? "white" : "black" }}
          >
            ❮
          </button>

          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold" style={{ width: "40px", height: "40px", flexShrink: 0 }}>
            {selectedUser.name?.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-truncate">
            <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: "120px" }}>{selectedUser.name}</h6>
            <small className="text-success">{isTyping ? "Typing..." : "Online"}</small>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary rounded-pill px-2 px-md-3" onClick={() => startCall("audio")}>📞</button>
          <button className="btn btn-sm btn-outline-primary rounded-pill px-2 px-md-3" onClick={() => startCall("video")}>🎥</button>
        </div>
      </div>

      {/* SCROLLABLE MESSAGES */}
      <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column" style={{ backgroundColor: darkMode ? "#1a1a1a" : "#f0f2f5" }}>
        {messages.map((msg) => (
          <div key={msg._id} className={`d-flex mb-2 ${msg.sender === user._id ? "justify-content-end" : "justify-content-start"}`}>
            <div className="d-flex align-items-center">
              {msg.sender === user._id && (
                <div className="dropdown me-1">
                  <button className="btn btn-link btn-sm text-muted p-0 border-0" data-bs-toggle="dropdown">⋮</button>
                  <ul className="dropdown-menu shadow-sm">
                    <li><button className="dropdown-item text-danger small" onClick={() => handleDeleteAction(msg._id)}>Delete</button></li>
                  </ul>
                </div>
              )}
              <div className={`p-2 px-3 rounded-4 shadow-sm ${msg.sender === user._id ? "bg-primary text-white" : "bg-white text-dark"}`} style={{ maxWidth: "80%" }}>
                <p className="mb-0 text-break">{msg.content}</p>
                <small className="d-block text-end opacity-50" style={{ fontSize: "0.6rem" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <div className={`p-3 border-top ${darkMode ? "bg-dark" : "bg-white"}`} style={{ flexShrink: 0 }}>
        <form onSubmit={handleSend} className="d-flex align-items-center gap-2">
          <input 
            type="text" 
            className={`form-control rounded-pill px-3 ${darkMode ? "bg-secondary border-0 text-white" : "bg-light border-0"}`} 
            placeholder="Type a message..." 
            value={text} 
            onChange={(e) => {
              setText(e.target.value);
              const roomId = [user._id, selectedUser._id].sort().join("_");
              socket.emit("typing", roomId);
            }} 
          />
          <button type="submit" className="btn btn-primary rounded-pill" disabled={!text.trim()}>➤</button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;