import { useEffect, useState } from "react";
import api from "./api";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (!currentUser) return;

        const response = await api.get("/users/allusers");
        const filteredUsers = response.data.filter(
          (user) => user._id !== currentUser._id
        );

        setAllUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  return [allUsers, loading];
}

export default useGetAllUsers;
