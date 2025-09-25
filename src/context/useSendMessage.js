/*
import { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import api from "./api.js";
import { useSocketContext } from "./SocketContext";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation, addMessage } = useConversation();
  const { socket } = useSocketContext();
  const authUser = JSON.parse(localStorage.getItem("user") || '{}'); // get current user

  const sendMessages = async (text) => {
    if (!text.trim()) return;

    // Temporary local message
    const tempMessage = {
      _id: Date.now(),
      senderId: authUser._id,  // use actual logged-in user ID
      to: selectedConversation._id,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // 1️⃣ Optimistic update
    addMessage(selectedConversation._id, tempMessage);

    try {
      setLoading(true);

      // 2️⃣ Send to backend
      const res = await api.post(
        `/messages/send/${selectedConversation._id}`,
        { message: text },
        { withCredentials: true } // ensure auth cookies are sent
      );

      // 3️⃣ Replace temp with actual saved message
      const savedMessage = {
        ...res.data,
        senderId: res.data.from, // map backend "from" to "senderId"
      };
      addMessage(selectedConversation._id, savedMessage);

      // 4️⃣ Emit via socket
      socket?.emit("send_message", {
        to: selectedConversation._id,
        senderId: savedMessage.senderId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      });

    } catch (error) {
      console.error("Error in sendMessages:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessages };
};

export default useSendMessage;



*/

import { useState } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";
import api from "./api.js";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { socket } = useSocketContext();
  const { selectedConversation, addMessage } = useConversation();

  const sendMessage = async (text) => {
    if (!text.trim() || !socket || !selectedConversation) return;

    const tempMessage = {
      _id: Date.now(),
      sender: "me",
      message: text,
      createdAt: new Date().toISOString(),
    };

    addMessage(selectedConversation._id, tempMessage);

    setLoading(true);
    try {
      const res = await api.post(
        `/messages/send/${selectedConversation._id}`,
        { message: text }
      );
      const savedMessage = res.data;

      addMessage(selectedConversation._id, savedMessage, true);

      socket.emit("sendMessage", {
        conversationId: selectedConversation._id,
        message: savedMessage,
      });
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendMessage;
