import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

// Dùng lại layout CSS của admin để đồng bộ giao diện
import '../../admin/styles/layout.css';

export default function HocVienLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ hoTen: 'Học viên' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>🎓 Học Viên</h1>
          <div className="sidebar-user-info" style={{ marginTop: 12 }}>
            <span className="sidebar-user-name">📖 {userInfo.hoTen}</span>
            <span className="sidebar-user-role">Học Viên</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/hocvien/dashboard"
            className={`nav-item ${isActive('/hocvien/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Bảng Điều Khiển</span>
          </Link>

          <Link
            to="/hocvien/khoa-hoc"
            className={`nav-item ${isActive('/hocvien/khoa-hoc') ? 'active' : ''}`}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Khám Phá Khóa Học</span>
          </Link>

          <Link
            to="/hocvien/khoa-hoc-cua-toi"
            className={`nav-item ${isActive('/hocvien/khoa-hoc-cua-toi') ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Khóa Học Của Tôi</span>
          </Link>

          <Link
            to="/hocvien/thanh-toan"
            className={`nav-item ${isActive('/hocvien/thanh-toan') ? 'active' : ''}`}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-text">Thanh Toán</span>
          </Link>

          <Link
            to="/hocvien/chung-chi"
            className={`nav-item ${isActive('/hocvien/chung-chi') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-text">Chứng Chỉ</span>
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
