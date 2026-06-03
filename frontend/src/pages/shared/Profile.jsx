import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FaUser, FaLock } from 'react-icons/fa';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '', semester: user?.semester || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) return toast.error('Passwords do not match');
    try {
      await api.put('/auth/change-password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed!');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{user?.name?.[0]}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 capitalize">{user?.role} • {user?.department || '—'}</p>
            {user?.rollNumber && <p className="text-sm text-gray-400">{user.rollNumber}</p>}
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FaUser className="text-blue-600" /> Update Profile</h3>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select</option>
                {['Computer Science','Software Engineering','Information Technology','Agriculture','Business Administration','Mathematics'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            {user?.role === 'student' && (
              <div>
                <label className="label">Semester</label>
                <select className="input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  <option value="">Select</option>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FaLock className="text-blue-600" /> Change Password</h3>
        <form onSubmit={handlePassword} className="space-y-4">
          <div><label className="label">Current Password</label><input className="input" type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
          <div><label className="label">New Password</label><input className="input" type="password" minLength={6} value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} required /></div>
          <div><label className="label">Confirm Password</label><input className="input" type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} required /></div>
          <button type="submit" className="btn-primary">Change Password</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
