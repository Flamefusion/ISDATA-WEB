import React from 'react';
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

// Animation variants
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const ReportTab = ({
  selectedDate,
  setSelectedDate,
  selectedVendor,
  setSelectedVendor,
  reportData,
  isLoading,
  vendors,
  error,
  loadReport,
  exportReport,
}) => {
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

  const HourlyChart = ({ data }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">Hourly Production</h4>
      </div>
      <div className="space-y-3">
        {data.length > 0 ? data.map((item, index) => {
          const completedRings = item.accepted + item.rejected;
          const yieldRate = completedRings > 0 ? ((item.accepted / completedRings) * 100).toFixed(1) : 0;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.hour}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Received: {item.received}</span>
                  <span className="text-green-600 dark:text-green-400">Accepted: {item.accepted}</span>
                  <span className="text-red-600 dark:text-red-400">Rejected: {item.rejected}</span>
                  <span className="text-yellow-600 dark:text-yellow-400">Pending: {item.pending || 0}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Yield: {yieldRate}%</span>
                </div>
                <div className="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-l-full absolute top-0 left-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.accepted / item.received) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  />
                  <motion.div
                    className="bg-red-500 h-2 absolute top-0"
                    style={{ left: `${(item.accepted / item.received) * 100}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.rejected / item.received) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                  />
                  <motion.div
                    className="bg-yellow-500 h-2 rounded-r-full absolute top-0"
                    style={{ left: `${((item.accepted + item.rejected) / item.received) * 100}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${((item.pending || 0) / item.received) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.6, duration: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No hourly data available
          </div>
        )}
      </div>
    </motion.div>
  );

  const VendorBreakdown = ({ vendors }) => (
    <motion.div
      variants={staggerItem}
      className="bg-white dark:bg-black/90 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30 shadow-2xl dark:shadow-black/50"
    >
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-purple-500" />
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">Vendor-wise Breakdown</h4>
      </div>
      <div className="space-y-4">
        {vendors.map((vendor, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-800 dark:text-white">{vendor.vendor}</h5>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {vendor.yield}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Received</span>
                <p className="font-semibold">{vendor.totalReceived}</p>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Accepted</span>
                <p className="font-semibold">{vendor.totalAccepted}</p>
              </div>
              <div>
                <span className="text-red-600 dark:text-red-400">Rejected</span>
                <p className="font-semibold">{vendor.totalRejected}</p>
              </div>
              <div>
                <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                <p className="font-semibold">{vendor.totalPending || 0}</p>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${vendor.yield}%` }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              />
            </div>
          </motion.div>
        ))}
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
            onClick={loadReport}
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
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                  onChange={(e) => setSelectedVendor(e.target.value)}
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
                onClick={loadReport}
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
              trend={reportData.trends?.received}
            />
            <StatCard
              title="Total Accepted"
              value={reportData.totalAccepted.toLocaleString()}
              icon={CheckCircle}
              color="text-green-600"
              subtitle="quality passed"
              trend={reportData.trends?.accepted}
            />
            <StatCard
              title="Total Rejected"
              value={reportData.totalRejected.toLocaleString()}
              icon={XCircle}
              color="text-red-600"
              subtitle="quality failed"
              trend={reportData.trends?.rejected}
            />
            <StatCard
              title="Total Pending"
              value={reportData.totalPending ? reportData.totalPending.toLocaleString() : '0'}
              icon={AlertCircle}
              color="text-yellow-600"
              subtitle="awaiting process"
              trend={reportData.trends?.pending}
            />
            <StatCard
              title="Overall Yield"
              value={`${reportData.yield}%`}
              icon={TrendingUp}
              color="text-purple-600"
              subtitle="acceptance rate"
              trend={reportData.trends?.yield}
            />
          </div>

          {/* Vendor Breakdown (only show when 'all' is selected) */}
          {selectedVendor === 'all' && reportData.vendorBreakdown && reportData.vendorBreakdown.length > 0 && (
            <VendorBreakdown vendors={reportData.vendorBreakdown} />
          )}

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

          {/* Hourly Production Chart */}
          {reportData.hourlyData && reportData.hourlyData.length > 0 && (
            <HourlyChart data={reportData.hourlyData} />
          )}

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
                  onClick={() => exportReport('csv')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => exportReport('excel')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Summary Report Section */}
          <motion.div
            variants={staggerItem}
            className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-black dark:to-gray-900/20 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">Report Summary</h4>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-white/70 dark:bg-black/95 rounded-xl p-6 backdrop-blur-xl">
                <h5 className="text-lg font-semibold mb-4">Daily Production Analysis - {selectedDate}</h5>
                <div className="space-y-3 text-gray-700 dark:text-gray-200">
                  <p>
                    <span className="font-semibold">Production Overview:</span> On {selectedDate}, 
                    {selectedVendor === 'all' ? ' across all vendors,' : ` for ${selectedVendor},`} a total of{' '}
                    <span className="font-bold text-blue-600">{reportData.totalReceived}</span> rings were received for processing.
                  </p>
                  
                  <p>
                    <span className="font-semibold">Quality Results:</span> Out of the total received,{' '}
                    <span className="font-bold text-green-600">{reportData.totalAccepted}</span> rings passed all quality checks,{' '}
                    <span className="font-bold text-red-600">{reportData.totalRejected}</span> rings were rejected, and{' '}
                    <span className="font-bold text-yellow-600">{reportData.totalPending || 0}</span> rings are still pending processing.
                  </p>
                  
                  <p>
                    <span className="font-semibold">Overall Yield:</span> The day achieved a yield of{' '}
                    <span className="font-bold text-purple-600">{reportData.yield}%</span> from completed rings, indicating{' '}
                    {reportData.yield >= 85 ? 'excellent' : reportData.yield >= 75 ? 'good' : reportData.yield >= 65 ? 'acceptable' : 'below target'} performance.
                    {reportData.totalPending > 0 && (
                      <span className="text-yellow-600"> Note: {reportData.totalPending} rings are still pending and not included in yield calculation.</span>
                    )}
                  </p>
                  
                  <p>
                    <span className="font-semibold">Processing Status:</span> VQC stage processed{' '}
                    <span className="font-bold">{reportData.vqcBreakdown.accepted + reportData.vqcBreakdown.rejected}</span> rings 
                    ({reportData.vqcBreakdown.pending || 0} pending), while FT stage processed{' '}
                    <span className="font-bold">{reportData.ftBreakdown.accepted + reportData.ftBreakdown.rejected}</span> rings 
                    ({reportData.ftBreakdown.pending || 0} pending).
                  </p>
                  
                  {reportData.vqcBreakdown.rejectionReasons.length > 0 && (
                    <p>
                      <span className="font-semibold">Primary VQC Issues:</span> The main quality concerns were{' '}
                      {reportData.vqcBreakdown.rejectionReasons.slice(0, 3).map((reason, index) => (
                        <span key={index}>
                          {reason.reason} ({reason.count} rings)
                          {index < Math.min(2, reportData.vqcBreakdown.rejectionReasons.length - 1) ? ', ' : ''}
                        </span>
                      )).reduce((prev, curr, index) => index === 0 ? [curr] : [...prev, index === reportData.vqcBreakdown.rejectionReasons.slice(0, 3).length - 1 ? ' and ' : ', ', curr], [])}.
                    </p>
                  )}
                  
                  {reportData.ftBreakdown.rejectionReasons.length > 0 && (
                    <p>
                      <span className="font-semibold">Functional Test Issues:</span> FT rejections were primarily due to{' '}
                      {reportData.ftBreakdown.rejectionReasons.slice(0, 2).map((reason, index) => (
                        <span key={index}>
                          {reason.reason} ({reason.count} rings)
                          {index < Math.min(1, reportData.ftBreakdown.rejectionReasons.length - 1) ? ' and ' : ''}
                        </span>
                      ))}.
                    </p>
                  )}
                </div>
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
            onClick={loadReport}
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