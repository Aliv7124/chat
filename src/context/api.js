import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-backend-jpy3.onrender.com/api",
  withCredentials: true, // ✅ send/receive cookies
});

export default api;
