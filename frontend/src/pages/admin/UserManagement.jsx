import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', semester: '', rollNumber: '' });

  const fetchUsers = async (role = filter) => {
    setLoading(true);
    const { data } = await api.get(`/admin/users${role ? `?role=${role}` : ''}`);
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/admin/users/${getUserId(editUser)}`, form);
        toast.success('User updated!');
      } else {
        await api.post('/admin/users', form);
        toast.success('User created!');
      }
      setShowForm(false);
      setEditUser(null);
      setForm({ name: '', email: '', password: '', role: 'student', department: '', semester: '', rollNumber: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, department: user.department || '', semester: user.semester || '', rollNumber: getRollNumber(user), password: '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('User deleted');
    fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = { student: 'blue', teacher: 'green', admin: 'purple' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management <span className="text-gray-400 text-lg">({total})</span></h1>
        <button onClick={() => { setShowForm(!showForm); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'student', department: '', semester: '', rollNumber: '' }); }} className="btn-primary flex items-center gap-2">
          <FaPlus size={12} /> Add User
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">{editUser ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            {!editUser && <div className="col-span-2"><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>}
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
              </select>
            </div>
            <div><label className="label">Department</label>
              <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select</option>
                {['Computer Science','Software Engineering','Information Technology','Agriculture','Business Administration','Mathematics'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            {form.role === 'student' && <>
              <div><label className="label">Roll Number</label><input className="input" value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} /></div>
              <div><label className="label">Semester</label>
                <select className="input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                  <option value="">Select</option>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>}
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input className="input pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['', 'student', 'teacher', 'admin'].map(r => (
              <button key={r} onClick={() => { setFilter(r); fetchUsers(r); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {r || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="px-4 py-3 text-left text-gray-500 font-medium">Name</th><th className="px-4 py-3 text-left text-gray-500 font-medium">Email</th><th className="px-4 py-3 text-left text-gray-500 font-medium">Role</th><th className="px-4 py-3 text-left text-gray-500 font-medium">Department</th><th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th><th className="px-4 py-3 text-right text-gray-500 font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(u => (
                <tr key={getUserId(u)} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{u.name?.[0]?.toUpperCase() || 'U'}</div>
                      <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-400">{getRollNumber(u)}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={`bg-${roleColor[u.role]}-100 text-${roleColor[u.role]}-700 px-2 py-0.5 rounded-full text-xs font-medium capitalize`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-600">{u.department || '—'}</td>
                  <td className="px-4 py-3"><span className={`${getIsActive(u) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-0.5 rounded-full text-xs font-medium`}>
  {getIsActive(u) ? 'Active' : 'Inactive'}
</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(u)} className="text-blue-500 hover:text-blue-700 p-1"><FaEdit size={14} /></button>
                      <button onClick={() => handleDelete(getUserId(u))} className="text-red-500 hover:text-red-700 p-1"><FaTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const getUserId = (user) => user.id || user._id;
const getRollNumber = (user) => user.roll_number || user.rollNumber || '';
const getIsActive = (user) => {
  if (typeof user.is_active === 'boolean') return user.is_active;
  if (typeof user.isActive === 'boolean') return user.isActive;
  return false;
};

export default UserManagement;
