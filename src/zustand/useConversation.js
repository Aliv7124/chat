
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
