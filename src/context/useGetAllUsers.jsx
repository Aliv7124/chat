import { useEffect, useState } from "react";
import api from "./api";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwt"); // <-- must store token on login
        const currentUser = JSON.parse(localStorage.getItem("user")); // optional
        const response = await api.get("/users/allusers", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // exclude current user on frontend just in case
        const filteredUsers = response.data.filter(
          (user) => user._id !== currentUser?._id
        );

        setAllUsers(filteredUsers);
      } catch (error) {
        console.log("Error in useGetAllUsers:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, []);

  return [allUsers, loading];
}

export default useGetAllUsers;
