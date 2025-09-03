import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setMigrationProgress, 
  addMigrationLog, 
  setMigrationRunning,
  setMigrationError,
  startMigration as startMigrationAction 
} from '../store/slices/migrationSlice';
import { showAlert } from '../store/slices/uiSlice';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const MigrationTab = () => {
  const dispatch = useDispatch();
  const { migrationProgress, migrationLog, isRunning, error } = useSelector((state) => state.migration);

  const handleStartMigration = async () => {
    dispatch(startMigrationAction());

    try {
      // Simulate migration process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        dispatch(setMigrationProgress(i));
        dispatch(addMigrationLog(`Migration progress: ${i}%`));
        
        // Add some realistic migration steps
        if (i === 20) dispatch(addMigrationLog('Connecting to Google Sheets...'));
        if (i === 40) dispatch(addMigrationLog('Reading vendor data...'));
        if (i === 60) dispatch(addMigrationLog('Processing VQC data...'));
        if (i === 80) dispatch(addMigrationLog('Processing FT data...'));
        if (i === 100) dispatch(addMigrationLog('Migration completed successfully!'));
      }

      dispatch(setMigrationRunning(false));
      dispatch(showAlert({ 
        message: 'Migration completed successfully!', 
        type: 'success' 
      }));
    } catch (err) {
      dispatch(setMigrationError(err.message));
      dispatch(addMigrationLog(`Migration failed: ${err.message}`));
      dispatch(setMigrationRunning(false));
      dispatch(showAlert({ 
        message: 'Migration failed. Check logs for details.', 
        type: 'error' 
      }));
    }
  };

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Data Migration</h2>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={handleStartMigration} 
          disabled={isRunning} 
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isRunning ? 
            <Loader className="w-5 h-5 animate-spin" /> : 
            <Play className="w-5 h-5" />
          }
          {isRunning ? 'Migration Running...' : 'Start Migration'}
        </motion.button>
      </div>

      {migrationLog.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
        >
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Migration Progress
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Math.round(migrationProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full" 
                initial={{ width: 0 }} 
                animate={{ width: `${migrationProgress}%` }} 
                transition={{ duration: 0.5 }} 
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-black rounded-lg p-4 max-h-64 overflow-auto">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Migration Log:
            </h4>
            {migrationLog.map((log, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-mono"
              >
                <span className="text-blue-500">[{log.timestamp}]</span> {log.message}
              </motion.div>
            ))}
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-lg"
            >
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                Error: {error}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MigrationTab;