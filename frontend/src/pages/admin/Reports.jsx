import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FaFilePdf, FaChartBar } from 'react-icons/fa';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Reports = () => {
  const [type, setType] = useState('grades');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(res.data.courses || []))
      .catch(() => toast.error('Failed to load courses'));
  }, []);

  const fetchReport = async () => {
    setLoading(true);

    try {
      const params = courseId ? `?courseId=${courseId}` : '';
      const res = await api.get(`/reports/${type}${params}`);
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!data) {
      toast.error('Please generate a report first');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('University CRM System - Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Report Type: ${getReportTitle(type)}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

    if (type === 'grades' && data?.grades) {
      autoTable(doc, {
        startY: 50,
        head: [['Student', 'Roll No', 'Course', 'Midterm', 'Final', 'Total', 'Grade']],
        body: data.grades.map((grade) => [
          grade.student?.name || '',
          grade.student?.roll_number || '',
          grade.course?.name || '',
          grade.midterm ?? '',
          grade.final ?? '',
          formatNumber(grade.total),
          grade.grade || '',
        ]),
      });
    }

    if (type === 'attendance' && data?.report) {
      autoTable(doc, {
        startY: 50,
        head: [['Student', 'Roll No', 'Total', 'Present', 'Absent', 'Late', 'Percentage', 'Status']],
        body: data.report.map((record) => [
          record.student?.name || '',
          record.student?.roll_number || '',
          record.total || 0,
          record.present || 0,
          record.absent || 0,
          record.late || 0,
          `${record.percentage || 0}%`,
          Number(record.percentage) >= 75 ? 'OK' : 'Short',
        ]),
      });
    }

    if (type === 'submissions' && data?.submissions) {
      autoTable(doc, {
        startY: 50,
        head: [['Student', 'Roll No', 'Task', 'Course', 'Status', 'Late']],
        body: data.submissions.map((submission) => [
          submission.student?.name || '',
          submission.student?.roll_number || '',
          submission.task?.title || '',
          submission.task?.course?.name || '',
          submission.status || '',
          submission.is_late ? 'Yes' : 'No',
        ]),
      });
    }

    doc.save(`university-crm-${type}-report.pdf`);
    toast.success('PDF downloaded!');
  };

  const gradeDistChart = data?.distribution
    ? {
        labels: ['A', 'B', 'C', 'D', 'F'],
        datasets: [
          {
            data: Object.values(data.distribution),
            backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
            borderWidth: 0,
          },
        ],
      }
    : null;

  const attendanceChart = data?.report
    ? {
        labels: data.report.map((record) => record.student?.name || 'Student'),
        datasets: [
          {
            label: 'Attendance %',
            data: data.report.map((record) => Number(record.percentage || 0)),
            backgroundColor: '#3b82f6',
          },
        ],
      }
    : null;

  const submissionChart = data?.stats
    ? {
        labels: ['On Time', 'Late', 'Graded'],
        datasets: [
          {
            label: 'Submissions',
            data: [data.stats.onTime || 0, data.stats.late || 0, data.stats.graded || 0],
            backgroundColor: ['#22c55e', '#ef4444', '#3b82f6'],
          },
        ],
      }
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-36">
            <label className="label">Report Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setData(null);
              }}
            >
              <option value="grades">Grade Report</option>
              <option value="attendance">Attendance Report</option>
              <option value="submissions">Submission Report</option>
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="label">Course Optional</label>
            <select
              className="input"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={getId(course)} value={getId(course)}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <FaChartBar size={14} />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {data && (
            <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
              <FaFilePdf size={14} />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {data && type === 'grades' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{data.total || 0}</p>
              <p className="text-gray-500 text-sm mt-1">Total Records</p>
            </div>

            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">
                {data.averageScore || 0}%
              </p>
              <p className="text-gray-500 text-sm mt-1">Average Score</p>
            </div>

            <div className="card">
              <p className="text-sm font-semibold text-gray-700 mb-2">Grade Distribution</p>
              {gradeDistChart ? (
                <Pie
                  data={gradeDistChart}
                  options={{
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-sm text-gray-400">No chart data available</p>
              )}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="font-semibold mb-4">Detailed Grades</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-gray-500">Student</th>
                  <th className="px-4 py-2 text-left text-gray-500">Roll No</th>
                  <th className="px-4 py-2 text-left text-gray-500">Course</th>
                  <th className="px-4 py-2 text-center text-gray-500">Midterm</th>
                  <th className="px-4 py-2 text-center text-gray-500">Final</th>
                  <th className="px-4 py-2 text-center text-gray-500">Total</th>
                  <th className="px-4 py-2 text-center text-gray-500">Grade</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {data.grades?.map((grade) => (
                  <tr key={getId(grade)} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{grade.student?.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {grade.student?.roll_number || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {grade.course?.name || '—'}
                    </td>
                    <td className="px-4 py-2 text-center">{grade.midterm ?? '—'}</td>
                    <td className="px-4 py-2 text-center">{grade.final ?? '—'}</td>
                    <td className="px-4 py-2 text-center font-semibold">
                      {formatNumber(grade.total)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={getGradeClass(grade.grade)}>{grade.grade || '—'}</span>
                    </td>
                  </tr>
                ))}

                {(!data.grades || data.grades.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No grade records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && type === 'attendance' && (
        <div className="space-y-6">
          {attendanceChart && data.report?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-4">Attendance Percentage Chart</h2>
              <Bar
                data={attendanceChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-semibold mb-4">Attendance Report</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-gray-500">Student</th>
                  <th className="px-4 py-2 text-left text-gray-500">Roll No</th>
                  <th className="px-4 py-2 text-center text-gray-500">Total</th>
                  <th className="px-4 py-2 text-center text-gray-500">Present</th>
                  <th className="px-4 py-2 text-center text-gray-500">Absent</th>
                  <th className="px-4 py-2 text-center text-gray-500">Late</th>
                  <th className="px-4 py-2 text-center text-gray-500">%</th>
                  <th className="px-4 py-2 text-center text-gray-500">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {data.report?.map((record, index) => (
                  <tr key={record.student?.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">
                      {record.student?.name || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {record.student?.roll_number || '—'}
                    </td>
                    <td className="px-4 py-2 text-center">{record.total || 0}</td>
                    <td className="px-4 py-2 text-center text-green-600">
                      {record.present || 0}
                    </td>
                    <td className="px-4 py-2 text-center text-red-600">
                      {record.absent || 0}
                    </td>
                    <td className="px-4 py-2 text-center text-yellow-600">
                      {record.late || 0}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">
                      {record.percentage || 0}%
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={
                          Number(record.percentage) >= 75 ? 'badge-present' : 'badge-absent'
                        }
                      >
                        {Number(record.percentage) >= 75 ? 'OK' : 'Short'}
                      </span>
                    </td>
                  </tr>
                ))}

                {(!data.report || data.report.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && type === 'submissions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{data.stats?.total || 0}</p>
              <p className="text-gray-500 text-sm mt-1">Total Submissions</p>
            </div>

            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{data.stats?.onTime || 0}</p>
              <p className="text-gray-500 text-sm mt-1">On Time</p>
            </div>

            <div className="card text-center">
              <p className="text-3xl font-bold text-red-600">{data.stats?.late || 0}</p>
              <p className="text-gray-500 text-sm mt-1">Late</p>
            </div>

            <div className="card text-center">
              <p className="text-3xl font-bold text-purple-600">{data.stats?.graded || 0}</p>
              <p className="text-gray-500 text-sm mt-1">Graded</p>
            </div>
          </div>

          {submissionChart && (
            <div className="card">
              <h2 className="font-semibold mb-4">Submission Summary Chart</h2>
              <Bar
                data={submissionChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-semibold mb-4">Submission Report</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-gray-500">Student</th>
                  <th className="px-4 py-2 text-left text-gray-500">Roll No</th>
                  <th className="px-4 py-2 text-left text-gray-500">Task</th>
                  <th className="px-4 py-2 text-left text-gray-500">Course</th>
                  <th className="px-4 py-2 text-center text-gray-500">Status</th>
                  <th className="px-4 py-2 text-center text-gray-500">Late</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {data.submissions?.map((submission) => (
                  <tr key={getId(submission)} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">
                      {submission.student?.name || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {submission.student?.roll_number || '—'}
                    </td>
                    <td className="px-4 py-2">{submission.task?.title || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {submission.task?.course?.name || '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={getSubmissionStatusClass(submission.status)}>
                        {submission.status || 'submitted'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={submission.is_late ? 'badge-absent' : 'badge-present'}>
                        {submission.is_late ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}

                {(!data.submissions || data.submissions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No submission records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const getId = (item) => item?.id || item?._id;

const getReportTitle = (reportType) => {
  if (reportType === 'grades') return 'Grade Report';
  if (reportType === 'attendance') return 'Attendance Report';
  if (reportType === 'submissions') return 'Submission Report';
  return 'Report';
};

const formatNumber = (value) => {
  if (typeof value === 'number') return value.toFixed(1);
  if (!value) return '0.0';
  return Number(value).toFixed(1);
};

const getGradeClass = (grade) => {
  const baseClass = 'font-bold px-2 py-0.5 rounded-full text-xs';

  if (grade === 'A') return `${baseClass} bg-green-100 text-green-700`;
  if (grade === 'B') return `${baseClass} bg-blue-100 text-blue-700`;
  if (grade === 'C') return `${baseClass} bg-yellow-100 text-yellow-700`;
  return `${baseClass} bg-red-100 text-red-700`;
};

const getSubmissionStatusClass = (status) => {
  const baseClass = 'px-2 py-0.5 rounded-full text-xs font-medium capitalize';

  if (status === 'graded') return `${baseClass} bg-green-100 text-green-700`;
  if (status === 'submitted') return `${baseClass} bg-blue-100 text-blue-700`;
  return `${baseClass} bg-gray-100 text-gray-700`;
};

export default Reports;