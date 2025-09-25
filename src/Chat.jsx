import React, { useState, useEffect, useRef } from "react";
import useGetMessage from "./context/useGetMessage";
import useGetSocketMessage from "./context/useGetSocketMessage";
import useSendMessage from "./context/useSendMessage";
import ChatUser from "./home/rightpart/Chatuser";
import Message from "./home/rightpart/Message";
import useConversation from "./zustand/useConversation";

const Chat = () => {
  const [text, setText] = useState("");
  const { messages = [] } = useGetMessage(); // always array
  useGetSocketMessage(); // listens for incoming messages
  const { sendMessage } = useSendMessage(); // ✅ corrected
  const { selectedConversation } = useConversation();
  const messagesEndRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !selectedConversation) return;
    try {
      await sendMessage(text); // ✅ corrected
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Chat users list */}
      <ChatUser />

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-3">
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg, index) => (
            <Message key={msg._id || index} message={msg} />
          ))
        ) : (
          <div className="text-center text-gray-400 mt-5">
            No messages yet
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input and send button */}
      <div className="p-3 flex border-t border-gray-700">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded p-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={`Message to ${selectedConversation?.fullname || "User"}`}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="ml-2 px-4 bg-green-500 rounded text-white hover:bg-green-600 duration-200"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
