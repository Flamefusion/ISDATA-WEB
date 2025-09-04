// src/components/ReportTab.jsx - Updated with Redux
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Users, 
  Loader, 
  BarChart3, 
  XCircle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  PieChart,
  Eye,
  Download
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setReportData,
  setSelectedDate,
  setSelectedVendor,
  setVendors,
  setLoading,
  setError,
  clearReport,
  loadReport as loadReportAction
} from '../store/slices/reportSlice';
import { showAlert } from '../store/slices/uiSlice';

// Animation variants
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const ReportTab = () => {
  const dispatch = useDispatch();
  const { 
    reportData, 
    selectedDate, 
    selectedVendor, 
    vendors, 
    isLoading, 
    error 
  } = useSelector((state) => state.report);

  // Load vendors on component mount
  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      // Mock vendors - replace with your API call
      const mockVendors = ['all', 'Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'];
      dispatch(setVendors(mockVendors));
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const handleLoadReport = async () => {
    dispatch(loadReportAction());

    try {
      // Mock report data - replace with your API call
      const mockReportData = {
        totalReceived: 1250,
        totalAccepted: 1087,
        totalRejected: 163,
        totalPending: 0,
        yield: 87,
        vqcBreakdown: {
          accepted: 1100,
          rejected: 150,
          pending: 0,
          rejectionReasons: [
            { reason: 'Scratches', count: 65, percentage: 43.3 },
            { reason: 'Dents', count: 42, percentage: 28.0 },
            { reason: 'Color Issue', count: 28, percentage: 18.7 },
            { reason: 'Polish Issue', count: 15, percentage: 10.0 }
          ]
        },
        ftBreakdown: {
          accepted: 1063,
          rejected: 37,
          pending: 0,
          rejectionReasons: [
            { reason: 'Size Issue', count: 20, percentage: 54.1 },
            { reason: 'Weight Issue', count: 17, percentage: 45.9 }
          ]
        },
        vendorBreakdown: selectedVendor === 'all' ? [
          { vendor: 'Vendor A', totalReceived: 300, totalAccepted: 261, totalRejected: 39, totalPending: 0, yield: 87 },
          { vendor: 'Vendor B', totalReceived: 275, totalAccepted: 240, totalRejected: 35, totalPending: 0, yield: 87.3 },
          { vendor: 'Vendor C', totalReceived: 225, totalAccepted: 196, totalRejected: 29, totalPending: 0, yield: 87.1 },
          { vendor: 'Vendor D', totalReceived: 250, totalAccepted: 218, totalRejected: 32, totalPending: 0, yield: 87.2 },
          { vendor: 'Vendor E', totalReceived: 200, totalAccepted: 172, totalRejected: 28, totalPending: 0, yield: 86 }
        ] : [],
        hourlyData: [
          { hour: '08:00', received: 85, accepted: 74, rejected: 11, pending: 0 },
          { hour: '09:00', received: 92, accepted: 80, rejected: 12, pending: 0 },
          { hour: '10:00', received: 105, accepted: 92, rejected: 13, pending: 0 },
          { hour: '11:00', received: 98, accepted: 85, rejected: 13, pending: 0 },
          { hour: '12:00', received: 75, accepted: 65, rejected: 10, pending: 0 },
          { hour: '13:00', received: 110, accepted: 96, rejected: 14, pending: 0 },
          { hour: '14:00', received: 125, accepted: 109, rejected: 16, pending: 0 },
          { hour: '15:00', received: 118, accepted: 103, rejected: 15, pending: 0 },
          { hour: '16:00', received: 102, accepted: 89, rejected: 13, pending: 0 },
          { hour: '17:00', received: 95, accepted: 82, rejected: 13, pending: 0 },
          { hour: '18:00', received: 88, accepted: 77, rejected: 11, pending: 0 },
          { hour: '19:00', received: 107, accepted: 93, rejected: 14, pending: 0 }
        ]
      };

      dispatch(setReportData(mockReportData));
      dispatch(showAlert({ 
        message: 'Report generated successfully', 
        type: 'success' 
      }));
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(showAlert({ 
        message: 'Failed to generate report', 
        type: 'error' 
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleExportReport = (format) => {
    if (!reportData) {
      dispatch(showAlert({ 
        message: 'No report data to export', 
        type: 'error' 
      }));
      return;
    }

    // Create export data
    const exportData = {
      date: selectedDate,
      vendor: selectedVendor,
      summary: {
        totalReceived: reportData.totalReceived,
        totalAccepted: reportData.totalAccepted,
        totalRejected: reportData.totalRejected,
        yield: reportData.yield
      },
      vqcBreakdown: reportData.vqcBreakdown,
      ftBreakdown: reportData.ftBreakdown
    };

    if (format === 'csv') {
      // Create CSV content
      const csvRows = [
        ['Metric', 'Value'],
        ['Date', selectedDate],
        ['Vendor', selectedVendor],
        ['Total Received', reportData.totalReceived],
        ['Total Accepted', reportData.totalAccepted],
        ['Total Rejected', reportData.totalRejected],
        ['Overall Yield (%)', reportData.yield],
        [''],
        ['VQC Breakdown'],
        ['VQC Accepted', reportData.vqcBreakdown.accepted],
        ['VQC Rejected', reportData.vqcBreakdown.rejected],
        [''],
        ['FT Breakdown'],
        ['FT Accepted', reportData.ftBreakdown.accepted],
        ['FT Rejected', reportData.ftBreakdown.rejected]
      ];


      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `report_${selectedDate}_${selectedVendor}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'excel') {
      // For Excel export, you would typically use a library like xlsx
      // For now, we'll just show an alert
      dispatch(showAlert({ 
        message: 'Excel export feature coming soon', 
        type: 'info' 
      }));
    }

    dispatch(showAlert({ 
      message: `Report exported successfully as ${format.toUpperCase()}`, 
      type: 'success' 
    }));
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100')} dark:${color.replace('text-', 'bg-').replace('-600', '-900/20')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : trend < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          ) : null}
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend !== 0 ? `${Math.abs(trend)}% vs yesterday` : 'No change'}
          </span>
        </div>
      )}
    </motion.div>
  );

  const ReasonCard = ({ title, reasons, totalRejected }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
    >
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h4>
        <span className="text-sm text-gray-500 dark:text-gray-300">({totalRejected} total)</span>
      </div>
      <div className="space-y-4">
        {reasons.length > 0 ? reasons.map((reason, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {reason.reason}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {reason.count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({reason.percentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${reason.percentage}%` }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No rejection reasons found
          </div>
        )}
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Error Loading Report
              </h3>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoadReport}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200"
          >
            Retry
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-black dark:via-gray-900/[0.3] dark:to-black rounded-2xl p-6 border border-blue-200/50 dark:border-gray-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Production Report</h2>
              <p className="text-gray-600 dark:text-gray-300">Real-time tracking with correct VQC/FT logic</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => dispatch(setSelectedDate(e.target.value))}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                />
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Select Vendor
              </label>
              <div className="relative">
                <select
                  value={selectedVendor}
                  onChange={(e) => dispatch(setSelectedVendor(e.target.value))}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 appearance-none"
                >
                  {vendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor === 'all' ? 'All Vendors' : vendor}
                    </option>
                  ))}
                </select>
                <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoadReport}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <BarChart3 className="w-5 h-5" />
                )}
                Generate Report
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-16"
        >
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Loading Report Data...
            </p>
          </div>
        </motion.div>
      )}

      {/* Report Content */}
      {reportData && !isLoading && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Received"
              value={reportData.totalReceived.toLocaleString()}
              icon={Target}
              color="text-blue-600"
              subtitle="rings processed"
            />
            <StatCard
              title="Total Accepted"
              value={reportData.totalAccepted.toLocaleString()}
              icon={CheckCircle}
              color="text-green-600"
              subtitle="quality passed"
            />
            <StatCard
              title="Total Rejected"
              value={reportData.totalRejected.toLocaleString()}
              icon={XCircle}
              color="text-red-600"
              subtitle="quality failed"
            />
            <StatCard
              title="Total Pending"
              value={reportData.totalPending ? reportData.totalPending.toLocaleString() : '0'}
              icon={AlertCircle}
              color="text-yellow-600"
              subtitle="awaiting process"
            />
            <StatCard
              title="Overall Yield"
              value={`${reportData.yield}%`}
              icon={TrendingUp}
              color="text-purple-600"
              subtitle="acceptance rate"
            />
          </div>

          {/* Stage-wise Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              variants={staggerItem}
              className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
            >
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-blue-500" />
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">VQC Stage</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 dark:text-green-400">Accepted</span>
                  <span className="font-bold">{reportData.vqcBreakdown.accepted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 dark:text-red-400">Rejected</span>
                  <span className="font-bold">{reportData.vqcBreakdown.rejected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                  <span className="font-bold">{reportData.vqcBreakdown.pending || 0}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
            >
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">FT Stage</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 dark:text-green-400">Accepted</span>
                  <span className="font-bold">{reportData.ftBreakdown.accepted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 dark:text-red-400">Rejected</span>
                  <span className="font-bold">{reportData.ftBreakdown.rejected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                  <span className="font-bold">{reportData.ftBreakdown.pending || 0}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
            >
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-indigo-500" />
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">Final Status</h4>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 dark:text-green-400">Accepted</span>
                  <span className="font-bold">{reportData.totalAccepted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 dark:text-red-400">Rejected</span>
                  <span className="font-bold">{reportData.totalRejected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                  <span className="font-bold">{reportData.totalPending || 0}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Rejection Reasons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReasonCard
              title="VQC Rejection Reasons"
              reasons={reportData.vqcBreakdown.rejectionReasons}
              totalRejected={reportData.vqcBreakdown.rejected}
            />
            <ReasonCard
              title="FT Rejection Reasons"
              reasons={reportData.ftBreakdown.rejectionReasons}
              totalRejected={reportData.ftBreakdown.rejected}
            />
          </div>

          {/* Export Section */}
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Export Report
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Download detailed report data for {selectedDate} - {selectedVendor === 'all' ? 'All Vendors' : selectedVendor}
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExportReport('csv')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExportReport('excel')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* No Data State */}
      {!reportData && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-gray-50 dark:bg-black/90 rounded-2xl"
        >
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No Report Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            No data found for {selectedDate} - {selectedVendor === 'all' ? 'All Vendors' : selectedVendor}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoadReport}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200"
          >
            Retry Report Generation
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default ReportTab;