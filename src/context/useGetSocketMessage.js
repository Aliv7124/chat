/* import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { messages, setMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", (newMessage) => {
      const audio = new Audio("/assets/notification.mp3");
      audio.play();
      setMessage([...messages, newMessage]);
    });
    return () => socket.off("newMessage");
  }, [socket, messages]);
};

export default useGetSocketMessage;
*/



import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { selectedConversation, addMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (newMessage) => {
      const audio = new Audio("/assets/notification.mp3");
      audio.play();

      if (selectedConversation && newMessage.from === selectedConversation._id) {
        // add message only to the active conversation
        addMessage(selectedConversation._id, newMessage);
      }
    });

    return () => socket.off("receive_message");
  }, [socket, selectedConversation, addMessage]);
};

export default useGetSocketMessage;
