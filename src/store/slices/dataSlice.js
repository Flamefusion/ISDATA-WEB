// src/store/slices/dataSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { loadPreviewData } from '../thunks/dataThunks';

const initialState = {
  previewData: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalRecords: 0,
  totalPages: 1,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearData: (state) => {
      state.previewData = [];
      state.error = null;
      state.currentPage = 1;
      state.totalRecords = 0;
      state.totalPages = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPreviewData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPreviewData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.previewData = action.payload.data;
        state.totalRecords = action.payload.total;
        state.totalPages = Math.ceil(action.payload.total / 200);
        if (action.meta.arg) {
          state.currentPage = action.meta.arg;
        }
      })
      .addCase(loadPreviewData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPage, setError, clearData } = dataSlice.actions;
export default dataSlice.reducer;
