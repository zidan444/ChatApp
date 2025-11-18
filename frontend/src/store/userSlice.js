import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../config";

export const searchUsers = createAsyncThunk(
  "users/searchUsers",
  async (query, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Not authenticated");
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/users?search=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return data; // array of users
    } catch (err) {
      return rejectWithValue("Failed to search users");
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    searchResults: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearUserSearch(state) {
      state.searchResults = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserSearch } = userSlice.actions;
export default userSlice.reducer;
