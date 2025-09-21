/*import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    // restore user info from localStorage on refresh
    const user = localStorage.getItem("user");
    if (user) setAuthUser(JSON.parse(user));
  }, []);

  return (
    <AuthContext.Provider value={[authUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
*/


import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api"; // axios instance with { withCredentials:true }

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const restoreUser = async () => {
      // 1️⃣ Try localStorage first
      const stored = localStorage.getItem("user");
      if (stored) {
        setAuthUser(JSON.parse(stored));
        return;
      }

      // 2️⃣ Otherwise, fetch from backend using cookie
      try {
        const res = await api.get("/users/me");
        setAuthUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user)); // sync localStorage
      } catch (err) {
        setAuthUser(null); // not logged in
      }
    };

    restoreUser();
  }, []);

  if (authUser === undefined) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={[authUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
