import React, { useState, useEffect } from 'react';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';
import { Link } from 'react-router-dom';

export default function DashboardHV() {
  const [stats, setStats] = useState({ khoaHoc: 0, chungChi: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [khRes, ccRes] = await Promise.all([
          hocVienAPI.getKhoaHocDangKy(),
          hocVienAPI.getDanhSachChungChi()
        ]);
        setStats({
          khoaHoc: khRes.data?.khoaHocDangKy?.length || 0,
          chungChi: ccRes.data?.certificates?.length || 0
        });
      } catch (err) {
        console.error('Lỗi khi lấy thống kê:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div className="hv-dashboard-header">
        <h1>Bảng Điều Khiển Học Viên</h1>
        <p>Chào mừng bạn quay lại, tiếp tục con đường học tập nào!</p>
      </div>

      <div className="hv-stats-grid">
        <Link to="/hocvien/khoa-hoc-cua-toi" className="hv-stat-card">
          <div className="hv-stat-icon">📚</div>
          <div className="hv-stat-content">
            <h3>Khóa Học Đang Học</h3>
            <p className="hv-stat-number">{stats.khoaHoc}</p>
          </div>
        </Link>
        <Link to="/hocvien/chung-chi" className="hv-stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="hv-stat-icon">🏆</div>
          <div className="hv-stat-content">
            <h3>Chứng Chỉ Đạt Được</h3>
            <p className="hv-stat-number">{stats.chungChi}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
