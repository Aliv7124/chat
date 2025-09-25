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
  const { socket } = useSocketContext(); // ✅ get socket from context
  const { addMessage, selectedConversation } = useConversation();

  useEffect(() => {
    if (!socket) return; // wait until socket is initialized

    const handleMessage = (data) => {
      if (data.conversationId === selectedConversation?._id) {
        addMessage({ ...data.message, sender: "other" });
      }
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [socket, selectedConversation]); // ✅ add socket as dependency

  return null;
};

export default useGetSocketMessage;
