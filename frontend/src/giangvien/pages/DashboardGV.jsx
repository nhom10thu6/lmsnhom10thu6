import React, { useState, useEffect } from 'react';
import { giangVienAPI } from '../services/giangVienAPI';
import '../../admin/styles/dashboard.css';
import { Link } from 'react-router-dom';

// Import các Icon
import { 
  BookOpen, 
  ClipboardList, 
  Users, 
  DollarSign, 
  PlusCircle, 
  FileText, 
  ChevronRight 
} from 'lucide-react';

export default function DashboardGV() {
  const [stats, setStats] = useState({
    tongKhoaHoc: 0,
    tongHocVien: 0,
    tongQuiz: 0,
    tongDoanhThu: 0
  });
  
  const [latestCourses, setLatestCourses] = useState([]); 
  const [danhSachDoanhThu, setDanhSachDoanhThu] = useState([]);
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
    <div className="dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Header */}
      <div className="dashboard-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '30px', color: '#ebebec', fontWeight: '800' }}>Bảng Điều Khiển Giảng Viên</h1>
        <p style={{ color: '#ececed', fontWeight: '500' }}>Tổng quan về doanh thu và tiến độ đào tạo hệ thống</p>
      </div>

      {isLoading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#334155', fontWeight: '600' }}>
          ⏳ Đang đồng bộ dữ liệu hệ thống...
        </div>
      ) : (
        <>
          {/* 2. Grid Thống kê (Màu sắc đậm hơn) */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            
            <Link to="/giangvien/khoa-hoc" className="stat-card" style={{ textDecoration: 'none', borderLeft: '6px solid #2563eb', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#1e293b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khóa học</h3>
                <BookOpen size={22} color="#2563eb" />
              </div>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '15px', marginBottom: 0 }}>{stats.tongKhoaHoc}</p>
            </Link>

            <Link to="/giangvien/bang-diem" className="stat-card" style={{ textDecoration: 'none', borderLeft: '6px solid #059669', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#1e293b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Học viên</h3>
                <Users size={22} color="#059669" />
              </div>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '15px', marginBottom: 0 }}>{stats.tongHocVien}</p>
            </Link>

            <Link to="/giangvien/giao-trinh" className="stat-card" style={{ textDecoration: 'none', borderLeft: '6px solid #d97706', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#1e293b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bài kiểm tra</h3>
                <ClipboardList size={22} color="#d97706" />
              </div>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '15px', marginBottom: 0 }}>{stats.tongQuiz}</p>
            </Link>

            <div className="stat-card" style={{ borderLeft: '6px solid #dc2626', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#1e293b', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doanh thu</h3>
                <DollarSign size={22} color="#dc2626" />
              </div>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626', marginTop: '15px', marginBottom: 0 }}>
                {stats.tongDoanhThu.toLocaleString()}đ
              </p>
            </div>
          </div>

          {/* 3. Bảng Doanh Thu (Đậm nét hơn) */}
          <div style={{ marginTop: '40px', background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '22px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              💰 Chi tiết doanh thu khóa học
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f1f5f9', borderBottom: '3px solid #cbd5e1' }}>
                    <th style={{ padding: '18px', color: '#0f172a', fontWeight: '700' }}>Tên khóa học</th>
                    <th style={{ padding: '18px', textAlign: 'center', color: '#0f172a', fontWeight: '700' }}>Học viên</th>
                    <th style={{ padding: '18px', textAlign: 'right', color: '#0f172a', fontWeight: '700' }}>Giá bán</th>
                    <th style={{ padding: '18px', textAlign: 'right', color: '#b91c1c', fontWeight: '800' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachDoanhThu.length > 0 ? danhSachDoanhThu.map(item => (
                    <tr key={item.id} style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <td style={{ padding: '18px', fontWeight: '600', color: '#1e293b' }}>{item.ten}</td>
                      <td style={{ textAlign: 'center', padding: '18px' }}>
                        <span style={{ backgroundColor: '#bbf7d0', color: '#14532d', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                          {item.hocVien} HV
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '18px', color: '#334155', fontWeight: '600' }}>{item.gia.toLocaleString()}đ</td>
                      <td style={{ textAlign: 'right', padding: '18px', fontWeight: '800', color: '#0f172a', fontSize: '17px' }}>
                        {item.doanhThu.toLocaleString()}đ
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#475569', fontWeight: '600' }}>
                        Chưa có dữ liệu giao dịch trên hệ thống.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Thao tác & Hoạt động (Đậm nét) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', marginTop: '40px', marginBottom: '40px' }}>
            
            <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '25px' }}>Thao tác nhanh</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                
                <Link to="/giangvien/khoa-hoc" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: '#e0f2fe', border: '2px solid #7dd3fc', borderRadius: '15px', textDecoration: 'none' }}>
                  <PlusCircle size={40} color="#0369a1" />
                  <span style={{ marginTop: '12px', fontSize: '15px', fontWeight: '700', color: '#0369a1' }}>Tạo khóa học</span>
                </Link>
                
                <Link to="/giangvien/giao-trinh" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: '#d1fae5', border: '2px solid #6ee7b7', borderRadius: '15px', textDecoration: 'none' }}>
                  <FileText size={40} color="#047857" />
                  <span style={{ marginTop: '12px', fontSize: '15px', fontWeight: '700', color: '#047857' }}>Thêm bài giảng</span>
                </Link>

              </div>
            </div>

            <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '25px' }}>Khóa học mới nhất</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {latestCourses.length > 0 ? latestCourses.map(kh => (
                  <div key={kh.idKhoaHoc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px' }}>{kh.tenKhoaHoc}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', fontWeight: '600' }}>Danh mục: {kh.danhMuc}</div>
                    </div>
                    <Link to="/giangvien/giao-trinh" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                      Chi tiết <ChevronRight size={20} />
                    </Link>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#475569', fontWeight: '600' }}>
                    Hệ thống chưa có khóa học mới.
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}