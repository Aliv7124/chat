import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:4002/api",
  headers: {
    Authorization: `Bearer ${Cookies.get("jwt")}`,
  },
  withCredentials: true,
});

export default api;
