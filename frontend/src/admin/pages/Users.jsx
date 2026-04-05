import React, { useEffect, useState, useCallback } from 'react';
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Nếu không có keyword search thì load theo role
    if (!searchKeyword.trim()) {
      loadUsers();
    }
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

  const handleSearch = async () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      // Nếu xóa hết keyword thì load lại tất cả
      setIsSearching(false);
      loadUsers();
      return;
    }
    try {
      setIsSearching(true);
      setLoading(true);
      const res = await usersAPI.search(keyword);
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tìm kiếm người dùng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setIsSearching(false);
    loadUsers();
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
    if (isSearching && searchKeyword.trim()) {
      handleSearch();
    } else {
      loadUsers();
    }
    handleCloseForm();
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Quản Lý Người Dùng</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm Người Dùng
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Search bar */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo tài khoản..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchKeyword && (
            <button className="btn-clear-search" onClick={handleClearSearch} title="Xóa tìm kiếm">
              ✕
            </button>
          )}
        </div>
        <button className="btn btn-search" onClick={handleSearch}>
          Tìm Kiếm
        </button>
      </div>

      {/* Filter Role */}
      <div className="filter-section">
        <label>Lọc theo vai trò:</label>
        <select
          value={selectedRole}
          onChange={(e) => { setSelectedRole(e.target.value); setIsSearching(false); setSearchKeyword(''); }}
          className="filter-select"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Quản Trị Viên</option>
          <option value="giangvien">Giảng Viên</option>
          <option value="hocvien">Học Viên</option>
        </select>
        {isSearching && (
          <span className="search-badge">
            🔍 Đang hiển thị kết quả tìm kiếm "{searchKeyword}"
          </span>
        )}
      </div>

      {showForm && (
        <UserForm user={editingUser} onClose={handleCloseForm} onSaveSuccess={handleSaveSuccess} />
      )}

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : (
        <UsersList users={users} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}
