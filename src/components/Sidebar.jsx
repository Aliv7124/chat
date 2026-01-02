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