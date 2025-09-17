import React, { useState } from "react";
import api from "../../context/api";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

function Logout() {
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await api.post("users/logout");
      localStorage.removeItem("ChatApp");
      Cookies.remove("jwt");
      setLoading(false);
      toast.success("Logged out successfully");
      window.location.reload();
    } catch (error) {
      console.log("Error in Logout", error);
      toast.error("Error in logging out");
    }
  };
  return (
    <>
      <hr />
      <div className=" h-[10vh] bg-transparent">
        <div>
        <button
  className="bg-danger hover:bg-slate-700 duration-300 cursor-pointer rounded-full p-2 ml-2 mt-1"
  onClick={handleLogout}
>
  Logout
</button>
        </div>
      </div>
    </>
  );
}

export default Logout;