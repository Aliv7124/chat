/*
import React from "react";

function Message({ message }) {
  // Get logged-in user from localStorage key "user"
  const authUser = JSON.parse(localStorage.getItem("user") || '{}');
  const itsMe = authUser._id === message.senderId;

  // Tailwind flex alignment
  const alignment = itsMe ? "justify-end" : "justify-start";
  const bubbleColor = itsMe ? "bg-blue-500 text-white" : "bg-gray-300 text-white";

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "…";

  return (
    <div className={`flex ${alignment} mb-2 px-2`}>
      <div className={`rounded-lg p-2 max-w-xs ${bubbleColor}`}>
        <p>{message.message}</p>
        <div className="text-xs text-gray-500 text-right">{formattedTime}</div>
      </div>
    </div>
  );
}

export default Message;
*/



import React from "react";

function Message({ message }) {
  // Get logged-in user from localStorage key "user"
  const authUser = JSON.parse(localStorage.getItem("user") || '{}');
  const itsMe = authUser._id === message.senderId;

  // Bootstrap flex alignment
  const alignment = itsMe ? "justify-content-end" : "justify-content-start";
  const bubbleColor = itsMe ? "bg-primary text-white" : "bg-light text-dark";

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "…";

  return (
    <div className={`d-flex ${alignment} mb-2 px-2`}>
      <div className={`p-2 rounded ${bubbleColor}`} style={{ maxWidth: "60%" }}>
        <p className="mb-1">{message.message}</p>
        <div className="text-end text-muted small">{formattedTime}</div>
      </div>
    </div>
  );
}

export default Message;
