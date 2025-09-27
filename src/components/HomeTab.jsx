import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { fetchHomeSummary } from '../store/thunks/homeThunks';
import { Home, CheckCircle, XCircle, Clock } from 'lucide-react';

const HomeTab = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.home);

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    dispatch(fetchHomeSummary({ startDate, endDate }));
  }, [dispatch, startDate, endDate]);

  const COLORS = ['#6c63ff', '#4cc9f0', '#ffc658', '#ff8042', '#AF19FF'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-soft">
          <p className="label font-semibold">{`${label} : ${payload[0].value}`}</p>
          <p className="desc text-sm">{`Percentage: ${payload[0].payload.percent?.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const renderNoData = () => <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;

  const ChartCard = ({ title, children, titleColor }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft">
      <h2 className={`text-xl font-semibold mb-2 ${titleColor}`}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-center mb-6">
        <Home className="w-10 h-10 text-accent-primary" />
        <h1 className="text-5xl font-bold ml-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">Home</h1>
      </div>

      <div className="flex justify-center items-center mb-6 space-x-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 shadow-soft" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">End Date</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 shadow-soft" />
        </div>
      </div>

      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">Error: {error.error}</p>}

      {/* Ring Lifecycle */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-center text-accent-primary">Ring Lifecycle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-background-light dark:bg-background-dark rounded-xl">
            <h3 className="text-xl font-semibold mb-2">VQC</h3>
            <div className="flex justify-around items-center">
              <div className="flex items-center"><CheckCircle className="w-6 h-6 mr-2 text-green-500" /><p className="text-3xl font-bold">{data.ringLifecycleData?.vqc_received || 0}</p><p className="ml-2">Received</p></div>
              <div className="flex items-center"><XCircle className="w-6 h-6 mr-2 text-red-500" /><p className="text-3xl font-bold">{data.ringLifecycleData?.vqc_closed || 0}</p><p className="ml-2">Closed</p></div>
              <div className="flex items-center"><Clock className="w-6 h-6 mr-2 text-yellow-500" /><p className="text-3xl font-bold">{data.ringLifecycleData?.vqc_pending || 0}</p><p className="ml-2">Pending</p></div>
            </div>
          </div>
          <div className="text-center p-4 bg-background-light dark:bg-background-dark rounded-xl">
            <h3 className="text-xl font-semibold mb-2">FT</h3>
            <div className="flex justify-around items-center">
              <div className="flex items-center"><CheckCircle className="w-6 h-6 mr-2 text-green-500" /><p className="text-3xl font-bold">{data.ringLifecycleData?.ft_received || 0}</p><p className="ml-2">Received</p></div>
              <div className="flex items-center"><XCircle className="w-6 h-6 mr-2 text-red-500" /><p className="text-3xl font-bold">{data.ringLifecycleData?.ft_closed || 0}</p><p className="ml-2">Closed</p></div>
              <div className="flex items-center"><Clock className="w-6 h-6 mr-2 text-yellow-500" /><p className="text-3xl font-bold">{data.ringLifecycleData?.ft_pending || 0}</p><p className="ml-2">Pending</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Ring Status Overview" titleColor="text-accent-primary">
          {data.ringStatusData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><PieChart><Pie data={data.ringStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={150} fill="#8884d8" paddingAngle={5} label>{data.ringStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>

        <ChartCard title="Rings by Size" titleColor="text-accent-secondary">
          {data.ringSizeData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><BarChart data={data.ringSizeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#ffc658" /></BarChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard title="Rejection Reasons" titleColor="text-red-500">
          {data.rejectionReasonData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><BarChart data={data.rejectionReasonData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#82ca9d" /></BarChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard title="Rings by SKU" titleColor="text-yellow-500">
          {data.ringSkuData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><BarChart data={data.ringSkuData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#ff8042" /></BarChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>

        <ChartCard title="MO Summary" titleColor="text-green-500">
            {data.moSummaryData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><BarChart data={data.moSummaryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="accepted" stackId="a" fill="#82ca9d" /><Bar dataKey="wabi_sabi" stackId="a" fill="#ffc658" /><Bar dataKey="scrap" stackId="a" fill="#ff8042" /><Bar dataKey="rt_conversion" stackId="a" fill="#AF19FF" /></BarChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard title="Rings by PCB Batch" titleColor="text-blue-500">
            {data.ringPcbData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><LineChart data={data.ringPcbData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="value" stroke="#6c63ff" /></LineChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>

        <ChartCard title="QC Person Yield" titleColor="text-purple-500">
            {data.qcPersonYieldData?.length > 0 ? <ResponsiveContainer width="100%" height={400}><BarChart data={data.qcPersonYieldData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis label={{ value: 'Yield %', angle: -90, position: 'insideLeft' }} /><Tooltip /><Legend /><Bar dataKey="yield" fill="#4cc9f0" /></BarChart></ResponsiveContainer> : renderNoData()}
        </ChartCard>
      </div>

    </div>
  );
};

export default HomeTab;