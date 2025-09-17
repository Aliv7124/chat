import React, { useEffect, useRef } from "react";
import Message from "./Message.jsx";
import useGetMessage from "../../context/useGetMessage.js";
import Loading from "../../components/Loading.jsx";
import useGetSocketMessage from "../../context/useGetSocketMessage.js";
import useConversation from "../../zustand/useConversation"

function Messages() {
  const { selectedConversation, messages } = useConversation();
  const { loading, messages: fetchedMessages } = useGetMessage();
  const { addMessage, setMessages } = useConversation();
  useGetSocketMessage(); // listing incoming messages

  const lastMsgRef = useRef();

  useEffect(() => {
    if (selectedConversation && fetchedMessages) {
      setMessages(selectedConversation._id, fetchedMessages);
    }
  }, [selectedConversation, fetchedMessages, setMessages]);

  const chatMessages = selectedConversation
    ? messages[selectedConversation._id] || []
    : [];

  useEffect(() => {
    setTimeout(() => {
      if (lastMsgRef.current) {
        lastMsgRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, [chatMessages]);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ minHeight: "calc(92vh - 8vh)" }}
    >
      {loading ? (
        <Loading />
      ) : chatMessages.length > 0 ? (
        chatMessages.map((message, index) => (
          <div
            key={message._id || index}
            ref={index === chatMessages.length - 1 ? lastMsgRef : null}
          >
            <Message message={message} />
          </div>
        ))
      ) : (
        <div className="text-center mt-[20%]">
          <h3 className="text-white">{selectedConversation?.username}</h3>
          <p className="text-gray-300">Say! Hi to start the conversation</p>
        </div>
      )}
    </div>
  );
}

export default Messages;