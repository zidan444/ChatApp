// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import chatReducer from "./chatSlice";
import userReducer  from  "./userSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    users : userReducer,
  },
});

export default store;
