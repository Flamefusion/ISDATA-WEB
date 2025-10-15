import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

export const fetchMigrationHistory = createAsyncThunk(
  'migrationHistory/fetchMigrationHistory',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.rpc('get_migration_history_as_json');

      if (error) {
        return rejectWithValue(error.message);
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
