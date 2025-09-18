import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "https://chat-backend-jpy3.onrender.com/api", // ✅ deployed backend
  headers: {
    Authorization: `Bearer ${Cookies.get("jwt") || ""}`, // optional chaining
  },
  withCredentials: true, // keeps cookies if your backend uses them
});

export default api;
