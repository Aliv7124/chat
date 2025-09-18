import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import io from "socket.io-client";

const socketContext = createContext();
export const useSocketContext = () => useContext(socketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [authUser] = useAuth();
useEffect(() => {
  if (authUser?._id) {
    const socketInstance = io("http://localhost:4002", {
      query: { userId: authUser._id }, // ✅ fixed
    });
    setSocket(socketInstance);

    socketInstance.on("getOnlineUsers", (users) => setOnlineUsers(users));
    return () => socketInstance.close();
  }
}, [authUser]);

  return (
    <socketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </socketContext.Provider>
  );
};
