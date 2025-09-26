
/*
import React from "react";

function Message({ message }) {
  const authUser = JSON.parse(localStorage.getItem("user") || '{}');

  // Correct sender check
  const senderId = message.senderId || message.from; // fallback to `from`
  const itsMe = authUser._id === senderId;

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
        <p className="mb-1">{message.text || message.message}</p>
        <div className="text-end text-muted small">{formattedTime}</div>
      </div>
    </div>
  );
}

export default Message;
*/

import React from "react";

function Message({ message }) {
  const itsMe = message.sender === "me";

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
        <p className="mb-1">{message.text || message.message}</p>
        <div className="text-end text-muted small">{formattedTime}</div>
      </div>
    </div>
  );
}

export default Message;
