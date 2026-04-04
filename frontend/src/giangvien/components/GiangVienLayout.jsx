import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// Import "ké" file CSS của Admin để tận dụng 100% giao diện đã có
import '../../admin/styles/layout.css';

export default function GiangVienLayout() {
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({ hoTen: 'Giảng viên' });

  // Tự động lấy tên người dùng từ localStorage khi vừa vào trang
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);
  const handleLogout = () => {
  if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.clear(); // Xóa sạch dữ liệu đăng nhập
    window.location.href = "/login"; // Quay về trang đăng nhập
  }
};

  return (
    <div className="admin-layout">
      {/* Cột Sidebar bên trái */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>👨‍🏫 Giảng Viên</h1>
          {/* Hiển thị tên Giảng viên thay vì ô nhập ID */}
          <div style={{ marginTop: 15, padding: '12px', backgroundColor: '#202020', borderRadius: '8px' }}>
            <div style={{ fontSize: 12, color: '#999' }}>Đang đăng nhập:</div>
            <div style={{ fontSize: 15, fontWeight: '600', color: '#fff', marginTop: 4 }}>
              {userInfo.hoTen}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/giangvien/dashboard"
            className={`nav-item ${isActive('/giangvien/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Bảng Điều Khiển</span>
          </Link>

          <Link
            to="/giangvien/khoa-hoc"
            className={`nav-item ${isActive('/giangvien/khoa-hoc') ? 'active' : ''}`}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Khóa Học Của Tôi</span>
          </Link>

          <Link
            to="/giangvien/giao-trinh"
            className={`nav-item ${isActive('/giangvien/giao-trinh') ? 'active' : ''}`}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Quản Lý Giáo Trình</span>
          </Link>

          <Link
            to="/giangvien/bang-diem"
            className={`nav-item ${isActive('/giangvien/bang-diem') ? 'active' : ''}`}
          >
            <span className="nav-icon">🎓</span>
            <span className="nav-text">Điểm & Chứng Chỉ</span>
          </Link>

          <hr className="nav-divider" />

          <Link to="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Về Trang Chủ</span>
          </Link>

          {/* Nút Đăng xuất đặt ở đây */}
          <div 
            className="nav-item" 
            onClick={handleLogout} 
            style={{ color: '#ff4d4f', marginTop: 'auto' }} // Màu đỏ để gây chú ý
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Đăng Xuất</span>
          </div>

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