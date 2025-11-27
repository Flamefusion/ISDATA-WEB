import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader, RefreshCw, XCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { startMigration } from '../store/thunks/migrationThunks';
import { startInventoryMigration } from '../store/thunks/inventoryMigrationThunks';
import { fetchMigrationHistory } from '../store/thunks/migrationHistoryThunks';
import ConfirmationModal from './ConfirmationModal'; // Import the modal

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const LogModal = ({ log, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg w-3/4 h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Migration Log</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-gray-50 dark:bg-black rounded-lg p-4 flex-grow overflow-auto">
          <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {log}
          </pre>
        </div>
      </div>
    </div>
  );
};

const MigrationHistory = () => {
  const dispatch = useDispatch();
  const { history, loading, error } = useSelector((state) => state.migrationHistory);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    dispatch(fetchMigrationHistory());
  }, [dispatch]);

  const handleViewLog = (log) => {
    setSelectedLog(log);
  };

  const closeModal = () => {
    setSelectedLog(null);
  };


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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inserted</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batches</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Log</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black/90 divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((item) => (
                  <motion.tr key={item.id} {...fadeInUp}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(item.migration_time).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.user_name || item.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.migration_type || 'main'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.inserted_qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.updated_qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.batches_sent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleViewLog(item.log)}
                        className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                      >
                        View Log
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedLog && <LogModal log={selectedLog} onClose={closeModal} />}
    </motion.div>
  );
};

const MigrationTab = () => {
  const dispatch = useDispatch();
  const { migrationProgress, migrationLog, isRunning, error } = useSelector((state) => state.migration);
  const { inventoryMigrationProgress, inventoryMigrationLog, isInventoryMigrationRunning, inventoryMigrationError } = useSelector((state) => state.inventoryMigration);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartMigration = () => {
    setIsModalOpen(true);
  };

  const handleConfirmMigration = (includeHistoricalData) => {
    dispatch(startMigration({ includeHistoricalData }));
  };

  const handleStartInventoryMigration = () => {
    dispatch(startInventoryMigration());
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmMigration}
        title="Include Historical Data?"
      >
        <p>Do you want to include historical data from the old FT sheet in this migration?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may increase the migration time.</p>
      </ConfirmationModal>

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
            {isRunning ? 'Migration Running...' : 'Start Main Migration'}
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
                  Main Migration Progress
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
                Main Migration Log:
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
              Main Migration Process
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

        <div className="mt-10 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Inventory Migration</h2>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleStartInventoryMigration} 
            disabled={isInventoryMigrationRunning} 
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isInventoryMigrationRunning ? 
              <Loader className="w-5 h-5 animate-spin" /> : 
              <Play className="w-5 h-5" />
            }
            {isInventoryMigrationRunning ? 'Inventory Migration Running...' : 'Start Inventory Migration'}
          </motion.button>
        </div>

        {inventoryMigrationLog.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
          >
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inventory Migration Progress
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(inventoryMigrationProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div 
                  className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full" 
                  initial={{ width: 0 }} 
                  animate={{ width: `${inventoryMigrationProgress}%` }} 
                  transition={{ duration: 0.5 }} 
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-black rounded-lg p-4 max-h-64 overflow-auto">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Inventory Migration Log:
              </h4>
              {inventoryMigrationLog.map((log, index) => (
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

            {inventoryMigrationError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  Error: {inventoryMigrationError}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {inventoryMigrationLog.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30"
          >
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Inventory Migration Process
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
                  <strong>Load Data:</strong> Inventory data will be loaded from the 'Master DATA (consolidated)' sheet.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <strong>Process & Match:</strong> Serial numbers will be extracted, matched against existing database records, and new records will be prepared for unmatched serial numbers.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <strong>Database Update:</strong> Existing records will be updated with inventory status, and new records will be inserted using high-performance bulk operations.
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <MigrationHistory />
      </motion.div>
    </>
  );
};

export default MigrationTab;