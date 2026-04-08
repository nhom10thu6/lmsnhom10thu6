import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../styles/layout.css';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy thông tin user đăng nhập từ localStorage
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('adminUserId');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>⚙️ Admin Panel</h1>
          {currentUser && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">👑 {currentUser.hoTen || currentUser.taiKhoan}</span>
              <span className="sidebar-user-role">Quản Trị Viên</span>
            </div>
          )}
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

          <button className="nav-item nav-logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Đăng Xuất</span>
          </button>
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
