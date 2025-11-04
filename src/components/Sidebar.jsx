
import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ setSelectedUser }) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // ✅ Prevent null user or missing token
        if (!user || !user.token) return;

        const res = await API.get("/users", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        // ✅ Exclude current user
        setUsers(res.data.filter((u) => u._id !== user._id));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [user]);

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
      style={{
        height: "100%",
        overflowY: "auto",
        borderTopLeftRadius: "1rem",
      }}
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
                  style={{ objectFit: "cover" }}
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

              <div className="flex-grow-1">{u.name}</div>
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
