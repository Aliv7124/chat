
import React from "react";
import Left from "./home/leftpart/left";
import Right from "./home/rightpart/Right";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";
import useConversation from "./zustand/useConversation";

import { Navigate, Route, Routes } from "react-router-dom";

function App() {
  const [authUser] = useAuth();
 const { selectedConversation, setSelectedConversation } = useConversation();
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

                 {/* ✅ Mobile layout */}
                <div
                  className="d-lg-none d-flex flex-column flex-grow-1"
                  style={{ height: "100%" }}
                >
                  {selectedConversation ? (
                    // Chat window
                    <div className="flex-grow-1 d-flex flex-column">
                      <div className="flex-shrink-0 bg-primary text-white p-2 d-flex align-items-center">
                        <button
                          className="btn btn-light btn-sm me-2"
                          onClick={() => setSelectedConversation(null)} // go back
                        >
                          ←
                        </button>
                        <span>{selectedConversation.username}</span>
                      </div>
                      <div className="flex-grow-1 overflow-auto">
                        <Right />
                      </div>
                    </div>
                  ) : (
                    // Friends list
                    <div className="flex-grow-1">
                      <Left />
                    </div>
                  )}
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