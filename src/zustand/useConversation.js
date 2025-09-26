/* import { create } from "zustand";

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

  // ✅ Set new conversation and clear old messages immediately
  setSelectedConversation: (conversation) => {
    set({
      selectedConversation: conversation,
      messages: conversation ? { [conversation._id]: [] } : {}, // clear old msgs
    });
  },

  // ✅ Replace all messages for a conversation
  setMessages: (conversationId, newMessages) => {
    if (!conversationId) return;
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: newMessages,
      },
    }));
  },

  // ✅ Add single message without overwriting the entire array
  addMessage: (conversationId, message) => {
    if (!conversationId) return;
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // prevent duplicates
      if (existing.some((m) => m._id === message._id)) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    });
  },
}));

export default useConversation;
