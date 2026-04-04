import React, { useEffect, useState } from 'react';
import UsersList from '../components/UsersList';
import UserForm from '../components/UserForm';
import { usersAPI } from '../services/api';
import '../styles/users.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll(selectedRole || null);
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải danh sách người dùng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa người dùng này?')) return;

    try {
      await usersAPI.delete(userId);
      setUsers(users.filter((u) => u.idNguoiDung !== userId));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa người dùng');
      console.error(err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleSaveSuccess = () => {
    loadUsers();
    handleCloseForm();
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Quản Lý Người Dùng</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm Người Dùng
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-section">
        <label>Lọc theo vai trò:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Quản Trị Viên</option>
          <option value="giangvien">Giảng Viên</option>
          <option value="hocvien">Học Viên</option>
        </select>
      </div>

      {showForm && (
        <UserForm user={editingUser} onClose={handleCloseForm} onSaveSuccess={handleSaveSuccess} />
      )}

      <UsersList users={users} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
