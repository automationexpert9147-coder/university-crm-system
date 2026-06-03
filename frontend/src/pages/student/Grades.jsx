import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/grades/my');
        setGrades(data.grades || []);
        setGpa(data.gpa || '0.00');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const chartData = {
    labels: grades.map((grade) => grade.course?.code || ''),
    datasets: [
      {
        label: 'Midterm (18)',
        data: grades.map((grade) => Number(grade.midterm || 0)),
        backgroundColor: '#60a5fa',
      },
      {
        label: 'Final (24)',
        data: grades.map((grade) => Number(grade.final || 0)),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Quiz + Assignment (8)',
        data: grades.map((grade) => Number(grade.assignments || 0)),
        backgroundColor: '#8b5cf6',
      },
      {
        label: 'Practical (10)',
        data: grades.map((grade) => Number(grade.practical || 0)),
        backgroundColor: '#10b981',
      },
    ],
  };

  const averageScore =
    grades.length > 0
      ? (
          grades.reduce((sum, grade) => sum + Number(grade.percentage || 0), 0) /
          grades.length
        ).toFixed(1)
      : '—';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <p className="text-4xl font-bold">{gpa}</p>
          <p className="text-blue-200 text-sm mt-1">Current GPA</p>
        </div>

        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{grades.length}</p>
          <p className="text-gray-500 text-sm mt-1">Courses Graded</p>
        </div>

        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">
            {averageScore}
            {averageScore !== '—' ? '%' : ''}
          </p>
          <p className="text-gray-500 text-sm mt-1">Average Percentage</p>
        </div>
      </div>

      {grades.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Score Breakdown</h2>

          <Bar
            data={chartData}
            options={{
              plugins: {
                legend: {
                  position: 'top',
                },
              },
              scales: {
                y: {
                  max: 60,
                  beginAtZero: true,
                },
              },
              responsive: true,
            }}
          />
        </div>
      )}

      <div className="card overflow-hidden">
        <h2 className="font-semibold text-gray-900 mb-4">Grade Detail</h2>

        {grades.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No published grades yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">
                    Course
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    Midterm /18
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    Final /24
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    Quiz + Assignment /8
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    Practical /10
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    Total /60
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    %
                  </th>
                  <th className="px-4 py-3 text-center text-gray-500 font-medium">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {grades.map((grade) => {
                  const gradeId = getGradeId(grade);
                  const percentage = getPercentage(grade);

                  return (
                    <tr key={gradeId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {grade.course?.name || 'No Course'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {grade.course?.code || ''}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center text-gray-700">
                        {Number(grade.midterm || 0)}
                      </td>

                      <td className="px-4 py-3 text-center text-gray-700">
                        {Number(grade.final || 0)}
                      </td>

                      <td className="px-4 py-3 text-center text-gray-700">
                        {Number(grade.assignments || 0)}
                      </td>

                      <td className="px-4 py-3 text-center text-gray-700">
                        {Number(grade.practical || 0)}
                      </td>

                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {Number(grade.total || 0).toFixed(1)}
                      </td>

                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {percentage.toFixed(1)}%
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={getGradeBadgeClass(grade.grade)}>
                          {grade.grade}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {grade.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 text-xs text-gray-500">
              Grade scale: A = 48+, B = 39+, C = 31+, D = 25+, F = below 25
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getGradeId = (grade) => grade.id || grade._id;

const getPercentage = (grade) => {
  if (grade.percentage !== undefined && grade.percentage !== null) {
    return Number(grade.percentage || 0);
  }

  return Number(((Number(grade.total || 0) / 60) * 100).toFixed(2));
};

const getGradeBadgeClass = (grade) => {
  const classes = {
    A: 'bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full',
    B: 'bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full',
    C: 'bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full',
    D: 'bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full',
    F: 'bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full',
  };

  return classes[grade] || 'bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full';
};

export default Grades;