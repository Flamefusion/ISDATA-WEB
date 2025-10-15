import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader, RefreshCw } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { startMigration } from '../store/thunks/migrationThunks';
import { fetchMigrationHistory } from '../store/thunks/migrationHistoryThunks';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const MigrationHistory = () => {
  const dispatch = useDispatch();
  const { history, loading, error } = useSelector((state) => state.migrationHistory);

  useEffect(() => {
    dispatch(fetchMigrationHistory());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchMigrationHistory());
  };

  return (
    <motion.div {...fadeInUp} className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Migration History</h3>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      <div className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50">
        {loading && <p>Loading history...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inserted</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batches</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black/90 divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((item) => (
                  <motion.tr key={item.id} {...fadeInUp}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(item.migration_time).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.inserted_qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.updated_qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.batches_sent}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MigrationTab = () => {
  const dispatch = useDispatch();
  const { migrationProgress, migrationLog, isRunning, error } = useSelector((state) => state.migration);

  const handleStartMigration = () => {
    dispatch(startMigration());
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
                className={`text-xs mb-1 font-mono ${
                  log.message.includes('ERROR') ? 'text-red-600 dark:text-red-400' :
                  log.message.includes('successfully') ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}
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

      {migrationLog.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30"
        >
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Migration Process
          </h4>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <strong>Connect to Google Sheets:</strong> The system will authenticate using your service account credentials and connect to the configured Google Sheets.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <strong>Load Data:</strong> Vendor data, VQC data, and FT data will be loaded in parallel from their respective sheets.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <strong>Merge & Process:</strong> All data sources will be merged intelligently, handling duplicates and data validation.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <strong>Database Update:</strong> Existing records will be updated and new records will be inserted using high-performance bulk operations.
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <MigrationHistory />
    </motion.div>
  );
};

export default MigrationTab;
