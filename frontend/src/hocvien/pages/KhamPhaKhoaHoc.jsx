import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

export default function KhamPhaKhoaHoc() {
  const navigate = useNavigate();
  const [khoaHocs, setKhoaHocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await hocVienAPI.getDanhSachKhoaHoc();
      if (res.data.success) {
        setKhoaHocs(res.data.khoaHoc || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dangKy = async (idKhoaHoc) => {
    try {
      const res = await hocVienAPI.dangKyKhoaHoc(idKhoaHoc);
      if (res.data.success) {
        if (res.data.trangThai === 'cho_thanh_toan') {
          const ok = window.confirm(
            `${res.data.message || ''}\n\nBạn có muốn chuyển tới trang thanh toán không?`,
          );
          await load();
          if (ok) navigate('/hocvien/thanh-toan');
        } else {
          alert(res.data.message || 'Đăng ký thành công!');
          await load();
        }
      } else {
        alert(res.data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Lỗi đăng ký');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="hv-page-header">
        <h1>Khám Phá Khóa Học</h1>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="hv-courses-grid">
          {khoaHocs.map((kh) => (
            <div key={kh.idKhoaHoc} className="hv-course-card">
              <div className="hv-course-header">
                <h3>{kh.tenKhoaHoc}</h3>
                <span className="hv-course-category">{kh.danhMuc || 'Chung'}</span>
              </div>
              <div className="hv-course-body">
                <div className="hv-course-meta">
                  <span>👨‍🏫 {kh.giangVien || 'Giảng viên'}</span>
                </div>
                <p className="hv-course-desc">{kh.moTa}</p>
                <div className={`hv-price-tag${Number(kh.gia) === 0 ? ' free' : ''}`}>
                  {Number(kh.gia) === 0 ? 'Miễn phí' : `${Number(kh.gia).toLocaleString('vi-VN')}đ`}
                </div>

                {kh.canHoc ? (
                  <span className="hv-badge-registered">Đã đăng ký</span>
                ) : kh.choThanhToan ? (
                  <>
                    <p style={{ fontSize: 13, color: '#b45309', margin: '10px 0' }}>
                      Đã đăng ký — cần thanh toán để vào học.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => navigate('/hocvien/thanh-toan')}
                    >
                      💳 Đi tới thanh toán
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => dangKy(kh.idKhoaHoc)}
                  >
                    Đăng Ký Ngay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
