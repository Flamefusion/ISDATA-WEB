import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Download, Loader, AlertTriangle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInventoryStatus, exportInventoryStatus } from '../store/thunks/inventoryStatusThunks';
import { showAlert } from '../store/slices/uiSlice';

const InventoryStatusTab = () => {
  const dispatch = useDispatch();
  const { inventoryData, isLoading, error } = useSelector((state) => state.inventoryStatus);

  useEffect(() => {
    dispatch(fetchInventoryStatus());
  }, [dispatch]);

  const handleExport = () => {
    if (!inventoryData || inventoryData.boxes.length === 0) {
      dispatch(showAlert({ message: 'No data to export', type: 'error' }));
      return;
    }
    dispatch(exportInventoryStatus());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black rounded-2xl p-6 border border-blue-200/50 dark:border-gray-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Inventory Status</h2>
              <p className="text-gray-600 dark:text-gray-300">Overview of inventory boxes and serial numbers.</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={!inventoryData || isLoading}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Export Details
          </motion.button>
        </div>
      </div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Loading Inventory Status...
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-4"
        >
          <p className="text-red-600 dark:text-red-400 font-medium">
            Error: {error}
          </p>
        </motion.div>
      )}

      {inventoryData && !isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Serial Numbers</p>
              <p className="text-3xl font-bold text-blue-600">{inventoryData.total_serial_numbers.toLocaleString()}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Boxes</p>
              <p className="text-3xl font-bold text-indigo-600">{inventoryData.total_boxes}</p>
            </motion.div>
          </div>

          {/* Box Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {inventoryData.boxes.map((box, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                className="bg-white dark:bg-black/90 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/30 shadow-lg dark:shadow-black/50"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                    <LayoutGrid className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{box.box_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Quantity</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{box.quantity}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {!inventoryData && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gray-50 dark:bg-black/90 rounded-2xl"
        >
          <LayoutGrid className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No Inventory Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            Data will be loaded automatically. If it doesn't appear, please try refreshing.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InventoryStatusTab;
