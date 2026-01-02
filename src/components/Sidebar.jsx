/*
import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ setSelectedUser, socket }) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  // ✅ Fetch users initially
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!user || !user.token) return;

        const res = await API.get("/users", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        // ✅ Exclude current user
        const filtered = res.data.filter((u) => u._id !== user._id);
        setUsers(filtered);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [user]);

  // ✅ Real-time online/offline updates
  useEffect(() => {
    if (!socket) return;

    // Request current online users immediately
    socket.emit("getOnlineUsers");

    const handleStatusChange = ({ userId, status }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isOnline: status === "online" } : u
        )
      );
    };

    const handleOnlineList = (onlineIds) => {
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isOnline: onlineIds.includes(u._id),
        }))
      );
    };

    socket.on("userStatusChange", handleStatusChange);
    socket.on("updateOnlineUsers", handleOnlineList);

    return () => {
      socket.off("userStatusChange", handleStatusChange);
      socket.off("updateOnlineUsers", handleOnlineList);
    };
  }, [socket]);

  const handleSelectUser = (u) => {
    setActiveUser(u._id);
    setSelectedUser(u);
  };

  if (!user) {
    return (
      <div className="text-center text-muted p-4">
        Please log in to view chats.
      </div>
    );
  }

  return (
    <div
      className="bg-white border-end d-flex flex-column"
      style={{ height: "100%", overflowY: "auto", borderTopLeftRadius: "1rem" }}
    >
      <div
        className="p-3 bg-primary text-white fw-bold sticky-top shadow-sm"
        style={{
          borderTopLeftRadius: "1rem",
          borderBottomRightRadius: "1rem",
          background: "linear-gradient(135deg, #6e8efb, #a777e3)",
        }}
      >
        Chats
      </div>

      <ul className="list-group list-group-flush">
        {users.length > 0 ? (
          users.map((u) => (
            <li
              key={u._id}
              className={`list-group-item list-group-item-action d-flex align-items-center ${
                activeUser === u._id ? "bg-primary text-white" : ""
              }`}
              style={{
                cursor: "pointer",
                border: "none",
                borderBottom: "1px solid #f1f1f1",
                transition: "all 0.2s ease",
              }}
              onClick={() => handleSelectUser(u)}
            >
              
              {u.avatar ? (
                <img
                  src={`https://chat-b-7y5f.onrender.com${u.avatar}`}
                  alt={u.name}
                  className="rounded-circle me-3"
                  width="40"
                  height="40"
                  style={{ objectFit: "cover", position: "relative" }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: activeUser === u._id ? "#ffffff33" : "#e9ecef",
                    color: activeUser === u._id ? "#fff" : "#6c757d",
                    fontWeight: "bold",
                  }}
                >
                  {u.name ? u.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}

              
              <div className="flex-grow-1">
                <div>{u.name}</div>
                <small className={`${u.isOnline ? "text-success" : "text-muted"} fw-semibold`}>
                  {u.isOnline ? "Online" : "Offline"}
                </small>
              </div>

              
              {u.isOnline && (
                <span
                  className="ms-2"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#28a745",
                    display: "inline-block",
                  }}
                ></span>
              )}
            </li>
          ))
        ) : (
          <li className="list-group-item text-center text-muted py-4">
            No users found
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
*/


