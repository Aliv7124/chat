import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { io } from "socket.io-client";

const SocketContext = createContext();
export const useSocketContext = () => useContext(SocketContext);

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

    // ✅ Use auth instead of query to avoid CORS issues with credentials
    const socketInstance = io(BACKEND_URL, {
      withCredentials: true,
      auth: { userId: authUser._id },
    });

    setSocket(socketInstance);

    socketInstance.on("getOnlineUsers", (users) => setOnlineUsers(users));

    return () => {
      socketInstance.off("getOnlineUsers");
      socketInstance.disconnect();
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
