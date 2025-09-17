import { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import api from "./api.js";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation, messages, addMessage } = useConversation();

  const sendMessages = async (message) => {
    setLoading(true);
    try {
     const res = await api.post(`/messages/send/${selectedConversation._id}`, { message });
       
      addMessage(selectedConversation._id, res.data);
      setLoading(false);
    } catch (error) {
      console.log("Error in send messages", error);
      setLoading(false);
    }
  };

  return { loading, sendMessages };
};

export default useSendMessage;