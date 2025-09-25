import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { io } from "socket.io-client";

const socketContext = createContext();
export const useSocketContext = () => useContext(socketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [authUser] = useAuth();

  useEffect(() => {
    if (!authUser?._id) return;

    const BACKEND_URL =
      import.meta.env.MODE === "production"
        ? "https://chat-backend-jpy3.onrender.com"
        : "http://localhost:4002";

    const socketInstance = io(BACKEND_URL, {
      withCredentials: true,
      query: { userId: authUser._id },
    });

    setSocket(socketInstance);

    socketInstance.on("getOnlineUsers", (users) => setOnlineUsers(users));

    return () => {
      socketInstance.off("getOnlineUsers");
      socketInstance.disconnect();
    };
  }, [authUser]);

  return (
    <socketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </socketContext.Provider>
  );
};
