import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import api from "../context/api";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [authUser, setAuthUser] = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

const onSubmit = async (data) => {
  try {
    const res = await api.post("/users/login", {
      email: data.email,
      password: data.password,
    });

    // Save token and user in localStorage
  localStorage.setItem("auth-token", res.data.token);  // JWT token
localStorage.setItem("user", JSON.stringify(res.data.user)); // user info
setAuthUser(res.data.user);

    toast.success("Login successful");
  } catch (error) {
    toast.error(error.response?.data?.msg || "Invalid Email or Password");
    console.log("Login error:", error.response?.data || error.message);
  }
};



  return (
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 to-slate-900">
      <div className="bg-slate-800 text-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-gray-700 text-black outline-none"
            {...register("email", { required: true })}
          />
          {errors.email && <span className="text-red-500 text-sm">Email required</span>}

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-gray-700 text-black outline-none"
            {...register("password", { required: true })}
          />
          {errors.password && <span className="text-red-500 text-sm">Password required</span>}

          <button
            type="submit"
            className="w-full py-3 mx-2 bg-green-500 bg-danger rounded-lg font-semibold hover:bg-green-600 transition duration-300"
          >
            Login
          </button>
        </form>

        
         <p>New user? <Link to="/signup">Signup</Link></p>
        
      </div>
    </div>
  );
};
 
export default Login;



/*
 <div className="flex h-screen items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="border px-6 py-2 rounded-md w-96 space-y-3">
        <h1 className="text-2xl text-center">ChatApp</h1>
        <input {...register("email", { required: true })} placeholder="Email" />
        {errors.email && <span>Email required</span>}
        <input type="password" {...register("password", { required: true })} placeholder="Password" />
        {errors.password && <span>Password required</span>}
        <button type="submit">Login</button>
        <p>New user? <Link to="/signup">Signup</Link></p>
      </form>
    </div>
  );
};
*/