import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithPassword } from '../store/slices/authSlice';
import { showAlert } from '../store/slices/uiSlice';
import { Loader } from 'lucide-react';

const Login = ({ onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    dispatch(signInWithPassword({ email, password }))
      .unwrap()
      .then(() => {
        // The onAuthStateChange listener in App.jsx handles closing the modal
        // by updating the session, which makes isLoggedIn true.
        dispatch(showAlert({ message: 'Login successful!', type: 'success' }));
        // No need to call onClose() here, it is handled by the auth state change
      })
      .catch((err) => {
        // The rejected action payload from the thunk is the error message.
        dispatch(showAlert({ message: err, type: 'error' }));
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center w-24"
              type="submit"
              disabled={loading}
            >
              {loading ? <Loader className="animate-spin" /> : 'Sign In'}
            </button>
            <button
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              onClick={onClose}
              type="button"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
          Don't have an account? <button onClick={onSwitchToRegister} className="font-bold text-blue-500 hover:text-blue-800">Register</button>
        </p>
      </div>
    </div>
  );
};

export default Login;