import React, { useEffect,useState} from "react";

import Messages from "./Messages";
import Typesend from "./Typesend";
import useConversation from "../../zustand/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";
import Chatuser from "./Chatuser.jsx";


function Right() {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const [authUser] = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedId = localStorage.getItem("selectedConversationId");
    if (savedId && !selectedConversation) {
      fetch(`/api/users/${savedId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authUser.token}` // Adjust if needed
        }
      })
        .then((res) => res.json())
        .then((user) => {
          if (user && user._id) {
            setSelectedConversation(user);
          }
        })
        .catch((err) => console.error("Error restoring conversation:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authUser, selectedConversation, setSelectedConversation]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100%", backgroundColor: "#050b24" }}>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column text-white flex-grow-1" style={{ height: "100%", backgroundColor: "#050b24" }}>
      {!selectedConversation ? (
        <NoChatSelected authUser={authUser} />
      ) : (
        <>
          <Chatuser />
          <div className="flex-grow-1 overflow-auto">
            <Messages />
          </div>
          <div className="flex-shrink-0">
            <Typesend />
          </div>
        </>
      )}
    </div>
  );
}

export default Right;

const NoChatSelected = ({ authUser }) => {
  return (
    <div className="d-flex flex-column flex-grow-1 justify-content-center align-items-center text-center px-3" style={{ height: "100%" }}>
      <h1 className="text-white mb-2">Welcome {authUser.user.username}</h1>
      <p className="text-gray-300">No chat selected, please start a conversation from your contacts.</p>
    </div>
  );
};