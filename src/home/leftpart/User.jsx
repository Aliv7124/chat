import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;

  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  return (
    <div
      className={`hover:bg-slate-600 duration-300 ${
        isSelected ? "bg-slate-700" : ""
      }`}
      onClick={() => setSelectedConversation(user)}
    >
      <div className="flex items-center space-x-3 px-6 py-3 cursor-pointer">
        {/* Online Dot */}
        <span
          className={`w-3 h-3 rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        ></span>

        {/* Username Button */}
        <button
          className="fw-bold shadow-sm rounded-md text-dark"
          style={{
            height: "40px",
            backgroundColor: "#b3f542",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          {user.username?.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

export default User;