import React, { useEffect, useState, useContext, useRef } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ setSelectedUser, socket }) => {
  const { user, setUser } = useContext(AuthContext); // Assume setUser is in context to update local state
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  
  // Profile Edit States
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const BASE_URL = "https://chat-b-7y5f.onrender.com";

  // ✅ Fetch users initially
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!user || !user.token) return;
        const res = await API.get("/users", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const filtered = res.data.filter((u) => u._id !== user._id);
        setUsers(filtered);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user]);

  // ✅ Real-time status updates
  useEffect(() => {
    if (!socket) return;
    socket.emit("getOnlineUsers");
    const handleStatusChange = ({ userId, status }) => {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isOnline: status === "online" } : u));
    };
    const handleOnlineList = (onlineIds) => {
      setUsers((prev) => prev.map((u) => ({ ...u, isOnline: onlineIds.includes(u._id) })));
    };
    socket.on("userStatusChange", handleStatusChange);
    socket.on("updateOnlineUsers", handleOnlineList);
    return () => {
      socket.off("userStatusChange", handleStatusChange);
      socket.off("updateOnlineUsers", handleOnlineList);
    };
  }, [socket]);

  // ✅ Handle Profile Update
  const handleUpdateProfile = async () => {
    try {
      const res = await API.put("/users/update-profile", { bio }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Update local context
      const updatedUser = { ...user, bio: res.data.bio };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setShowMyProfile(false);
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Handle Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // First, upload image to your existing upload endpoint
      const uploadRes = await API.post("/messages/upload", formData, {
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "multipart/form-data" }
      });
      
      const newAvatarUrl = uploadRes.data.fileUrl;

      // Second, update user record
      const res = await API.put("/users/update-profile", { avatar: newAvatarUrl }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const updatedUser = { ...user, avatar: res.data.avatar };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUploading(false);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  if (!user) return <div className="text-center text-muted p-4">Please log in.</div>;

  return (
    <div className="bg-white border-end d-flex flex-column h-100 shadow-sm" style={{ borderTopLeftRadius: "1rem" }}>
      
      {/* HEADER: Click to Edit Profile */}
      <div 
        className="p-3 text-white d-flex align-items-center justify-content-between cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #6e8efb, #a777e3)",
          borderTopLeftRadius: "1rem",
          cursor: "pointer"
        }}
        onClick={() => setShowMyProfile(!showMyProfile)}
      >
        <div className="d-flex align-items-center">
            <img 
                src={user.avatar ? `${BASE_URL}${user.avatar}` : "https://via.placeholder.com/40"} 
                className="rounded-circle me-2 border border-2 border-white" 
                width="35" height="35" style={{objectFit: 'cover'}}
                onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
            />
            <span className="fw-bold">My Chats</span>
        </div>
        <i className={`bi ${showMyProfile ? "bi-chat-left-text" : "bi-person-circle"} fs-5`}></i>
      </div>

      <div className="flex-grow-1 overflow-auto">
        {showMyProfile ? (
          /* MY PROFILE EDIT VIEW */
          <div className="p-4 animate__animated animate__fadeIn">
            <div className="text-center mb-4 position-relative">
              <img 
                src={user.avatar ? `${BASE_URL}${user.avatar}` : "https://via.placeholder.com/100"} 
                className="rounded-circle shadow-sm border" 
                width="100" height="100" style={{objectFit: 'cover'}}
              />
              <button 
                className="btn btn-sm btn-primary position-absolute rounded-circle" 
                style={{bottom: 0, right: '30%'}}
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
              >
                <i className="bi bi-camera"></i>
              </button>
              <input type="file" ref={fileInputRef} className="d-none" onChange={handleAvatarChange} />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">NAME</label>
              <input type="text" className="form-control bg-light border-0" value={user.name} disabled />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">ABOUT / BIO</label>
              <textarea 
                className="form-control border-0 bg-light" 
                rows="3" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              ></textarea>
            </div>

            <button className="btn btn-primary w-100 rounded-pill shadow-sm" onClick={handleUpdateProfile}>
              Save Changes
            </button>
            <button className="btn btn-link w-100 text-muted mt-2" onClick={() => setShowMyProfile(false)}>
              Back to Chats
            </button>
          </div>
        ) : (
          /* CHAT LIST VIEW */
          <ul className="list-group list-group-flush">
            {users.map((u) => (
              <li
                key={u._id}
                className={`list-group-item list-group-item-action d-flex align-items-center border-0 py-3 ${activeUser === u._id ? "bg-light" : ""}`}
                style={{ cursor: "pointer", borderLeft: activeUser === u._id ? "4px solid #6e8efb" : "4px solid transparent" }}
                onClick={() => { setActiveUser(u._id); setSelectedUser(u); }}
              >
                <div className="position-relative">
                    <img 
                        src={u.avatar ? `${BASE_URL}${u.avatar}` : "https://via.placeholder.com/45"} 
                        className="rounded-circle me-3" width="45" height="45" style={{objectFit: 'cover'}}
                    />
                    {u.isOnline && <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-2 border-white rounded-circle" style={{right: '15px'}}></span>}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-dark">{u.name}</div>
                  <small className="text-muted">{u.isOnline ? "Online" : "Offline"}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;