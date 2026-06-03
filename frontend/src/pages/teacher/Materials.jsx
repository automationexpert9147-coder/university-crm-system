import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaTrash,
  FaLink,
  FaFilePdf,
  FaDownload,
  FaExternalLinkAlt,
  FaUpload,
} from 'react-icons/fa';

const typeOptions = [
  { value: 'lecture', label: 'Lecture Notes' },
  { value: 'slides', label: 'Slides' },
  { value: 'book', label: 'Book/Reference' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' },
  { value: 'other', label: 'Other' },
];

const TeacherMaterials = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [materials, setMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'lecture',
    week: '',
    link: '',
    file: null,
  });

  useEffect(() => {
    api.get('/courses/my')
      .then(({ data }) => setCourses(data.courses || []))
      .catch(() => toast.error('Failed to load courses'));
  }, []);

  const fetchMaterials = async (courseId) => {
    if (!courseId) return;

    try {
      const { data } = await api.get(`/materials/course/${courseId}`);
      setMaterials(data.materials || []);
    } catch (err) {
      toast.error('Failed to load materials');
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setMaterials([]);
    setShowForm(false);

    if (courseId) {
      fetchMaterials(courseId);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      type: 'lecture',
      week: '',
      link: '',
      file: null,
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }

    if (!form.file && !form.link.trim()) {
      toast.error('Please add a file or external link');
      return;
    }

    try {
      setUploading(true);

      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      fd.append('week', form.week);
      fd.append('link', form.link);
      fd.append('courseId', selectedCourse);

      if (form.file) {
        fd.append('file', form.file);
      }

      await api.post('/materials', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Material uploaded!');
      setShowForm(false);
      resetForm();
      fetchMaterials(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/materials/${id}`);
      toast.success('Material deleted');
      fetchMaterials(selectedCourse);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getMaterialId = (m) => m._id || m.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Learning Materials</h1>

        {selectedCourse && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <FaPlus size={12} /> Add Material
          </button>
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
          {courses.map((c) => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.name} {c.code ? `(${c.code})` : ''}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">Add Material</h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input
                  className="input"
                  placeholder="Week 1: Introduction"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Week</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="18"
                  placeholder="e.g. 3"
                  value={form.week}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, week: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Upload File</label>
                <input
                  className="input"
                  type="file"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max file size: 50 MB
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="label">External Link</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://example.com"
                  value={form.link}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Short description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={uploading}
              >
                <FaUpload size={12} />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCourse && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 card text-center py-8 text-gray-400">
              No materials yet
            </div>
          ) : (
            materials.map((m) => {
              const fileUrl = m.fileUrl || m.file_url;
              const fileName = m.fileName || m.file_name;
              const materialId = getMaterialId(m);

              return (
                <div key={materialId} className="card">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                      {m.link ? (
                        <FaLink className="text-blue-600" />
                      ) : (
                        <FaFilePdf className="text-blue-600" />
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(materialId)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete material"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>

                  <p className="font-semibold text-gray-900 mt-3">
                    {m.title}
                  </p>

                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {m.type} {m.week ? `• Week ${m.week}` : ''}
                  </p>

                  {m.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {m.description}
                    </p>
                  )}

                  {fileName && (
                    <p className="text-xs text-gray-400 mt-2 truncate">
                      File: {fileName}
                    </p>
                  )}

                  <div className="mt-3 flex gap-3 flex-wrap">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-green-600 hover:underline flex items-center gap-1"
                      >
                        <FaDownload size={10} /> Download
                      </a>
                    )}

                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FaExternalLinkAlt size={10} /> Open Link
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;