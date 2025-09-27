import { createSlice } from '@reduxjs/toolkit';
import { fetchHomeSummary } from '../thunks/homeThunks';

const initialState = {
  loading: false,
  error: null,
  data: {},
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHomeSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default homeSlice.reducer;