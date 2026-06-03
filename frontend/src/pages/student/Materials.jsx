import { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FaFilePdf,
  FaVideo,
  FaLink,
  FaBook,
  FaDownload,
  FaExternalLinkAlt,
} from 'react-icons/fa';

const typeIcon = {
  lecture: FaBook,
  book: FaBook,
  slides: FaFilePdf,
  video: FaVideo,
  link: FaLink,
  other: FaFilePdf,
};

const typeColorClass = {
  lecture: 'bg-blue-100 text-blue-600',
  book: 'bg-green-100 text-green-600',
  slides: 'bg-red-100 text-red-600',
  video: 'bg-purple-100 text-purple-600',
  link: 'bg-yellow-100 text-yellow-600',
  other: 'bg-gray-100 text-gray-600',
};

const Materials = () => {
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/courses/my')
      .then(({ data }) => setCourses(data.courses || []))
      .catch(() => setCourses([]));
  }, []);

  const fetchMaterials = async (courseId) => {
    if (!courseId) return;

    setLoading(true);

    try {
      const { data } = await api.get(`/materials/course/${courseId}`);
      setMaterials(data.materials || []);
    } catch (err) {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setFilter('all');
    setMaterials([]);

    if (courseId) {
      fetchMaterials(courseId);
    }
  };

  const filtered =
    filter === 'all'
      ? materials
      : materials.filter((m) => m.type === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Learning Materials</h1>

      <div className="card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <select
              className="input"
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">Select a Course</option>
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'lecture', 'slides', 'book', 'video', 'link', 'other'].map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {!selectedCourse ? (
        <div className="card text-center py-12">
          <FaBook size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Select a course to view materials</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No materials found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const Icon = typeIcon[m.type] || FaBook;
            const iconClass = typeColorClass[m.type] || typeColorClass.other;
            const fileUrl = m.fileUrl || m.file_url;
            const fileName = m.fileName || m.file_name;
            const materialId = m._id || m.id;

            return (
              <div
                key={materialId}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
                  >
                    <Icon />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {m.title}
                    </p>

                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {m.type} {m.week ? `• Week ${m.week}` : ''}
                    </p>

                    {m.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {m.description}
                      </p>
                    )}

                    {fileName && (
                      <p className="text-xs text-gray-400 mt-2 truncate">
                        File: {fileName}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      by {m.uploadedBy?.name || 'Teacher'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 flex-wrap">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <FaDownload size={10} /> Download
                    </a>
                  )}

                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <FaExternalLinkAlt size={10} /> Open Link
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Materials;