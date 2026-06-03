import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend);

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async (courseId = '') => {
    setLoading(true);
    try {
      const url = courseId ? `/attendance/student?courseId=${courseId}` : '/attendance/student';
      const { data } = await api.get(url);
      setRecords(data.records || []);
      setStats(data.stats || { total: 0, present: 0, absent: 0, percentage: 0 });
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const fetch = async () => {
      const { data } = await api.get('/courses/my');
      setCourses(data.courses || []);
      fetchAttendance();
    };
    fetch();
  }, []);

  const chartData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{ data: [stats.present, stats.absent, records.filter(r => r.status === 'late').length], backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'], borderWidth: 0 }],
  };

  const statusColor = { present: 'badge-present', absent: 'badge-absent', late: 'badge-late' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-36 mx-auto">
            <Doughnut data={chartData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold text-gray-900">{stats.percentage}%</p>
            <p className="text-sm text-gray-500 mt-1">Attendance Rate</p>
            {stats.percentage < 75 && (
              <p className="text-xs text-red-600 mt-2 font-medium">⚠️ Below minimum required (75%)</p>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Attendance Records</h2>
            <select className="input w-auto text-sm" value={selectedCourse}
              onChange={e => { setSelectedCourse(e.target.value); fetchAttendance(e.target.value); }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {[{ label: 'Total Classes', value: stats.total, color: 'gray' }, { label: 'Present', value: stats.present, color: 'green' }, { label: 'Absent', value: stats.absent, color: 'red' }].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-50 rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                <p className={`text-xs text-${color}-600 mt-1`}>{label}</p>
              </div>
            ))}
          </div>

          {loading ? <div className="flex justify-center py-6"><LoadingSpinner /></div> : (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="pb-2 text-left text-gray-500 font-medium">Date</th><th className="pb-2 text-left text-gray-500 font-medium">Course</th><th className="pb-2 text-left text-gray-500 font-medium">Status</th></tr></thead>
                <tbody>
                  {records.slice(0, 30).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="py-2 text-gray-700">{r.course?.name || '—'}</td>
                      <td className="py-2"><span className={statusColor[r.status] || 'badge-absent'}>{r.status}</span></td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-400">No records found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
