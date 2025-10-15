import { createSlice } from '@reduxjs/toolkit';
import { fetchMigrationHistory } from '../thunks/migrationHistoryThunks';

const initialState = {
  history: [],
  loading: false,
  error: null,
};

const migrationHistorySlice = createSlice({
  name: 'migrationHistory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMigrationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMigrationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchMigrationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default migrationHistorySlice.reducer;
