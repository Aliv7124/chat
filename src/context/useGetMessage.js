import { useState, useEffect } from "react";
import useConversation from "../zustand/useConversation.js";
import api from "./api.js";

const useGetMessage = () => {
  const { selectedConversation, setMessages, messages } = useConversation();
  const [loading, setLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);

  useEffect(() => {
    const getMessages = async () => {
      if (!selectedConversation) return;

      const existing = messages[selectedConversation._id];
      if (existing) {
        setLocalMessages(existing);
        return; // already cached, skip fetching
      }

      setLoading(true);
      try {
       const res = await api.get(`/messages/get/${selectedConversation._id}`);
        setMessages(selectedConversation._id, res.data);
        setLocalMessages(res.data);
      } catch (error) {
        console.error("Error in getting messages", error);
      } finally {
        setLoading(false);
      }
    };
    getMessages();
  }, [selectedConversation, setMessages, messages]);

  return { loading, messages: localMessages };
};

export default useGetMessage;
