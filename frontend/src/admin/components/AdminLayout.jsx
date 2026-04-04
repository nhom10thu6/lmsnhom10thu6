import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getAdminUserId, setAdminUserId } from '../services/api';
import '../styles/layout.css';

export default function AdminLayout() {
  const location = useLocation();
  const [adminId, setAdminId] = React.useState(getAdminUserId());
  const [saveMessage, setSaveMessage] = React.useState('');

  const isActive = (path) => location.pathname.startsWith(path);
  const handleSaveAdminId = () => {
    if (!adminId || Number.isNaN(Number(adminId))) {
      setSaveMessage('ID admin không hợp lệ');
      return;
    }
    setAdminUserId(adminId);
    setSaveMessage('Đã lưu ID admin');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>⚙️ Admin Panel</h1>
          <div style={{ marginTop: 12 }}>
            <input
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Admin ID"
              className="form-input"
              style={{ marginBottom: 8 }}
            />
            <button type="button" className="btn btn-sm btn-edit" onClick={handleSaveAdminId}>
              Lưu ID
            </button>
            {saveMessage && <p style={{ fontSize: 12, marginTop: 8 }}>{saveMessage}</p>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/admin"
            className={`nav-item ${
              isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/classrooms')
                ? 'active'
                : ''
            }`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Bảng Điều Khiển</span>
          </Link>

          <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
            <span className="nav-icon">👥</span>
            <span className="nav-text">Người Dùng</span>
          </Link>

          <Link
            to="/admin/classrooms"
            className={`nav-item ${isActive('/admin/classrooms') ? 'active' : ''}`}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Khóa Học</span>
          </Link>

          <hr className="nav-divider" />

          <a href="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Về Trang Chủ</span>
          </a>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
