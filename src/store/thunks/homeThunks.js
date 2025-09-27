import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchHomeSummary = createAsyncThunk(
  'home/fetchSummary',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/home/summary?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);