import React from "react";
import Left from "../home/leftpart/left"
import Chat from "../Chat";
import useConversation from "../zustand/useConversation";

const Home = () => {
  const { selectedConversation } = useConversation();

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r">
        <Left />
      </div>
      <div className="w-3/4">
        {selectedConversation ? <Chat /> : <p className="p-4">Select a user to chat</p>}
      </div>
    </div>
  );
};

export default Home;
