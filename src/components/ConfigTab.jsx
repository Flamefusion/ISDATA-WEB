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

const ConfigTab = ({ 
  config, 
  setConfig, 
  isLoading, 
  connectionStatus, 
  testSheetsConnection, 
  testDbConnection, 
  createSchema, 
  clearDatabase 
}) => {
  const fileInputRef = useRef(null);
  
  const handleBrowseClick = () => fileInputRef.current.click();
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          setConfig(prev => ({ 
            ...prev, 
            serviceAccountFileName: file.name, 
            serviceAccountContent: jsonContent 
          }));
        } catch (error) {
          alert("Invalid JSON file.");
          setConfig(prev => ({ 
            ...prev, 
            serviceAccountFileName: '', 
            serviceAccountContent: '' 
          }));
        }
      };
      reader.readAsText(file);
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Service Account JSON
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={config.serviceAccountFileName} 
                readOnly 
                className="flex-grow w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200" 
                placeholder="Service account JSON file selected..." 
              />
              <input 
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {field === 'vendorDataUrl' ? 'Vendor Data URL' : 
                 field === 'vqcDataUrl' ? 'VQC Data URL' : 'FT Data URL'}
              </label>
              <input 
                type="url" 
                value={config[field]} 
                onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200" 
                placeholder="https://docs.google.com/spreadsheets/..." 
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={testSheetsConnection} 
          disabled={isLoading} 
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
            <span className="text-green-600 font-medium">Sheets connection successful!</span>
          </motion.div>
        )}

        {connectionStatus.sheets === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 flex items-center gap-2"
          >
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600 font-medium">Sheets connection failed. Check console for details.</span>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {item.label}
              </label>
              <input 
                type="text" 
                value={config[item.field]} 
                onChange={(e) => setConfig(prev => ({ ...prev, [item.field]: e.target.value }))} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400 transition-all duration-200" 
                placeholder={item.placeholder} 
              />
            </div>
          ))}
          
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input 
              type="password" 
              value={config.dbPassword} 
              onChange={(e) => setConfig(prev => ({ ...prev, dbPassword: e.target.value }))} 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400 transition-all duration-200" 
              placeholder="Database password" 
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={testDbConnection} 
            disabled={isLoading} 
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
            Test DB Connection
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={createSchema} 
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Create Schema
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={clearDatabase} 
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
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
            <span className="text-green-600 font-medium">Database connection successful!</span>
          </motion.div>
        )}

        {connectionStatus.db === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 flex items-center gap-2"
          >
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600 font-medium">Database connection failed. Check console for details.</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ConfigTab;