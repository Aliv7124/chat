
import React from "react";
import Left from "./home/leftpart/left";
import Right from "./home/rightpart/Right";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";

import { Navigate, Route, Routes } from "react-router-dom";

function App() {
  const [authUser] = useAuth();

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "100vh", backgroundColor: "#050b24", overflow: "hidden" }}
    >
      <Routes>
        {/* Home / Chat */}
        <Route
          path="/"
          element={
            authUser ? (
              <>
                {/* Desktop layout */}
                <div className="d-none d-lg-flex flex-grow-1" style={{ height: "100%" }}>
                  <div
                    className="bg-dark text-white p-0"
                    style={{ width: "25%", height: "100%", overflowY: "auto" }}
                  >
                    <Left />
                  </div>

                  <div className="d-flex flex-column flex-grow-1" style={{ height: "100%" }}>
                    <Right />
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="d-lg-none d-flex flex-column flex-grow-1" style={{ height: "100%" }}>
                  <div className="flex-shrink-0">
                    <Left />
                  </div>
                  <div className="flex-grow-1" style={{ overflowY: "auto" }}>
                    <Right />
                  </div>
                </div>
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={authUser ? <Navigate to="/" /> : <Signup />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;