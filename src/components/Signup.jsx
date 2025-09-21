import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import api from "../context/api";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Signup = () => {
const onSubmit = async (data) => {
  try {
    const res = await api.post(
      "/users/signup",
      {
        username: data.username,
        email: data.email,
        password: data.password,
      },
      { withCredentials: true } // ✅ ensures JWT cookie is set
    );

    // Use the same key as login + AuthProvider expects
    localStorage.setItem("user", JSON.stringify(res.data.user)); 
    setAuthUser(res.data.user);

    toast.success("Signup successful");
    navigate("/"); // redirect to home after signup
  } catch (error) {
    toast.error(error.response?.data?.error || "Email already exists");
    console.log("Error response:", error.response?.data || error.message);
  }
};

  return (
    <div className="flex h-screen items-center justify-center">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="border px-6 py-4 rounded-md w-96 space-y-3"
      >
        <h1 className="text-2xl text-center text-white">ChatApp</h1>
        
        <input 
          {...register("username", { required: true })} 
          placeholder="Username" 
          className="input-field w-full border p-2 rounded"
        />
        {errors.username && <span className="text-red-500">Username required</span>}
        
        <input 
          {...register("email", { required: true })} 
          placeholder="Email" 
          className="input-field w-full border p-2 rounded"
        />
        {errors.email && <span className="text-red-500">Email required</span>}
        
        <input 
          type="password" 
          {...register("password", { required: true })} 
          placeholder="Password" 
          className="input-field w-full border p-2 rounded"
        />
        {errors.password && <span className="text-red-500">Password required</span>}
        
        <button type="submit" className="btn-submit bg-danger w-full bg-blue-500 text-white py-2 rounded">
          Signup
        </button>
        
        <p className="text-center  text-white">
          Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
