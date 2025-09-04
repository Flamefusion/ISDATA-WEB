// src/App.jsx - COMPLETE VERSION with all tabs
import React, { useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Database, FileText, Search, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';

import { store } from './store/store';
import {
  toggleSettingsPanel,
  closeSettingsPanel,
  toggleDarkMode,
  hideAlert,
} from './store/slices/uiSlice';

// Components
import ConfigTab from './components/ConfigTab';
import MigrationTab from './components/MigrationTab';
import PreviewTab from './components/PreviewTab';
import ReportTab from './components/ReportTab';
import SearchTab from './components/SearchTab';
import RejectionTrendsTab from './components/RejectionTrendsTab';
import SettingsPanel from './components/SettingsPanel';
import CustomAlert from './components/CustomAlert';

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isDarkMode, isSettingsPanelOpen, customAlert } = useSelector((state) => state.ui);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Tab configuration
  const tabs = [
    { id: 'config', path: '/', label: 'Configuration', icon: Database, component: ConfigTab },
    { id: 'migration', path: '/migration', label: 'Migration', icon: RefreshCw, component: MigrationTab },
    { id: 'preview', path: '/preview', label: 'Preview', icon: BarChart3, component: PreviewTab },
    { id: 'report', path: '/report', label: 'Report', icon: FileText, component: ReportTab },
    { id: 'search', path: '/search', label: 'Search', icon: Search, component: SearchTab },
    { id: 'rejectionTrends', path: '/rejection-trends', label: 'Rejection Trends', icon: TrendingDown, component: RejectionTrendsTab },
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-900'
    }`}>
      {/* Alert System */}
      <AnimatePresence>
        {customAlert.show && (
          <CustomAlert 
            message={customAlert.message} 
            type={customAlert.type} 
            onClose={() => dispatch(hideAlert())} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Rings Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Production Data Management System
                </p>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={() => dispatch(toggleSettingsPanel())} 
              className="p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-200 border border-white/10 dark:border-gray-700/30"
            >
              <Settings className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <motion.nav 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }} 
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 p-2 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              
              return (
                <Link to={tab.path} key={tab.id}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.nav>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { 
                  when: "beforeChildren",
                  staggerChildren: 0.1 
                }
              },
              hidden: { 
                opacity: 0, 
                y: 20,
                transition: { 
                  when: "afterChildren" 
                }
              },
            }}
          >
            <Routes location={location}>
              {tabs.map(tab => (
                <Route key={tab.id} path={tab.path} element={<tab.component />} />
              ))}
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => dispatch(closeSettingsPanel())}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => dispatch(toggleDarkMode())}
      />
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
