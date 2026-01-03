
/*
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

  // --- 1. Tick Logic (High Contrast) ---
  const renderTicks = (status) => {
    const tickStyle = { 
      fontSize: "16px", 
      fontWeight: "bold", 
      marginLeft: "4px" 
    };

    if (status === "delivered") {
      return <i className="bi bi-check-all" style={{ ...tickStyle, color: "rgba(255, 255, 255, 0.7)" }}></i>;
    }
    if (status === "seen") {
      return <i className="bi bi-check-all" style={{ ...tickStyle, color: "#00FFF0" }}></i>;
    }
    return <i className="bi bi-check" style={{ ...tickStyle, color: "rgba(255, 255, 255, 0.7)" }}></i>;
  };

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

  useEffect(() => {
    if (selectedUser) {
      setUserStatus(selectedUser.isOnline ? "online" : selectedUser.lastSeen);
    }
  }, [selectedUser]);

  // --- 2. Mark as Seen Trigger (Critical for Blue Ticks) ---
  useEffect(() => {
    if (!socket || !selectedUser?._id || messages.length === 0) return;

    const unreadIds = messages
      .filter((m) => m.sender === selectedUser._id && m.status !== "seen")
      .map((m) => m._id);

    if (unreadIds.length > 0) {
      socket.emit("mark-as-seen", { 
        messageIds: unreadIds, 
        senderId: selectedUser._id, 
        userId: user._id 
      });

      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m._id) ? { ...m, status: "seen" } : m))
      );
    }
  }, [messages.length, selectedUser?._id, socket, user._id]);

  // --- 3. Socket Event Listeners ---
  useEffect(() => {
    if (!socket || !user?._id || !selectedUser?._id) return;

    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => {
        const isDuplicate = prev.some((m) => m._id === message._id);
        if (isDuplicate) return prev;
        return [...prev, message];
      });
    });

    // SINGLE Delivery update (Real-time)
    socket.on("message-status-updated", ({ messageId, status }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, status } : m)));
    });

    // BULK Delivery update (When peer logs in)
    socket.on("messages-delivered-bulk", ({ messageIds, status }) => {
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(m._id) ? { ...m, status } : m))
      );
    });

    // Seen Update (Blue Ticks)
    socket.on("messages-seen-update", ({ messageIds, receiverId }) => {
      if (receiverId === selectedUser?._id) {
        setMessages((prev) =>
          prev.map((m) => (messageIds.includes(m._id) ? { ...m, status: "seen" } : m))
        );
      }
    });

    socket.on("user-status", ({ userId, status, lastSeen }) => {
      if (userId === selectedUser._id) {
        setUserStatus(status === "online" ? "online" : lastSeen);
      }
    });

    socket.on("updateOnlineUsers", (onlineIds) => {
      if (onlineIds.includes(selectedUser._id)) {
        setUserStatus("online");
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
      socket.off("updateOnlineUsers");
      socket.off("messageDeleted");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("message-status-updated");
      socket.off("messages-delivered-bulk");
      socket.off("messages-seen-update");
    };
  }, [socket, selectedUser?._id, user?._id]);

  // --- 4. Fetch History ---
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
      
      setMessages((prev) => {
        if (prev.some(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      
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

      
      <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: darkMode ? "#121212" : "#f0f2f5" }}>
        {messages.map((msg) => (
          <div key={msg._id} className={`d-flex mb-2 ${msg.sender === user?._id ? "justify-content-end" : "justify-content-start"}`}>
            <div 
              className={`position-relative p-2 px-3 rounded-4 shadow-sm ${msg.sender === user?._id ? "text-white" : "bg-white text-dark"}`} 
              style={{ 
                minWidth: '80px', 
                maxWidth: '75%',
                backgroundColor: msg.sender === user?._id ? "#075E54" : "#ffffff", 
                border: msg.sender !== user?._id ? "1px solid #dee2e6" : "none"
              }}
            >
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
                     <img src={`${BASE_URL}${msg.fileUrl}`} style={{maxWidth: '100%', borderRadius: '8px'}} className="img-fluid" onClick={() => window.open(`${BASE_URL}${msg.fileUrl}`, '_blank')} alt="attachment" />
                   ) : (
                     <audio controls className="w-100" style={{ height: "30px" }}>
                       <source src={`${BASE_URL}${msg.fileUrl}`} type="audio/webm" />
                     </audio>
                   )}
                </div>
              )}
              
              <p className="mb-1 text-break pe-2">{msg.content}</p>
              
              <div className="d-flex align-items-center justify-content-end" style={{ fontSize: "9px" }}>
                <span className="opacity-75">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.sender === user?._id && renderTicks(msg.status)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      
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
  
  // --- Profile Modal State ---
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const BASE_URL = "https://chat-b-7y5f.onrender.com";

  // --- 1. Tick Logic (High Contrast) ---
  const renderTicks = (status) => {
    const tickStyle = { 
      fontSize: "16px", 
      fontWeight: "bold", 
      marginLeft: "4px" 
    };

    if (status === "delivered") {
      return <i className="bi bi-check-all" style={{ ...tickStyle, color: "rgba(255, 255, 255, 0.7)" }}></i>;
    }
    if (status === "seen") {
      return <i className="bi bi-check-all" style={{ ...tickStyle, color: "#00FFF0" }}></i>;
    }
    return <i className="bi bi-check" style={{ ...tickStyle, color: "rgba(255, 255, 255, 0.7)" }}></i>;
  };

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

  useEffect(() => {
    if (selectedUser) {
      setUserStatus(selectedUser.isOnline ? "online" : selectedUser.lastSeen);
    }
  }, [selectedUser]);

  // --- 2. Mark as Seen Trigger (Critical for Blue Ticks) ---
  useEffect(() => {
    if (!socket || !selectedUser?._id || messages.length === 0) return;

    const unreadIds = messages
      .filter((m) => m.sender === selectedUser._id && m.status !== "seen")
      .map((m) => m._id);

    if (unreadIds.length > 0) {
      socket.emit("mark-as-seen", { 
        messageIds: unreadIds, 
        senderId: selectedUser._id, 
        userId: user._id 
      });

      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m._id) ? { ...m, status: "seen" } : m))
      );
    }
  }, [messages.length, selectedUser?._id, socket, user._id]);

  // --- 3. Socket Event Listeners ---
  useEffect(() => {
    if (!socket || !user?._id || !selectedUser?._id) return;

    socket.emit("joinRoom", { userId: user._id, receiverId: selectedUser._id });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => {
        const isDuplicate = prev.some((m) => m._id === message._id);
        if (isDuplicate) return prev;
        return [...prev, message];
      });
    });

    socket.on("message-status-updated", ({ messageId, status }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, status } : m)));
    });

    socket.on("messages-delivered-bulk", ({ messageIds, status }) => {
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(m._id) ? { ...m, status } : m))
      );
    });

    socket.on("messages-seen-update", ({ messageIds, receiverId }) => {
      if (receiverId === selectedUser?._id) {
        setMessages((prev) =>
          prev.map((m) => (messageIds.includes(m._id) ? { ...m, status: "seen" } : m))
        );
      }
    });

    socket.on("user-status", ({ userId, status, lastSeen }) => {
      if (userId === selectedUser._id) {
        setUserStatus(status === "online" ? "online" : lastSeen);
      }
    });

    socket.on("updateOnlineUsers", (onlineIds) => {
      if (onlineIds.includes(selectedUser._id)) {
        setUserStatus("online");
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
      socket.off("updateOnlineUsers");
      socket.off("messageDeleted");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("message-status-updated");
      socket.off("messages-delivered-bulk");
      socket.off("messages-seen-update");
    };
  }, [socket, selectedUser?._id, user?._id]);

  // --- 4. Fetch History ---
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
      
      setMessages((prev) => {
        if (prev.some(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      
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
      
      {/* --- PROFILE MODAL --- */}
      {showProfileModal && (
        <div 
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ zIndex: 3000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className={`p-4 rounded-4 shadow-lg text-center ${darkMode ? "bg-dark text-white border border-secondary" : "bg-white"}`} 
            style={{ width: "320px" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="position-relative d-inline-block mb-3">
               <div className="bg-primary rounded-circle border border-4 border-white shadow-sm d-flex align-items-center justify-content-center text-white fw-bold overflow-hidden" style={{ width: "120px", height: "120px", fontSize: "40px" }}>
                  {selectedUser?.avatar ? (
                    <img src={`${BASE_URL}${selectedUser.avatar}`} className="w-100 h-100 object-fit-cover" alt="avatar" />
                  ) : selectedUser?.name?.charAt(0).toUpperCase()}
               </div>
            </div>
            <h4 className="fw-bold mb-1">{selectedUser?.name}</h4>
            <p className="text-muted small mb-3">{userStatus === "online" ? "Online" : "Last seen recently"}</p>
            
            <div className={`p-3 rounded-3 text-start ${darkMode ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
              <small className="fw-bold text-primary text-uppercase" style={{ fontSize: "10px" }}>Bio</small>
              <div className="small mt-1">{selectedUser?.bio || "Hey there! I am using this chat application."}</div>
            </div>

            <button className="btn btn-primary w-100 rounded-pill mt-4 fw-bold" onClick={() => setShowProfileModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className={`p-3 border-bottom d-flex align-items-center justify-content-between ${darkMode ? "bg-dark text-white border-secondary" : "bg-light"}`}>
        <div className="d-flex align-items-center" style={{ cursor: "pointer" }} onClick={() => setShowProfileModal(true)}>
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold overflow-hidden" style={{ width: "42px", height: "42px" }}>
            {selectedUser?.avatar ? (
              <img src={`${BASE_URL}${selectedUser.avatar}`} className="w-100 h-100 object-fit-cover" alt="avatar" />
            ) : selectedUser?.name?.charAt(0).toUpperCase() || "U"}
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
            <div 
              className={`position-relative p-2 px-3 rounded-4 shadow-sm ${msg.sender === user?._id ? "text-white" : "bg-white text-dark"}`} 
              style={{ 
                minWidth: '80px', 
                maxWidth: '75%',
                backgroundColor: msg.sender === user?._id ? "#075E54" : "#ffffff", 
                border: msg.sender !== user?._id ? "1px solid #dee2e6" : "none"
              }}
            >
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
                     <img src={`${BASE_URL}${msg.fileUrl}`} style={{maxWidth: '100%', borderRadius: '8px'}} className="img-fluid" onClick={() => window.open(`${BASE_URL}${msg.fileUrl}`, '_blank')} alt="attachment" />
                   ) : (
                     <audio controls className="w-100" style={{ height: "30px" }}>
                       <source src={`${BASE_URL}${msg.fileUrl}`} type="audio/webm" />
                     </audio>
                   )}
                </div>
              )}
              
              <p className="mb-1 text-break pe-2">{msg.content}</p>
              
              <div className="d-flex align-items-center justify-content-end" style={{ fontSize: "9px" }}>
                <span className="opacity-75">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.sender === user?._id && renderTicks(msg.status)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
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