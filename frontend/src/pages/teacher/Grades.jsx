import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FaSave, FaCheckCircle } from 'react-icons/fa';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TeacherGrades = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [gradeData, setGradeData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const { data } = await api.get('/courses/my');
        setCourses(data.courses || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setStudents([]);
    setGradeData({});

    if (!courseId) return;

    const course = courses.find((c) => getCourseId(c) === courseId);
    const enrolledStudents = course?.students || [];

    setStudents(enrolledStudents);

    try {
      setLoadingGrades(true);

      const { data } = await api.get(`/grades/course/${courseId}`);
      const existingGrades = data.grades || [];

      const initialData = {};

      enrolledStudents.forEach((student) => {
        const studentId = getStudentId(student);

        initialData[studentId] = {
          midterm: 0,
          final: 0,
          assignments: 0,
          practical: 0,
          remarks: '',
        };
      });

      existingGrades.forEach((grade) => {
        const studentId = getStudentId(grade.student);

        if (studentId) {
          initialData[studentId] = {
            midterm: Number(grade.midterm || 0),
            final: Number(grade.final || 0),
            assignments: Number(grade.assignments || 0),
            practical: Number(grade.practical || 0),
            remarks: grade.remarks || '',
            isPublished: getIsPublished(grade),
          };
        }
      });

      setGradeData(initialData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load grades');
    } finally {
      setLoadingGrades(false);
    }
  };

  const setField = (studentId, field, value) => {
    const maxValue = getMaxMarks(field);
    let numericValue = Number(value) || 0;

    if (field !== 'remarks') {
      if (numericValue < 0) numericValue = 0;
      if (numericValue > maxValue) numericValue = maxValue;
    }

    setGradeData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'remarks' ? value : numericValue,
      },
    }));
  };

  const saveAll = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    if (students.length === 0) {
      toast.error('No students enrolled in this course');
      return;
    }

    setSaving(true);

    try {
      for (const student of students) {
        const studentId = getStudentId(student);
        const grade = gradeData[studentId] || {};

        await api.post('/grades', {
          studentId,
          courseId: selectedCourse,
          midterm: grade.midterm || 0,
          final: grade.final || 0,
          assignments: grade.assignments || 0,
          quizzes: 0,
          practical: grade.practical || 0,
          remarks: grade.remarks || '',
        });
      }

      toast.success('All grades saved!');
      handleCourseChange(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Some grades failed to save');
    } finally {
      setSaving(false);
    }
  };

  const publishAll = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    if (!confirm('Publish grades? Students will be notified.')) return;

    try {
      const { data } = await api.post(`/grades/publish/${selectedCourse}`);
      toast.success(data.message || 'Grades published!');
      handleCourseChange(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    }
  };

  const fields = [
    { key: 'midterm', label: 'Midterm', max: 18 },
    { key: 'final', label: 'Final', max: 24 },
    { key: 'assignments', label: 'Quiz + Assignment', max: 8 },
    { key: 'practical', label: 'Practical', max: 10 },
  ];

  if (loadingCourses) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Grades</h1>

        {selectedCourse && students.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={saveAll}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <FaSave size={12} />
              {saving ? 'Saving...' : 'Save All'}
            </button>

            <button
              onClick={publishAll}
              className="btn-success flex items-center gap-2"
            >
              <FaCheckCircle size={12} />
              Publish
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <label className="label">Select Course</label>

        <select
          className="input max-w-sm"
          value={selectedCourse}
          onChange={(e) => handleCourseChange(e.target.value)}
        >
          <option value="">Choose Course</option>
          {courses.map((course) => {
            const courseId = getCourseId(course);

            return (
              <option key={courseId} value={courseId}>
                {course.name} ({course.code})
              </option>
            );
          })}
        </select>
      </div>

      {loadingGrades && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!loadingGrades && selectedCourse && students.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-3 text-left text-gray-500 font-medium">
                  Student
                </th>

                {fields.map((field) => (
                  <th
                    key={field.key}
                    className="px-3 py-3 text-center text-gray-500 font-medium"
                  >
                    {field.label}
                    <br />
                    <span className="text-xs text-gray-400">
                      ({field.max} marks)
                    </span>
                  </th>
                ))}

                <th className="px-3 py-3 text-center text-gray-500 font-medium">
                  Total
                  <br />
                  <span className="text-xs text-gray-400">(60)</span>
                </th>

                <th className="px-3 py-3 text-center text-gray-500 font-medium">
                  %
                </th>

                <th className="px-3 py-3 text-center text-gray-500 font-medium">
                  Grade
                </th>

                <th className="px-3 py-3 text-center text-gray-500 font-medium">
                  Status
                </th>

                <th className="px-3 py-3 text-left text-gray-500 font-medium">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const studentId = getStudentId(student);
                const grade = gradeData[studentId] || {};
                const result = calculateGrade(grade);

                return (
                  <tr key={studentId} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {getRollNumber(student) || student.email}
                      </p>
                    </td>

                    {fields.map((field) => (
                      <td key={field.key} className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={field.max}
                          className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          value={grade[field.key] ?? 0}
                          onChange={(e) =>
                            setField(studentId, field.key, e.target.value)
                          }
                        />
                      </td>
                    ))}

                    <td className="px-3 py-2 text-center font-semibold">
                      {result.total.toFixed(1)}
                    </td>

                    <td className="px-3 py-2 text-center font-semibold">
                      {result.percentage.toFixed(1)}%
                    </td>

                    <td className="px-3 py-2 text-center">
                      <span className={getGradeBadgeClass(result.grade)}>
                        {result.grade}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-center">
                      {grade.isPublished ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          Published
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder="Optional remarks"
                        value={grade.remarks || ''}
                        onChange={(e) =>
                          setField(studentId, 'remarks', e.target.value)
                        }
                      />
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

      {!loadingGrades && selectedCourse && students.length === 0 && (
        <div className="card text-center py-8 text-gray-400">
          No students enrolled in this course
        </div>
      )}
    </div>
  );
};

const getCourseId = (course) => course.id || course._id;

const getStudentId = (student) => student?.id || student?._id;

const getRollNumber = (student) => student?.roll_number || student?.rollNumber || '';

const getIsPublished = (grade) => {
  if (typeof grade.is_published === 'boolean') return grade.is_published;
  if (typeof grade.isPublished === 'boolean') return grade.isPublished;
  return false;
};

const getMaxMarks = (field) => {
  const maxMarks = {
    midterm: 18,
    final: 24,
    assignments: 8,
    practical: 10,
  };

  return maxMarks[field] || 100;
};

const calculateGrade = (grade) => {
  const midterm = Number(grade.midterm || 0);
  const final = Number(grade.final || 0);
  const assignments = Number(grade.assignments || 0);
  const practical = Number(grade.practical || 0);

  const total = midterm + final + assignments + practical;
  const roundedTotal = Number(total.toFixed(2));
  const percentage = Number(((roundedTotal / 60) * 100).toFixed(2));

  const letterGrade =
    roundedTotal >= 48
      ? 'A'
      : roundedTotal >= 39
        ? 'B'
        : roundedTotal >= 31
          ? 'C'
          : roundedTotal >= 25
            ? 'D'
            : 'F';

  return {
    total: roundedTotal,
    percentage,
    grade: letterGrade,
  };
};

const getGradeBadgeClass = (grade) => {
  const classes = {
    A: 'bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs',
    B: 'bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs',
    C: 'bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full text-xs',
    D: 'bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs',
    F: 'bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs',
  };

  return classes[grade] || 'bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full text-xs';
};

export default TeacherGrades;