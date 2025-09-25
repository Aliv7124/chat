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

      const cached = messages[selectedConversation._id];
      if (cached) {
        setLocalMessages(cached);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/messages/get/${selectedConversation._id}`, {
          withCredentials: true,
        });
        setMessages(selectedConversation._id, res.data);
        setLocalMessages(res.data);
      } catch (error) {
        console.error("Error fetching messages:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, [selectedConversation, setMessages, messages]);

  return { loading, messages: localMessages };
};

export default useGetMessage;
