import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchHomeSummary = createAsyncThunk(
  'home/fetchSummary',
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const { session } = getState().auth;
      if (!session || !session.access_token) {
        return rejectWithValue('Authentication token is missing');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        params: { startDate, endDate },
      };

      const response = await axios.get('http://localhost:5000/api/home/summary', config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);