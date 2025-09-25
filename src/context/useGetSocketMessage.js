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
