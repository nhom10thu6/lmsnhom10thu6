import React, { useState, useEffect } from 'react';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

// Template in chứng chỉ
function PrintCertificate({ data, onClose }) {
  const handlePrint = () => window.print();

  const certFont = "'Cormorant Garamond', 'Lora', 'Be Vietnam Pro', serif";
  const bodyFont = "'Lora', 'Be Vietnam Pro', 'Segoe UI', sans-serif";

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20
    }}>
      {/* Nút đóng - ẩn khi in */}
      <div className="no-print" style={{
        position: 'fixed', top: 16, right: 16, display: 'flex', gap: 10, zIndex: 10000
      }}>
        <button className="btn btn-primary" onClick={handlePrint} style={{ minWidth: 120 }}>
          🖨️ In Chứng Chỉ
        </button>
        <button className="btn btn-secondary" onClick={onClose}>✕ Đóng</button>
      </div>

      {/* Nội dung chứng chỉ */}
      <div id="certificate-print" style={{
        background: 'white',
        width: '794px', minHeight: '562px',
        padding: '40px 60px',
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        textAlign: 'center',
        position: 'relative',
        border: '8px solid #111827',
        fontFamily: bodyFont,
        overflow: 'hidden'
      }}>
        {/* Viền trang trí */}
        <div style={{
          position: 'absolute', inset: 12,
          border: '2px solid #d4af37',
          borderRadius: 6, pointerEvents: 'none'
        }} />

        {/* Logo / Icon */}
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎓</div>

        <div style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#6b7280', marginBottom: 4, fontFamily: bodyFont }}>
          Chứng Nhận Hoàn Thành
        </div>

        <h1 style={{
          fontSize: 38, fontWeight: 700, color: '#111827',
          margin: '0 0 16px', fontFamily: certFont, letterSpacing: 2
        }}>
          CERTIFICATE
        </h1>

        <div style={{ width: 80, height: 2, background: '#d4af37', margin: '0 auto 20px' }} />

        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 8, fontFamily: bodyFont }}>Chứng nhận rằng</p>

        <h2 style={{
          fontSize: 32, fontWeight: 700, color: '#111827',
          margin: '0 0 12px', fontFamily: certFont,
          borderBottom: '2px solid #d4af37', display: 'inline-block', paddingBottom: 6
        }}>
          {data.hoTen}
        </h2>

        <p style={{ fontSize: 15, color: '#6b7280', margin: '12px 0 4px', fontFamily: bodyFont }}>
          đã hoàn thành xuất sắc khóa học
        </p>

        <h3 style={{
          fontSize: 22, fontWeight: 700, color: '#1d4ed8',
          margin: '0 0 20px', fontFamily: certFont
        }}>
          "{data.tenKhoaHoc}"
        </h3>

        <div style={{ width: 80, height: 2, background: '#d4af37', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            {data.tenGiangVien && (
              <div style={{
                fontSize: 15, fontWeight: 700, color: '#111827',
                marginBottom: 6, fontFamily: certFont
              }}>
                {data.tenGiangVien}
              </div>
            )}
            <div style={{ width: 120, height: 1, background: '#374151', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: bodyFont }}>Giảng viên phụ trách</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 28 }}>🏅</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4, fontFamily: bodyFont }}>
              {new Date(data.ngayCap).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
            <div style={{ width: 120, height: 1, background: '#374151', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: bodyFont }}>Ngày cấp</div>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 10, color: '#9ca3af', fontFamily: bodyFont }}>
          Mã chứng chỉ: #{data.idCertificate}
        </div>
      </div>

      {/* CSS in + Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        @media print {
          body * { visibility: hidden; }
          #certificate-print, #certificate-print * { visibility: visible; }

          #certificate-print {
            position: fixed; inset: 0;
            margin: 0; border-radius: 0;
            box-shadow: none;
            width: 100%; min-height: 100vh;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function ChungChiHV() {
  const [chungChis, setChungChis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printData, setPrintData] = useState(null); // dữ liệu chứng chỉ đang in
  const [printing, setPrinting] = useState(null);   // idKhoaHoc đang lấy dữ liệu in

  useEffect(() => {
    const fetchCC = async () => {
      try {
        const res = await hocVienAPI.getDanhSachChungChi();
        if (res.data.success) {
          setChungChis(res.data.certificates || []);
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) {
          setError('Vui lòng đăng nhập lại để xem chứng chỉ.');
        } else {
          setError(err.response?.data?.error || 'Không thể tải chứng chỉ.');
        }
        console.error('Lỗi tải chứng chỉ:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCC();
  }, []);

  const handleInChungChi = async (idKhoaHoc) => {
    setPrinting(idKhoaHoc);
    try {
      const res = await hocVienAPI.inChungChi(idKhoaHoc);
      if (res.data.success) {
        setPrintData(res.data.printData);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể lấy dữ liệu chứng chỉ');
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="hv-page-header">
        <h1>Chứng Chỉ Của Tôi</h1>
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {!loading && !error && `${chungChis.length} chứng chỉ`}
        </span>
      </div>

      {loading ? (
        <div className="hv-empty">
          <div className="hv-empty-icon" style={{ fontSize: 36 }}>⏳</div>
          <p>Đang tải...</p>
        </div>
      ) : error ? (
        <div className="hv-empty">
          <div className="hv-empty-icon">🔐</div>
          <h3>Không thể tải chứng chỉ</h3>
          <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => { window.location.href = '/login'; }}
          >
            Đăng nhập lại
          </button>
        </div>
      ) : chungChis.length === 0 ? (
        <div className="hv-empty">
          <div className="hv-empty-icon">🏆</div>
          <h3>Chưa có chứng chỉ nào</h3>
          <p>Hoàn thành tất cả bài học trong khóa học để nhận chứng chỉ!</p>
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '12px 20px', marginTop: 16,
            fontSize: 13, color: '#92400e', maxWidth: 400
          }}>
            📌 Hoàn thành 100% bài học → Chứng chỉ tự động được cấp
          </div>
        </div>
      ) : (
        <div className="hv-courses-grid">
          {chungChis.map(cc => (
            <div key={cc.idCertificate} className="hv-cert-card">
              <div className="hv-cert-header">
                <span className="hv-cert-seal">🏅</span>
                <h3>Chứng Nhận Hoàn Thành</h3>
              </div>
              <div className="hv-cert-body" style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 17, color: '#111827', fontWeight: 700 }}>
                  {cc.khoahoc?.tenKhoaHoc || 'Khóa học'}
                </h4>
                <div style={{
                  display: 'inline-block', background: '#d1fae5', color: '#065f46',
                  fontSize: 12, padding: '2px 10px', borderRadius: 20,
                  fontWeight: 600, marginBottom: 10
                }}>✅ Đã hoàn thành</div>
                <div className="hv-cert-date" style={{ marginBottom: 16 }}>
                  📅 Cấp ngày: {new Date(cc.ngayCap).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>
                  Mã: #{cc.idCertificate}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleInChungChi(cc.idKhoaHoc)}
                  disabled={printing === cc.idKhoaHoc}
                >
                  {printing === cc.idKhoaHoc ? '⏳ Đang tải...' : '🖨️ Xem & In Chứng Chỉ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal in chứng chỉ */}
      {printData && (
        <PrintCertificate data={printData} onClose={() => setPrintData(null)} />
      )}
    </div>
  );
}
