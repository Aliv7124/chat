import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;
  const { socket, onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);
  return (
    <div
      className={`hover:bg-slate-600 duration-300 ${
        isSelected ? "bg-slate-700" : ""
      }`}
      onClick={() => setSelectedConversation(user)}
    >
      <div className="flex space-x-4 px-8 py-3 hover:bg-slate-700 duration-300 cursor-pointer">
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-12 rounded-full">
           
          </div>
        </div>
        <div>
         
   <button
  className="btn fw-bold shadow-sm rounded-pill text-dark"
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
  {user.username.toUpperCase()}
</button>
        </div>
      </div>
    </div>
  );
}

export default User;