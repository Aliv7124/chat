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
import { useSocketContext } from "./SocketContext.js";
import useConversation from "../zustand/useConversation.js";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { addMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (msg) => {
      if (msg.conversationId) {
        addMessage(msg.conversationId, msg);
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [socket, addMessage]);
};

export default useGetSocketMessage;
