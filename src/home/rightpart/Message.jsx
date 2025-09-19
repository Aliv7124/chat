import React from "react";

function Message({ message }) {
  // ✅ Get logged-in user from localStorage key "user"
  const authUser = JSON.parse(localStorage.getItem("user"));
  const itsMe = message.senderId === authUser?._id;

  const chatName = itsMe ? "chat-end" : "chat-start";
  const chatColor = itsMe ? "bg-blue-500" : "bg-gray-700";

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "…";

  return (
    <div className="p-1">
      <div className={`chat ${chatName}`}>
        <div className={`chat-bubble text-white ${chatColor}`}>
          {message.message}
        </div>
        <div className="chat-footer text-gray-400 text-xs">{formattedTime}</div>
      </div>
    </div>
  );
}

export default Message;
