import axios from "axios";

// ✅ Base API instance
const API = axios.create({
  baseURL: "https://chat-b-7y5f.onrender.com/api", 
});

// 🔹 Attach token to every request (if user logged in)
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default API;
