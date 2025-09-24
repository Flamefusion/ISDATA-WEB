// src/components/ConfigTab.jsx - Updated with Real API Integration
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Database, 
  CheckCircle, 
  XCircle, 
  Folder, 
  Loader, 
  Server, 
  RefreshCw 
} from 'lucide-react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateConfig,
  setLoading,
  setConnectionStatus
} from '../store/slices/configSlice';
import { showAlert } from '../store/slices/uiSlice';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const ConfigTab = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.config);
  const isLoading = useSelector((state) => state.config.isLoading);
  const connectionStatus = useSelector((state) => state.config.connectionStatus);
  
  const fileInputRef = useRef(null);
  
  const handleBrowseClick = () => fileInputRef.current.click();
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          dispatch(updateConfig({ 
            serviceAccountFileName: file.name, 
            serviceAccountContent: jsonContent 
          }));
          dispatch(showAlert({ 
            message: "Service account file loaded successfully", 
            type: 'success' 
          }));
        } catch (error) {
          dispatch(showAlert({ 
            message: "Invalid JSON file.", 
            type: 'error' 
          }));
          dispatch(updateConfig({ 
            serviceAccountFileName: '', 
            serviceAccountContent: '' 
          }));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTestSheetsConnection = async () => {
    dispatch(setLoading(true));
    
    try {
      const result = await window.api.testSheetsConnection({
        serviceAccountContent: config.serviceAccountContent,
        vendorDataUrl: config.vendorDataUrl,
        vqcDataUrl: config.vqcDataUrl,
        ftDataUrl: config.ftDataUrl,
      });
      
      if (result.status === 'success') {
        dispatch(setConnectionStatus({ type: 'sheets', status: 'success' }));
        dispatch(showAlert({ 
          message: 'Sheets connection successful!', 
          type: 'success' 
        }));
      } else {
        throw new Error(result.message || 'Connection test failed');
      }
    } catch (error) {
      dispatch(setConnectionStatus({ type: 'sheets', status: 'error' }));
      dispatch(showAlert({ 
        message: `Sheets connection failed: ${error.message}`, 
        type: 'error' 
      }));
      console.error('Sheets connection error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleTestDbConnection = async () => {
    dispatch(setLoading(true));
    
    try {
      const result = await window.api.testDbConnection({
        dbHost: config.dbHost,
        dbPort: config.dbPort,
        dbName: config.dbName,
        dbUser: config.dbUser,
        dbPassword: config.dbPassword,
      });
      
      if (result.status === 'success') {
        dispatch(setConnectionStatus({ type: 'db', status: 'success' }));
        dispatch(showAlert({ 
          message: 'Database connection successful!', 
          type: 'success' 
        }));
      } else {
        throw new Error(result.message || 'Database connection failed');
      }
    } catch (error) {
      dispatch(setConnectionStatus({ type: 'db', status: 'error' }));
      dispatch(showAlert({ 
        message: `Database connection failed: ${error.message}`, 
        type: 'error' 
      }));
      console.error('DB connection error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateSchema = async () => {
    if (connectionStatus.db !== 'success') {
      dispatch(showAlert({ 
        message: 'Please test database connection first', 
        type: 'error' 
      }));
      return;
    }

    dispatch(setLoading(true));
    
    try {
      const result = await window.api.createSchema();
      
      if (result.status === 'success') {
        dispatch(showAlert({ 
          message: 'Schema created successfully!', 
          type: 'success' 
        }));
        console.log('Schema creation logs:', result.logs);
      } else {
        throw new Error(result.message || 'Schema creation failed');
      }
    } catch (error) {
      dispatch(showAlert({ 
        message: `Schema creation failed: ${error.message}`, 
        type: 'error' 
      }));
      console.error('Schema creation error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleClearDatabase = async () => {
    if (connectionStatus.db !== 'success') {
      dispatch(showAlert({ 
        message: 'Please test database connection first', 
        type: 'error' 
      }));
      return;
    }

    const confirmClear = window.confirm(
      'Are you sure you want to clear all data from the database? This action cannot be undone.'
    );
    
    if (!confirmClear) return;

    dispatch(setLoading(true));
    
    try {
      const result = await window.api.clearDatabase();
      
      if (result.status === 'success') {
        dispatch(showAlert({ 
          message: 'Database cleared successfully!', 
          type: 'success' 
        }));
      } else {
        throw new Error(result.message || 'Database clear failed');
      }
    } catch (error) {
      dispatch(showAlert({ 
        message: `Database clear failed: ${error.message}`, 
        type: 'error' 
      }));
      console.error('Database clear error:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <motion.div {...fadeInUp} className="space-y-8">
      {/* Google Sheets Configuration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black rounded-2xl p-8 border border-blue-200/50 dark:border-gray-700/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Google Sheets Configuration
          </h3>
        </div>

        <motion.div variants={staggerContainer} animate="animate" className="space-y-4">
          <motion.div variants={staggerItem} className="space-y-2">
            <label htmlFor="serviceAccountFile" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Service Account JSON
            </label>
            <div className="flex items-center gap-2">
              <input 
                id="serviceAccountFileName"
                name="serviceAccountFileName"
                type="text" 
                value={config.serviceAccountFileName} 
                readOnly 
                className="flex-grow w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200" 
                placeholder="Service account JSON file selected..." 
              />
              <input 
                id="serviceAccountFile"
                name="serviceAccountFile"
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json" 
              />
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={handleBrowseClick} 
                className="px-4 py-3 bg-white/80 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors duration-200 border border-gray-300 dark:border-gray-700/30 flex items-center gap-2"
              >
                <Folder className="w-5 h-5" />
                Browse
              </motion.button>
            </div>
          </motion.div>

          {['vendorDataUrl', 'vqcDataUrl', 'ftDataUrl'].map((field) => (
            <motion.div key={field} variants={staggerItem} className="space-y-2">
              <label htmlFor={field} className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {field === 'vendorDataUrl' ? 'Vendor Data URL' : 
                 field === 'vqcDataUrl' ? 'VQC Data URL' : 'FT Data URL'}
              </label>
              <input 
                id={field}
                name={field}
                type="url" 
                value={config[field]} 
                onChange={(e) => dispatch(updateConfig({ [field]: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200" 
                placeholder="https://docs.google.com/spreadsheets/..." 
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={handleTestSheetsConnection} 
          disabled={isLoading || !config.serviceAccountContent} 
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          Test Sheets Connection
        </motion.button>

        {connectionStatus.sheets === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-600 dark:text-green-400 font-medium">Sheets connection successful!</span>
          </motion.div>
        )}

        {connectionStatus.sheets === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 flex items-center gap-2"
          >
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600 dark:text-red-400 font-medium">Sheets connection failed. Check console for details.</span>
          </motion.div>
        )}
      </motion.div>

      {/* PostgreSQL Configuration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.1 }} 
        className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black rounded-2xl p-8 border border-purple-200/50 dark:border-gray-700/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            PostgreSQL Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { field: 'dbHost', label: 'Host', placeholder: 'localhost' },
            { field: 'dbPort', label: 'Port', placeholder: '5432' },
            { field: 'dbName', label: 'Database Name', placeholder: 'rings_db' },
            { field: 'dbUser', label: 'Username', placeholder: 'postgres' }
          ].map((item) => (
            <div key={item.field} className="space-y-2">
              <label htmlFor={item.field} className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {item.label}
              </label>
              <input 
                id={item.field}
                name={item.field}
                type="text" 
                value={config[item.field]} 
                onChange={(e) => dispatch(updateConfig({ [item.field]: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400 transition-all duration-200" 
                placeholder={item.placeholder} 
              />
            </div>
          ))}
          
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="dbPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input 
              id="dbPassword"
              name="dbPassword"
              type="password" 
              value={config.dbPassword} 
              onChange={(e) => dispatch(updateConfig({ dbPassword: e.target.value }))} 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400 transition-all duration-200" 
              placeholder="Database password" 
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleTestDbConnection} 
            disabled={isLoading} 
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
            Test DB Connection
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleCreateSchema} 
            disabled={connectionStatus.db !== 'success'}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Create Schema
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleClearDatabase} 
            disabled={connectionStatus.db !== 'success'}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            <Database className="w-5 h-5" />
            Clear Database
          </motion.button>
        </div>

        {connectionStatus.db === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-600 dark:text-green-400 font-medium">Database connection successful!</span>
          </motion.div>
        )}

        {connectionStatus.db === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 flex items-center gap-2"
          >
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600 dark:text-red-400 font-medium">Database connection failed. Check console for details.</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ConfigTab;