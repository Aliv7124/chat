/*
import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { addMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (newMessage) => {
      const audio = new Audio("/assets/notification.mp3");
      audio.play();

      // Store message in its conversation, no matter which one is open
      addMessage(newMessage.from, newMessage);
    });

    return () => socket.off("receive_message");
  }, [socket, addMessage]);
};

export default useGetSocketMessage;
*/



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
