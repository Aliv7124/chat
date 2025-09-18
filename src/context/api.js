import axios from "axios";

const token = localStorage.getItem("jwt"); // read stored JWT

const api = axios.create({
  baseURL: "https://chat-backend-jpy3.onrender.com/api", // deployed backend
  headers: {
    Authorization: `Bearer ${token || ""}`, // send JWT
  },
  withCredentials: true,
});

export default api;
