import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaGraduationCap } from 'react-icons/fa';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', rollNumber: '', department: '', semester: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully!');
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes softFadeUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes softScaleIn {
            from {
              opacity: 0;
              transform: scale(0.92);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes gentleFloat {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-6px);
            }
          }

          .auth-bg {
            animation: softFadeUp 0.5s ease-out both;
          }

          .auth-logo {
            animation: softScaleIn 0.6s ease-out both, gentleFloat 3s ease-in-out infinite;
          }

          .auth-title {
            animation: softFadeUp 0.6s ease-out both;
            animation-delay: 0.12s;
          }

          .auth-card {
            animation: softFadeUp 0.65s ease-out both;
            animation-delay: 0.22s;
          }

          .auth-button {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .auth-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
          }
        `}
      </style>

      <div className="auth-bg min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="auth-title text-center mb-6">
            <div className="auth-logo inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-3 shadow-lg">
              <FaGraduationCap className="text-blue-700 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-blue-200 text-sm">Join University CRM System</p>
          </div>

          <div className="auth-card bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name</label>
                  <input
                    className="input"
                    placeholder="Muhammad Ali"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="ali@uaf.edu.pk"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {form.role === 'student' && <>
                  <div>
                    <label className="label">Roll Number</label>
                    <input
                      className="input"
                      placeholder="2021-CS-001"
                      value={form.rollNumber}
                      onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="label">Semester</label>
                    <select
                      className="input"
                      value={form.semester}
                      onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </>}

                <div className="col-span-2">
                  <label className="label">Department</label>
                  <select
                    className="input"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    <option>Computer Science</option>
                    <option>Software Engineering</option>
                    <option>Information Technology</option>
                    <option>Agriculture</option>
                    <option>Business Administration</option>
                    <option>Mathematics</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-button btn-primary w-full py-3"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already registered?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;