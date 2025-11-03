import React, { createContext, useState, useEffect } from "react";
import API from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ✅ Signup with optional avatar upload
  const signup = async (name, email, password, avatarFile) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await API.post("/auth/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUser = { ...res.data.user, token: res.data.token };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  // ✅ Login user
  const login = async (email, password) => {
    try {
      const res = await API.post("/auth/login", { email, password });
      const loggedInUser = { ...res.data.user, token: res.data.token };
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // ✅ Logout user
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // ✅ Keep user if token exists, otherwise clear
  useEffect(() => {
    if (user && !user.token) {
      logout();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
