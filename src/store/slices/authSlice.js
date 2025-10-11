import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

// Thunks
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return rejectWithValue(error.message);
    // By default, Supabase sends a confirmation email. The user is not logged in yet.
    return data.user;
  }
);

export const signInWithPassword = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return rejectWithValue(error.message);
    return data; // Contains session and user
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    const { error } = await supabase.auth.signOut();
    if (error) return rejectWithValue(error.message);
    return null;
  }
);

const initialState = {
  session: null,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer to be called by the onAuthStateChange listener
    setSession: (state, action) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.loading = false;
      state.error = null;
    },
    setAuthLoading: (state, action) => {
        state.loading = action.payload;
    },
    setAuthError: (state, action) => {
        state.error = action.payload;
        state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signInWithPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload.session;
        state.user = action.payload.user;
      })
      .addCase(signInWithPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        // NOTE: User is created but not logged in until email confirmation by default.
        // You might want to show a message to the user in the UI.
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.session = null;
        state.user = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { setSession, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;