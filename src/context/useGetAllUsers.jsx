import { useEffect, useState } from "react";
import api from "./api";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const currentUser = JSON.parse(localStorage.getItem("user")); // current logged-in user

        const response = await api.get("/users/allusers");
        // exclude current user
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
