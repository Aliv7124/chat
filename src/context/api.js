import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "production"
      ? "https://chat-backend-jpy3.onrender.com/api"
      : "http://localhost:4002/api",
  withCredentials: true, // ✅ important for cookies
});

export default api;
