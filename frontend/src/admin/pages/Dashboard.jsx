import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, classroomsAPI } from '../services/api';
import '../styles/dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [usersRes, classroomsRes] = await Promise.all([usersAPI.getAll(), classroomsAPI.getAll()]);

      const users = usersRes.data;
      const classrooms = classroomsRes.data;

      setStats({
        totalUsers: users.length,
        totalCourses: classrooms.length,
        totalInstructors: users.filter((u) => u.vaiTro === 'giangvien').length,
        totalStudents: users.filter((u) => u.vaiTro === 'hocvien').length,
      });
    } catch (err) {
      setError('Lỗi khi tải thống kê');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Bảng Điều Khiển Quản Trị</h1>
        <p>Quản lý hệ thống học tập</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Tổng Người Dùng</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Tổng Khóa Học</h3>
            <p className="stat-number">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>Giảng Viên</h3>
            <p className="stat-number">{stats.totalInstructors}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <h3>Học Viên</h3>
            <p className="stat-number">{stats.totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quản Lý Nhanh</h2>
        <div className="actions-grid">
          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👤</div>
            <h3>Quản Lý Người Dùng</h3>
            <p>Thêm, sửa, xóa người dùng</p>
          </Link>

          <Link to="/admin/classrooms" className="action-card">
            <div className="action-icon">📚</div>
            <h3>Quản Lý Khóa Học</h3>
            <p>Thêm, sửa, xóa khóa học</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
