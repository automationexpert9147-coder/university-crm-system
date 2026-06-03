import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ManageAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [sortOrder, setSortOrder] = useState('recent');

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

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      setAttendance(buildAttendanceForDate(students, history, date));
    }
  }, [date, students, history]);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setStudents([]);
    setAttendance({});
    setHistory([]);
    setOpenHistoryId(null);

    if (!courseId) return;

    const course = courses.find((c) => getCourseId(c) === courseId);
    const courseStudents = getCourseStudents(course);

    if (courseStudents.length > 0) {
      setStudents(courseStudents);
      setAttendance(buildDefaultAttendance(courseStudents));
    }

    try {
      setLoadingHistory(true);
      const { data } = await api.get(`/attendance/course/${courseId}`);
      const attendanceHistory = data.attendance || [];
      setHistory(attendanceHistory);

      if (attendanceHistory.length > 0) {
        setOpenHistoryId(getAttendanceId(attendanceHistory[0]));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const setStudentStatus = (studentId, status) => {
    setAttendance((previousAttendance) => ({
      ...previousAttendance,
      [studentId]: status,
    }));
  };

  const setAllStatus = (status) => {
    const updatedAttendance = {};

    students.forEach((student) => {
      const studentId = getStudentId(student);
      if (studentId) {
        updatedAttendance[studentId] = status;
      }
    });

    setAttendance(updatedAttendance);
  };

  const handleSave = async () => {
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
      const records = students.map((student) => {
        const studentId = getStudentId(student);

        return {
          student: studentId,
          status: attendance[studentId] || 'absent',
        };
      });

      await api.post('/attendance', {
        courseId: selectedCourse,
        date,
        records,
      });

      toast.success('Attendance saved successfully!');

      const { data } = await api.get(`/attendance/course/${selectedCourse}`);
      const attendanceHistory = data.attendance || [];
      setHistory(attendanceHistory);

      if (attendanceHistory.length > 0) {
        setOpenHistoryId(getAttendanceId(attendanceHistory[0]));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourseData = courses.find((course) => getCourseId(course) === selectedCourse);

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(getDateKey(a.date)).getTime();
    const dateB = new Date(getDateKey(b.date)).getTime();

    return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
  });

  if (loadingCourses) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Course</label>
            <select
              className="input"
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">Select Course</option>
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

          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-900">
            Mark Attendance
            {selectedCourseData && (
              <span className="font-semibold">
                {' '}— {selectedCourseData.name} ({selectedCourseData.code}) • {formatDateDisplay(date)}
              </span>
            )}
          </h2>

          {students.length > 0 && (
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => setAllStatus('present')}
                className="text-green-600 hover:underline"
              >
                All Present
              </button>

              <button
                type="button"
                onClick={() => setAllStatus('absent')}
                className="text-red-600 hover:underline"
              >
                All Absent
              </button>

              <button
                type="button"
                onClick={() => setAllStatus('late')}
                className="text-orange-500 hover:underline"
              >
                All Late
              </button>
            </div>
          )}
        </div>

        {!selectedCourse && (
          <div className="text-center py-10 text-gray-400 text-sm">
            Select a course to mark attendance
          </div>
        )}

        {selectedCourse && students.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            No students enrolled in this course
          </div>
        )}

        {students.length > 0 && (
          <>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      Roll No
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const studentId = getStudentId(student);
                    const currentStatus = attendance[studentId] || 'present';

                    return (
                      <tr key={studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {getStudentName(student)}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {getRollNumber(student) || '—'}
                        </td>

                        <td className="px-4 py-3">
                          <div className="grid grid-cols-3 gap-3 max-w-md ml-auto">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, 'present')}
                              className={statusButtonClass(currentStatus, 'present')}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, 'absent')}
                              className={statusButtonClass(currentStatus, 'absent')}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, 'late')}
                              className={statusButtonClass(currentStatus, 'late')}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full mt-4"
            >
              {saving ? 'Saving...' : `Save Attendance for ${formatDateDisplay(date)}`}
            </button>
          </>
        )}
      </div>

      {loadingHistory && (
        <div className="card text-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}

      {!loadingHistory && history.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="font-semibold text-gray-900">
              Attendance by Date & Course
            </h2>

            <select
              className="input sm:w-44"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="recent">Most Recent First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="space-y-3">
            {sortedHistory.map((record) => {
              const recordId = getAttendanceId(record);
              const isOpen = openHistoryId === recordId;
              const counts = getHistoryCounts(record);
              const course = record.course || selectedCourseData;

              return (
                <div
                  key={recordId}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenHistoryId(isOpen ? null : recordId)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-blue-600" />

                      <div className="font-semibold text-gray-900">
                        {formatDateDisplay(record.date)}
                        <span className="mx-2 text-gray-400">•</span>
                        {course?.name || 'Course'}
                        {course?.code ? ` (${course.code})` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 text-sm">
                        <span className="text-green-600">{counts.present} Present</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-red-600">{counts.absent} Absent</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-orange-500">{counts.late} Late</span>
                      </div>

                      {isOpen ? (
                        <FaChevronUp className="text-gray-500" />
                      ) : (
                        <FaChevronDown className="text-gray-500" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                              Student Name
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                              Roll No
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {(record.records || []).map((attendanceRecord) => {
                            const student = attendanceRecord.student || {};

                            return (
                              <tr key={attendanceRecord.id || `${recordId}-${student.id}`}>
                                <td className="px-4 py-3 text-gray-900">
                                  {student.name || 'Unknown Student'}
                                </td>

                                <td className="px-4 py-3 text-gray-600">
                                  {student.roll_number || '—'}
                                </td>

                                <td className="px-4 py-3">
                                  <span className={historyStatusBadge(attendanceRecord.status)}>
                                    {attendanceRecord.status || 'absent'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const buildDefaultAttendance = (students) => {
  const initialAttendance = {};

  students.forEach((student) => {
    const studentId = getStudentId(student);
    if (studentId) {
      initialAttendance[studentId] = 'present';
    }
  });

  return initialAttendance;
};

const buildAttendanceForDate = (students, history, selectedDate) => {
  const initialAttendance = buildDefaultAttendance(students);

  const existingAttendance = (history || []).find(
    (record) => getDateKey(record.date) === selectedDate
  );

  if (!existingAttendance) {
    return initialAttendance;
  }

  (existingAttendance.records || []).forEach((record) => {
    const studentId =
      record.student_id ||
      record.studentId ||
      record.student?.id ||
      record.student?._id;

    if (studentId) {
      initialAttendance[studentId] = record.status || 'absent';
    }
  });

  return initialAttendance;
};

const getHistoryCounts = (record) => {
  const records = record.records || [];

  return {
    total: records.length,
    present: records.filter((item) => item.status === 'present').length,
    absent: records.filter((item) => item.status === 'absent').length,
    late: records.filter((item) => item.status === 'late').length,
  };
};

const statusButtonClass = (currentStatus, buttonStatus) => {
  const isActive = currentStatus === buttonStatus;

  if (buttonStatus === 'present') {
    return isActive
      ? 'px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white transition-all'
      : 'px-4 py-2 rounded-lg text-sm font-medium border border-green-200 text-green-600 hover:bg-green-50 transition-all';
  }

  if (buttonStatus === 'absent') {
    return isActive
      ? 'px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white transition-all'
      : 'px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-all';
  }

  return isActive
    ? 'px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white transition-all'
    : 'px-4 py-2 rounded-lg text-sm font-medium border border-orange-200 text-orange-500 hover:bg-orange-50 transition-all';
};

const historyStatusBadge = (status) => {
  if (status === 'present') {
    return 'inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize bg-green-100 text-green-700';
  }

  if (status === 'absent') {
    return 'inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize bg-red-100 text-red-700';
  }

  return 'inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize bg-orange-100 text-orange-700';
};

const getCourseId = (course) => course.id || course._id;

const getCourseStudents = (course) => course?.students || course?.enrolledStudents || [];

const getStudentId = (student) =>
  student.id || student._id || student.student_id || student.student?.id || student.student?._id;

const getStudentName = (student) =>
  student.name || student.student?.name || student.user?.name || 'Unknown Student';

const getRollNumber = (student) =>
  student.roll_number ||
  student.rollNumber ||
  student.student?.roll_number ||
  student.student?.rollNumber ||
  student.user?.roll_number ||
  student.user?.rollNumber ||
  '';

const getAttendanceId = (attendance) => attendance.id || attendance._id;

const getDateKey = (dateValue) => {
  if (!dateValue) return '';

  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0];
  }

  return new Date(dateValue).toISOString().split('T')[0];
};

const formatDateDisplay = (dateValue) => {
  const dateKey = getDateKey(dateValue);

  if (!dateKey) return '';

  const [year, month, day] = dateKey.split('-');
  return `${Number(month)}/${Number(day)}/${year}`;
};

export default ManageAttendance;