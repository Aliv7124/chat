import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-backend-jpy3.onrender.com/api",
  withCredentials: true,
});

// Add a request interceptor to always include the latest JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
