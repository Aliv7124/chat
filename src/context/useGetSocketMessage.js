/*
import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { addMessage, selectedConversation } = useConversation();

  useEffect(() => {
    if (!socket || !addMessage || !selectedConversation) return;

    const handleMessage = (data) => {
      if (data.conversationId === selectedConversation._id) {
        addMessage(selectedConversation._id, { ...data.message, sender: "other" });
      }
    };

    socket.on("receiveMessage", handleMessage);

    return () => socket.off("receiveMessage", handleMessage);
  }, [socket, selectedConversation, addMessage]);

  return null;
};

export default useGetSocketMessage;

*/





import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { addMessage, selectedConversation } = useConversation();
  const authUser = JSON.parse(localStorage.getItem("user") || '{}');

  useEffect(() => {
    if (!socket || !addMessage || !selectedConversation) return;

    const handleMessage = (data) => {
      if (data.conversationId === selectedConversation._id) {
        const message = data.message;

        // Determine sender dynamically
        const isMe = message.senderId === authUser._id;
        addMessage(selectedConversation._id, {
          ...message,
          sender: isMe ? "me" : "other",
        });
      }
    };

    socket.on("receiveMessage", handleMessage);
    return () => socket.off("receiveMessage", handleMessage);
  }, [socket, selectedConversation, addMessage, authUser._id]);

  return null;
};

export default useGetSocketMessage;
