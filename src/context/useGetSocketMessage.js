/*




import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { addMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (newMessage) => {
      const audio = new Audio("/assets/notification.mp3");
      audio.play();

      // Store message under its conversation
      const conversationId = newMessage.to; // backend should send conversation ID
      addMessage(conversationId, newMessage);
    };

    socket.on("receive_message", handleMessage);

    return () => socket.off("receive_message", handleMessage);
  }, [socket, addMessage]);
};

export default useGetSocketMessage;
*/

import { useEffect } from "react";
import { socket } from "../socket.js";
import useConversation from "../zustand/useConversation.js";

const useGetSocketMessage = () => {
  const { addMessage, selectedConversation } = useConversation();

  useEffect(() => {
    const handleMessage = (data) => {
      if (data.conversationId === selectedConversation?._id) {
        addMessage({ ...data.message, sender: "other" });
      }
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [selectedConversation]);

  return null;
};

export default useGetSocketMessage;
