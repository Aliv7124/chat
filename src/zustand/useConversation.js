/*
import { create } from "zustand";

const useConversation = create((set, get) => ({
  selectedConversation: null,
  messages: {},

  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),

  setMessages: (conversationId, newMessages) => {
    const messages = get().messages;
    set({
      messages: {
        ...messages,
        [conversationId]: newMessages,
      },
    });
  },

  addMessage: (conversationId, message, replace = false) => {
    if (!conversationId) return; // guard against undefined
    const messages = get().messages;
    const existing = messages[conversationId] || [];

    set({
      messages: {
        ...messages,
        [conversationId]: replace
          ? existing.map((m) => (m._id === message._id ? message : m))
          : [...existing, message],
      },
    });
  },
}));

export default useConversation;
*/

import { create } from "zustand";

const useConversation = create((set, get) => ({
  selectedConversation: null,
  messages: {},

  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation });
  },

  setMessages: (conversationId, newMessages) => {
    const authUser = JSON.parse(localStorage.getItem("user") || '{}');

    // Normalize sender field
    const normalized = newMessages.map((msg) => ({
      ...msg,
      sender: msg.senderId === authUser._id ? "me" : "other",
    }));

    const messages = get().messages;
    set({
      messages: {
        ...messages,
        [conversationId]: normalized,
      },
    });
  },

  addMessage: (conversationId, message, replace = false) => {
    if (!conversationId) return; // guard against undefined
    const authUser = JSON.parse(localStorage.getItem("user") || '{}');

    // Normalize sender
    const msgWithSender = {
      ...message,
      sender: message.senderId === authUser._id ? "me" : "other",
    };

    const messages = get().messages;
    const existing = messages[conversationId] || [];

    set({
      messages: {
        ...messages,
        [conversationId]: replace
          ? existing.map((m) => (m._id === msgWithSender._id ? msgWithSender : m))
          : [...existing, msgWithSender],
      },
    });
  },
}));

export default useConversation;
