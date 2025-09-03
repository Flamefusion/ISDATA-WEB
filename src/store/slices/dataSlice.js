// src/store/slices/dataSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  previewData: [],
  isLoading: false,
  error: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setPreviewData: (state, action) => {
      state.previewData = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearData: (state) => {
      state.previewData = [];
      state.error = null;
    },
    loadPreviewData: (state) => {
      state.isLoading = true;
      state.error = null;
    },
  },
});

export const { setPreviewData, setLoading, setError, clearData, loadPreviewData } = dataSlice.actions;
export default dataSlice.reducer;