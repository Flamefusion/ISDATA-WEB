import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Sun, Moon, LogIn, LogOut, User } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const SettingsPanel = ({ isOpen, onClose, isDarkMode, toggleDarkMode, onLoginClick }) => {
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-1/4 bg-white/90 dark:bg-black/95 backdrop-blur-xl z-50 shadow-2xl dark:shadow-black/50 p-6 border-l border-gray-200 dark:border-gray-700/30"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70"
            >
              <XCircle className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                Dark Mode
              </label>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className="sr-only">Toggle Dark Mode</span>
                <span
                  className={`transform transition-transform ease-in-out duration-200 absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {isDarkMode ? (
                    <Moon className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  )}
                </span>
              </motion.button>
            </div>

            {isLoggedIn ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <User className="w-10 h-10 text-gray-500" />
                  <div>
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-gray-500">Logged In</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 bg-red-500 text-white hover:bg-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onLoginClick();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </motion.button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;