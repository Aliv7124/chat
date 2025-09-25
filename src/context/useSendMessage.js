
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
