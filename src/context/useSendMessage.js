import { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import api from "./api.js";
import { useSocketContext } from "./SocketContext.js";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation, addMessage } = useConversation();
  const { socket } = useSocketContext();

  const sendMessages = async (text) => {
    if (!text.trim()) return;

    // build a local temp message
    const tempMessage = {
      _id: Date.now(), // temporary ID
      from: "me",      // or currentUserId if you track it
      to: selectedConversation._id,
      text,
      createdAt: new Date().toISOString(),
      pending: true, // mark as unsynced
    };

    // 1. Optimistic update
    addMessage(selectedConversation._id, tempMessage);

    try {
      setLoading(true);

      // 2. Send to backend
      const res = await api.post(`/messages/send/${selectedConversation._id}`, { message: text });

      // 3. Replace temp with actual saved message
      addMessage(selectedConversation._id, res.data);

      // 4. Emit via socket
      socket.emit("send_message", {
        to: selectedConversation._id,
        from: res.data.from,
        text: res.data.text,
        createdAt: res.data.createdAt,
      });

    } catch (error) {
      console.log("Error in sendMessages", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessages };
};

export default useSendMessage;





/*import { useState } from "react";
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
*/