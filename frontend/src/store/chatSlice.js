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
      const { data } = await axios.get(`${API_BASE_URL}/api/chats`, getAuthConfig(token));
      return data;
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      return rejectWithValue("Failed to send message");
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
      });
  },
});

export const { setSelectedChat, addIncomingMessage } = chatSlice.actions;
export default chatSlice.reducer;
