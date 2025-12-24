
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoginSignup from "../components/LoginSignup";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  // Show login/signup when not authenticated
  return <LoginSignup />;
};

export default Home;
/*


import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoginSignup from "../components/LoginSignup";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/chat");
  }, [user, navigate]);

  return (
    <div
      className="d-flex align-items-center justify-content-center bg-light vh-100"
      style={{
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      }}
    >
      <div className="card shadow-lg p-4" style={{ width: "400px", border: "none", borderRadius: "1rem" }}>
        <div className="text-center mb-3">
          <i className="bi bi-chat-dots-fill text-primary" style={{ fontSize: "2.5rem" }}></i>
          <h4 className="mt-2 fw-semibold">Welcome to ChatConnect</h4>
          <p className="text-muted small">Login or create an account to start chatting</p>
        </div>

        <LoginSignup />
      </div>
    </div>
  );
};

export default Home;


<small
  className="d-block text-end text-muted"
  style={{ fontSize: "0.75rem" }}
>
  {msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).toLowerCase()
    : ""}
</small>

*/
