import { create } from "zustand";

const useConversation = create((set, get) => ({
  selectedConversation: null,
  messages: {}, // changed from [] to an object storing messages by chat ID

  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

  setMessages: (conversationId, newMessages) => {
    const messages = get().messages;
    set({
      messages: {
        ...messages,
        [conversationId]: newMessages,
      },
    });
  },

  addMessage: (conversationId, message) => {
    const messages = get().messages;
    const existing = messages[conversationId] || [];
    set({
      messages: {
        ...messages,
        [conversationId]: [...existing, message],
      },
    });
  },
}));

export default useConversation;

/*
import { create } from "zustand";

const useConversation = create((set) => ({
  selectedConversation: null,
  messages: [],
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  setMessage: (messages) => set({ messages }),
}));

export default useConversation;
*/