// src/store/chatSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../config";

const getAuthConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/chats`,
        getAuthConfig(token)
      );
      return data;
    } catch {
      return rejectWithValue("Failed to fetch chats");
    }
  }
);

export const accessChat = createAsyncThunk(
  "chat/accessChat",
  async (otherUserId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chats/access`,
        { otherUserId },
        getAuthConfig(token)
      );
      return data;
    } catch {
      return rejectWithValue("Failed to access chat");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (chatId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/messages/${chatId}`,
        getAuthConfig(token)
      );
      return { chatId, messages: data };
    } catch {
      return rejectWithValue("Failed to fetch messages");
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ chatId, content }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/messages`,
        { chatId, content },
        getAuthConfig(token)
      );
      return data;
    } catch {
      return rejectWithValue("Failed to send message");
    }
  }
);

export const createGroupChat = createAsyncThunk(
  "chat/createGroupChat",
  async ({ name, users }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chats/group`,
        { name, users },
        getAuthConfig(token)
      );
      return data;
    } catch {
      return rejectWithValue("Failed to create group chat");
    }
  }
);

// ✅ New Thunk to Update Group Members
export const updateGroupMembers = createAsyncThunk(
  "chat/updateGroupMembers",
  async ({ chatId, users }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.put(
        // Assuming the backend endpoint is '/api/chats/group/:chatId' for updates
        `${API_BASE_URL}/api/chats/group/${chatId}`,
        { users }, // Send the new full list of user IDs
        getAuthConfig(token)
      );
      return data; // The updated chat object
    } catch {
      return rejectWithValue("Failed to update group members");
    }
  }
);

export const updateGroupAvatar = createAsyncThunk(
  "chat/updateGroupAvatar",
  async ({ chatId, avatar }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/chats/group/avatar`,
        { chatId, avatar },
        getAuthConfig(token)
      );
      return data;
    } catch {
      return rejectWithValue("Failed to update group avatar");
    }
  }
);

export const addGroupAdmin = createAsyncThunk(
  "chat/addGroupAdmin",
  async ({ chatId, userId }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/chats/group/add-admin`,
        { chatId, userId },
        getAuthConfig(token)
      );
      return data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to add admin"
      );
    }
  }
);

export const renameGroup = createAsyncThunk(
  "chat/renameGroup",
  async ({ chatId, name }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/chats/group/rename`,
        { chatId, name },
        getAuthConfig(token)
      );
      return data;
    } catch {
      return rejectWithValue("Failed to rename group");
    }
  }
);

export const leaveGroup = createAsyncThunk(
  "chat/leaveGroup",
  async (chatId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chats/group/leave`,
        { chatId },
        getAuthConfig(token)
      );
      return { chatId, data };
    } catch {
      return rejectWithValue("Failed to leave group");
    }
  }
);

export const deleteGroup = createAsyncThunk(
  "chat/deleteGroup",
  async (chatId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.delete(
        `${API_BASE_URL}/api/chats/group/${chatId}`,
        getAuthConfig(token)
      );
      return { chatId, data };
    } catch {
      return rejectWithValue("Failed to delete group");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    selectedChat: null,
    messages: [],
    loadingChats: false,
    loadingMessages: false,
    sendingMessage: false,
    error: null,
  },
  reducers: {
    setSelectedChat(state, action) {
      state.selectedChat = action.payload;
      state.messages = [];
    },
    addIncomingMessage(state, action) {
      const msg = action.payload;
      if (
        state.selectedChat &&
        msg.chat &&
        msg.chat._id === state.selectedChat._id
      ) {
        state.messages.push(msg);
      }

      const idx = state.chats.findIndex((c) => c._id === msg.chat._id);
      if (idx !== -1) {
        state.chats[idx].latestMessage = msg;
      } else {
        state.chats.unshift(msg.chat);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loadingChats = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loadingChats = false;
        state.error = action.payload;
      })

      .addCase(accessChat.fulfilled, (state, action) => {
        const chat = action.payload;
        const exist = state.chats.find((c) => c._id === chat._id);
        if (!exist) state.chats.unshift(chat);
        state.selectedChat = chat;
      })

      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.messages = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload;
      })

      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        state.messages.push(action.payload);
        const idx = state.chats.findIndex(
          (c) => c._id === action.payload.chat._id
        );
        if (idx !== -1) {
          state.chats[idx].latestMessage = action.payload;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        const chat = action.payload;
        const exist = state.chats.find((c) => c._id === chat._id);
        if (!exist) state.chats.unshift(chat);
        state.selectedChat = chat;
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(renameGroup.fulfilled, (state, action) => {
        const updatedChat = action.payload;
        const idx = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (idx !== -1) state.chats[idx] = updatedChat;
        if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      .addCase(renameGroup.rejected, (state, action) => {
        state.error = action.payload;
      })
      // ✅ CORRECTED updateGroupMembers REDUCERS
      .addCase(updateGroupMembers.pending, (state) => {
        state.error = null; // You might want a specific loading state here, e.g., state.updatingGroup = true;
      })
      .addCase(updateGroupMembers.fulfilled, (state, action) => {
        const updatedChat = action.payload; // API returns the full updated chat object
        // Find the index of the chat in the main chats array
        const idx = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (idx !== -1) {
          state.chats[idx] = updatedChat; // Update chat in the list
        }

        // Update selectedChat if it's the one that was updated
        if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      .addCase(updateGroupMembers.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder
      .addCase(updateGroupAvatar.fulfilled, (state, action) => {
        const updatedChat = action.payload;
        const idx = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (idx !== -1) state.chats[idx] = updatedChat;
        if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      .addCase(updateGroupAvatar.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addGroupAdmin.fulfilled, (state, action) => {
        const updatedChat = action.payload;
        const idx = state.chats.findIndex((c) => c._id === updatedChat._id);
        if (idx !== -1) state.chats[idx] = updatedChat;
        if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
          state.selectedChat = updatedChat;
        }
      })
      .addCase(addGroupAdmin.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        const { chatId, data } = action.payload;
        // if server deleted group (no members), remove entirely
        if (data && data.chatId && data.message) {
          state.chats = state.chats.filter((c) => c._id !== chatId);
          if (state.selectedChat && state.selectedChat._id === chatId) {
            state.selectedChat = null;
            state.messages = [];
          }
        } else {
          // server returned updated chat but current user has left; remove from list
          state.chats = state.chats.filter((c) => c._id !== chatId);
          if (state.selectedChat && state.selectedChat._id === chatId) {
            state.selectedChat = null;
            state.messages = [];
          }
        }
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        state.chats = state.chats.filter((c) => c._id !== chatId);
        if (state.selectedChat && state.selectedChat._id === chatId) {
          state.selectedChat = null;
          state.messages = [];
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// ✅ CORRECTED exports. The thunk is exported directly, not from slice.actions
export const { setSelectedChat, addIncomingMessage } = chatSlice.actions;
export default chatSlice.reducer;
