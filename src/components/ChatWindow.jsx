
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
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userStatus, setUserStatus] = useState("offline");

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const BASE_URL = "https://chat-b-7y5f.onrender.com";

  // --- 1. Date Formatter ---
  const formatLastSeen = (ts) => {
    if (!ts || ts === "online") return ts === "online" ? "Online" : "Offline";
    const date = new Date(ts);
    const day = date.getDate();
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const month = date.toLocaleString('en-US', { month: 'long' });
    const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${getOrdinal(day)} ${month} ${time}`;
  };

  // --- 2. Sync Status when selectedUser changes ---
  useEffect(() => {
    if (selectedUser) {
      setUserStatus(selectedUser.isOnline ? "online" : selectedUser.lastSeen);
    }
  }, [selectedUser]);

  // --- 3. Socket Room & Listeners ---
  useEffect(() => {
    if (!socket || !user?._id || !selectedUser?._id) return;

    // Join room for this specific chat
    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });

    socket.on("receiveMessage", (message) => {
      if (message.sender === selectedUser._id || message.sender === user._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("user-status", ({ userId, status, lastSeen }) => {
      if (userId === selectedUser._id) {
        setUserStatus(status === "online" ? "online" : lastSeen);
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));

    return () => {
      socket.off("receiveMessage");
      socket.off("user-status");
      socket.off("messageDeleted");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, selectedUser?._id, user?._id]);

  // --- 4. Fetch Message History ---
  useEffect(() => {
    const fetchChatData = async () => {
      if (!selectedUser?._id || !user?.token) return;
      try {
        const res = await API.get(`/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setMessages(res.data);
      } catch (err) { console.error("Error fetching messages:", err); }
    };
    fetchChatData();
  }, [selectedUser?._id, user?.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 5. Event Handlers ---
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !selectedUser?._id) return;
    const roomId = [user._id, selectedUser._id].sort().join("_");
    socket.emit("typing", roomId);
    clearTimeout(window.t_timeout);
    window.t_timeout = setTimeout(() => socket.emit("stopTyping", roomId), 2000);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !selectedUser?._id) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("content", text);
    try {
      const res = await API.post("/messages", formData, {
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data]);
      socket.emit("sendMessage", res.data);
      setText("");
      setShowEmojiPicker(false);
    } catch (err) { console.error(err); }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await API.delete(`/messages/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
      setMessages((prev) => prev.filter((m) => m._id !== id));
      socket.emit("deleteMessage", { messageId: id, receiverId: selectedUser?._id });
    } catch (err) { console.error(err); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser?._id) return;
    const formData = new FormData();
    formData.append("receiverId", selectedUser._id);
    formData.append("file", file);
    try {
      const res = await API.post("/messages", formData, {
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data]);
      socket.emit("sendMessage", res.data);
      e.target.value = ""; 
    } catch (err) { console.error(err); }
  };

  const toggleRecording = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const file = new File([audioBlob], "voice.webm", { type: "audio/webm" });
          const formData = new FormData();
          formData.append("receiverId", selectedUser?._id);
          formData.append("file", file);
          const res = await API.post("/messages", formData, {
            headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "multipart/form-data" },
          });
          setMessages((prev) => [...prev, res.data]);
          socket.emit("sendMessage", res.data);
          stream.getTracks().forEach(track => track.stop());
        };
        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
      } catch (err) { alert("Mic access denied"); }
    } else {
      mediaRecorder?.stop();
      setRecording(false);
    }
  };

  // SAFETY GUARD: If no user is selected, show placeholder
  if (!selectedUser || !selectedUser._id) {
    return (
      <div className={`h-100 d-flex align-items-center justify-content-center ${darkMode ? "bg-dark text-white" : "bg-light text-muted"}`}>
        <div className="text-center">
          <i className="bi bi-chat-dots" style={{ fontSize: "3rem" }}></i>
          <p className="mt-2">Select a user to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100 position-relative bg-white shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className={`p-3 border-bottom d-flex align-items-center justify-content-between ${darkMode ? "bg-dark text-white border-secondary" : "bg-light"}`}>
        <div className="d-flex align-items-center">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style={{ width: "42px", height: "42px" }}>
            {selectedUser?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <div className="fw-bold">{selectedUser?.name || "User"}</div>
            <small className={userStatus === "online" ? "text-success fw-bold" : "text-muted"}>
              {isTyping ? "Typing..." : (userStatus === "online" ? "Online" : formatLastSeen(userStatus))}
            </small>
          </div>
        </div>
        <div className="d-flex gap-1">
          <button className="btn btn-link text-primary p-2" onClick={() => startCall("audio")}><i className="bi bi-telephone-fill"></i></button>
          <button className="btn btn-link text-primary p-2" onClick={() => startCall("video")}><i className="bi bi-camera-video-fill"></i></button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: darkMode ? "#121212" : "#f0f2f5" }}>
        {messages.map((msg) => (
          <div key={msg._id} className={`d-flex mb-2 ${msg.sender === user?._id ? "justify-content-end" : "justify-content-start"}`}>
            <div className={`position-relative p-2 px-3 rounded-4 shadow-sm ${msg.sender === user?._id ? "bg-primary text-white" : "bg-white text-dark"}`} style={{ minWidth: '80px', maxWidth: '75%' }}>
              
              {msg.sender === user?._id && (
                <div className="dropdown position-absolute" style={{ top: "2px", right: "5px" }}>
                  <button className="btn btn-link btn-sm text-white opacity-50 p-0 border-0 shadow-none" data-bs-toggle="dropdown">
                    <i className="bi bi-chevron-down" style={{ fontSize: "10px" }}></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-1" style={{ fontSize: "12px" }}>
                    <li><button className="dropdown-item text-danger" onClick={() => deleteMessage(msg._id)}><i className="bi bi-trash me-2"></i>Delete</button></li>
                  </ul>
                </div>
              )}

              {msg.fileUrl && (
                <div className="my-1">
                   {msg.fileType === "image" ? (
                     <img src={`${BASE_URL}${msg.fileUrl}`} style={{maxWidth: '100%', borderRadius: '8px'}} className="img-fluid" onClick={() => window.open(`${BASE_URL}${msg.fileUrl}`, '_blank')} />
                   ) : (
                     <audio controls className="w-100" style={{ height: "30px" }}>
                       <source src={`${BASE_URL}${msg.fileUrl}`} type="audio/webm" />
                     </audio>
                   )}
                </div>
              )}
              
              <p className="mb-1 text-break pe-2">{msg.content}</p>
              <small className="d-block text-end opacity-75" style={{ fontSize: "9px" }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <div className={`p-3 border-top ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
        <form onSubmit={handleSend} className="d-flex align-items-center gap-2">
          <button type="button" className={`btn rounded-circle ${recording ? "btn-danger shadow" : "btn-light border"}`} onClick={toggleRecording}>
            <i className={`bi ${recording ? "bi-stop-circle" : "bi-mic"}`}></i>
          </button>
          
          <button type="button" className="btn btn-light border rounded-circle" onClick={() => fileInputRef.current?.click()}>
            <i className="bi bi-paperclip"></i>
          </button>
          <input type="file" ref={fileInputRef} className="d-none" onChange={handleFileChange} />

          <button type="button" className="btn btn-light border rounded-circle" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <i className="bi bi-emoji-smile"></i>
          </button>

          {showEmojiPicker && (
            <div className="position-absolute" style={{ bottom: "85px", left: "15px", zIndex: 1000 }}>
              <EmojiPicker onEmojiClick={(e) => setText(p => p + e.emoji)} theme={darkMode ? "dark" : "light"} />
            </div>
          )}

          <input 
            type="text" 
            className="form-control rounded-pill px-3 shadow-none border" 
            placeholder="Type a message..." 
            value={text} 
            onChange={handleTyping} 
          />

          <button type="submit" className="btn btn-primary rounded-circle shadow-sm" style={{ width: "42px", height: "42px" }}>
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;