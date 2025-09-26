/*
import { useState } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation";
import api from "./api";

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
*/

import { useState } from "react";
import api from "./api.js";
import useConversation from "../zustand/useConversation.js";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation, addMessage } = useConversation();

  const sendMessage = async (message) => {
    if (!selectedConversation) return;
    setLoading(true);
    try {
      // send message to backend
      const res = await api.post(`/messages/send/${selectedConversation._id}`, { message });

      // backend should return the saved message object with _id
      const newMessage = res.data;

      // ✅ optimistic update (avoid duplicates)
      addMessage(selectedConversation._id, newMessage);
    } catch (error) {
      console.error("Send error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessage };
};

export default useSendMessage;
