import React, { useState, useEffect } from 'react';
import { giangVienAPI } from '../services/giangVienAPI';
import '../../admin/styles/dashboard.css';
import { Link } from 'react-router-dom';

export default function DashboardGV() {
  const [stats, setStats] = useState({
    tongKhoaHoc: 0,
    tongHocVien: 0,
    tongQuiz: 0,
    tongDoanhThu: 0
  });
  const [latestCourses, setLatestCourses] = useState([]); 
  const [danhSachDoanhThu, setDanhSachDoanhThu] = useState([]); // State mới cho bảng doanh thu
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await giangVienAPI.getKhoaHocCuaToi();
        if (response.data.success) {
          const dsKhoaHoc = response.data.data;
          
          let tongQuiz = 0;
          let tongHocVien = 0; 
          let tongDoanhThu = 0;

          // Tính toán chi tiết từng khóa học
          const chiTietDoanhThu = dsKhoaHoc.map(kh => {
            const soHocVien = kh.dangky_khoahoc ? kh.dangky_khoahoc.length : 0;
            const giaTien = Number(kh.gia) || 0;
            const doanhThuKhuaHoc = soHocVien * giaTien;

            tongHocVien += soHocVien;
            tongDoanhThu += doanhThuKhuaHoc;
            if (kh.quizzes) tongQuiz += kh.quizzes.length;

            return {
              id: kh.idKhoaHoc,
              ten: kh.tenKhoaHoc,
              gia: giaTien,
              hocVien: soHocVien,
              doanhThu: doanhThuKhuaHoc
            };
          });

          setStats({ 
            tongKhoaHoc: dsKhoaHoc.length, 
            tongHocVien, 
            tongQuiz, 
            tongDoanhThu 
          });
          
          setDanhSachDoanhThu(chiTietDoanhThu);
          setLatestCourses(dsKhoaHoc.slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard" style={{ padding: '20px' }}>
      <div className="dashboard-header">
        <h1>Bảng Điều Khiển Giảng Viên</h1>
        <p>Tổng quan về doanh thu và tiến độ đào tạo của bạn</p>
      </div>

      {isLoading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Grid thống kê chính - Thêm ô Doanh Thu */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <Link to="/giangvien/khoa-hoc" className="stat-card" style={{ textDecoration: 'none', borderLeft: '5px solid #3b82f6' }}>
              <div className="stat-content">
                <h3>Khóa học</h3>
                <p className="stat-number">{stats.tongKhoaHoc}</p>
              </div>
            </Link>

            <Link to="/giangvien/bang-diem" className="stat-card" style={{ textDecoration: 'none', borderLeft: '5px solid #10b981' }}>
              <div className="stat-content">
                <h3>Học viên</h3>
                <p className="stat-number">{stats.tongHocVien}</p>
              </div>
            </Link>

            <Link to="/giangvien/giao-trinh" className="stat-card" style={{ textDecoration: 'none', borderLeft: '5px solid #f59e0b' }}>
              <div className="stat-content">
                <h3>Bài kiểm tra</h3>
                <p className="stat-number">{stats.tongQuiz}</p>
              </div>
            </Link>

            <div className="stat-card" style={{ borderLeft: '5px solid #ef4444', background: '#fff' }}>
              <div className="stat-content">
                <h3 style={{ color: '#64748b' }}>Tổng doanh thu</h3>
                <p className="stat-number" style={{ color: '#ef4444' }}>
                  {stats.tongDoanhThu.toLocaleString()}đ
                </p>
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT DOANH THU MỚI THÊM */}
          <div style={{ marginTop: '40px', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              💰 Chi tiết doanh thu theo khóa học
            </h2>
            <div className="classrooms-list">
              <table className="classrooms-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '15px' }}>Tên khóa học</th>
                    <th style={{ textAlign: 'center' }}>Số học viên</th>
                    <th style={{ textAlign: 'right' }}>Giá bán</th>
                    <th style={{ textAlign: 'right', color: '#ef4444' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachDoanhThu.length > 0 ? danhSachDoanhThu.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{item.ten}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="student-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                          {item.hocVien} HV
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{item.gia.toLocaleString()}đ</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>
                        {item.doanhThu.toLocaleString()}đ
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Chưa có dữ liệu doanh thu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '40px' }}>
            {/* Thao tác nhanh giữ nguyên của Liêm */}
            <div className="quick-actions">
               {/* ... (phần Thao tác nhanh của Liêm) */}
            </div>
            {/* Hoạt động gần đây giữ nguyên của Liêm */}
            <div className="recent-activity">
               {/* ... (phần Khóa học mới nhất của Liêm) */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}