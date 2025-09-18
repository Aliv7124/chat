import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-backend-jpy3.onrender.com/api",
  withCredentials: true,
});

// Attach auth token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
