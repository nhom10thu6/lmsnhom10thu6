import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

export default function KhoaHocCuaToi() {
  const navigate = useNavigate();
  const [dsDangKy, setDsDangKy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDangKy = async () => {
      try {
        const res = await hocVienAPI.getKhoaHocDangKy();
        if (res.data.success) {
          setDsDangKy(res.data.khoaHocDangKy || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDangKy();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div className="hv-page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h1>Khóa Học Của Tôi</h1>
        <Link
          to="/hocvien/thanh-toan"
          style={{ fontSize: 14, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
        >
          💳 Khóa chờ thanh toán
        </Link>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : dsDangKy.length === 0 ? (
        <div className="hv-empty">
           <div className="hv-empty-icon">📚</div>
           <h3>Chưa có khóa học nào</h3>
           <p>Hãy khám phá và đăng ký các khóa học nhé!</p>
        </div>
      ) : (
        <div className="hv-courses-grid">
          {dsDangKy.map(dk => (
            <div key={dk.idKhoaHoc} className="hv-course-card">
              <div className="hv-course-header">
                <h3>{dk.tenKhoaHoc}</h3>
              </div>
              <div className="hv-course-body">
                <p className="hv-course-desc">{dk.moTa}</p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate(`/hocvien/khoa-hoc-cua-toi/${dk.idKhoaHoc}`)}
                >
                  Vào Học Tiếp →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
