import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaGraduationCap, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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

          .auth-demo {
            animation: softFadeUp 0.65s ease-out both;
            animation-delay: 0.35s;
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
        <div className="w-full max-w-md">
          <div className="auth-title text-center mb-8">
            <div className="auth-logo inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
              <FaGraduationCap className="text-blue-700 text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">University CRM</h1>
            <p className="text-blue-200 mt-1">UAF Academic Management Portal</p>
          </div>

          <div className="auth-card bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="your@university.edu"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-button btn-primary w-full py-3 text-base"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              New user?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Create Account
              </Link>
            </p>
          </div>

          <div className="auth-demo mt-6 text-center text-blue-200 text-xs">
            <p>Demo Accounts:</p>
            <p>admin@uaf.edu | student@uaf.edu | teacher@uaf.edu</p>
            <p className="text-blue-300">Password: password123</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;