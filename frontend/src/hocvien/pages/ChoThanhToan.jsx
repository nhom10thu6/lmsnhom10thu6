import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

const NGAN_HANG = [
  { value: '', label: '— Chọn ngân hàng —' },
  { value: 'Vietcombank', label: 'Vietcombank (VCB)' },
  { value: 'Techcombank', label: 'Techcombank (TCB)' },
  { value: 'BIDV', label: 'BIDV' },
  { value: 'VietinBank', label: 'VietinBank' },
  { value: 'Agribank', label: 'Agribank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'MB Bank', label: 'MB Bank' },
  { value: 'TPBank', label: 'TPBank' },
  { value: 'Sacombank', label: 'Sacombank' },
];

export default function ChoThanhToan() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [modalKhoa, setModalKhoa] = useState(null);

  const [bankTenNH, setBankTenNH] = useState('');
  const [bankSoTK, setBankSoTK] = useState('');
  const [bankChuTK, setBankChuTK] = useState('');

  const load = async () => {
    try {
      const res = await hocVienAPI.getKhoaHocChoThanhToan();
      if (res.data.success) setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moModal = useCallback((row) => {
    setModalKhoa(row);
    setBankTenNH('');
    setBankSoTK('');
    setBankChuTK('');
  }, []);

  const dongModal = () => {
    if (paying) return;
    setModalKhoa(null);
  };

  const guiThanhToan = async (e) => {
    e.preventDefault();
    if (!modalKhoa) return;

    const payload = {
      phuongThuc: 'bank',
      tenNganHang: bankTenNH,
      soTaiKhoan: bankSoTK.replace(/\D/g, ''),
      tenChuTaiKhoan: bankChuTK.trim(),
    };

    setPaying(true);
    try {
      const res = await hocVienAPI.thanhToanKhoaHoc(modalKhoa.idKhoaHoc, payload);
      if (res.data.success) {
        alert(res.data.message || 'Thanh toán thành công!');
        dongModal();
        await load();
      } else {
        alert(res.data.message || 'Không thể thanh toán');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Lỗi thanh toán');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="hv-page-header">
        <h1>Thanh toán khóa học</h1>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
          Chuyển khoản qua ngân hàng (demo — không kết nối ngân hàng thật).
        </p>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <div className="hv-empty">
          <div className="hv-empty-icon">✅</div>
          <h3>Không có khoá chờ thanh toán</h3>
          <p>Bạn đã kích hoạt hết hoặc chưa đăng ký khoá trả phí nào.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/hocvien/khoa-hoc')}>
            Khám phá khóa học
          </button>
        </div>
      ) : (
        <div className="hv-courses-grid">
          {items.map((row) => (
            <div key={row.idKhoaHoc} className="hv-course-card">
              <div className="hv-course-header">
                <h3>{row.tenKhoaHoc}</h3>
                <span className="hv-course-category" style={{ background: '#fef3c7', color: '#92400e' }}>
                  Chờ thanh toán
                </span>
              </div>
              <div className="hv-course-body">
                <p className="hv-course-desc">{row.moTa}</p>
                <div className="hv-price-tag">
                  {Number(row.gia).toLocaleString('vi-VN')}đ
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                  👨‍🏫 {row.giangVien || 'Giảng viên'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => moModal(row)}
                >
                  🏦 Thanh toán
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalKhoa && (
        <div className="hv-pay-overlay" role="presentation" onClick={dongModal}>
          <div
            className="hv-pay-modal"
            role="dialog"
            aria-labelledby="hv-pay-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="hv-pay-modal-header">
              <h2 id="hv-pay-title">Thanh toán</h2>
              <p>{modalKhoa.tenKhoaHoc}</p>
              <div className="hv-pay-amount">
                {Number(modalKhoa.gia).toLocaleString('vi-VN')}đ
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                🏦 Chuyển khoản ngân hàng
              </p>
            </div>

            <form className="hv-pay-body" onSubmit={guiThanhToan}>
              <div className="hv-pay-field">
                <label htmlFor="hv-bank-name">Ngân hàng</label>
                <select
                  id="hv-bank-name"
                  value={bankTenNH}
                  onChange={(e) => setBankTenNH(e.target.value)}
                  required
                >
                  {NGAN_HANG.map((b) => (
                    <option key={b.value || 'empty'} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hv-pay-field">
                <label htmlFor="hv-bank-stk">Số tài khoản</label>
                <input
                  id="hv-bank-stk"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="VD: 0123456789"
                  value={bankSoTK}
                  onChange={(e) => setBankSoTK(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  required
                />
              </div>
              <div className="hv-pay-field">
                <label htmlFor="hv-bank-owner">Tên chủ tài khoản</label>
                <input
                  id="hv-bank-owner"
                  type="text"
                  autoComplete="name"
                  placeholder="In hoa, không dấu (VD: NGUYEN VAN A)"
                  value={bankChuTK}
                  onChange={(e) => setBankChuTK(e.target.value)}
                  required
                />
              </div>
              <p className="hv-pay-hint">
                Demo: hệ thống chỉ kiểm tra định dạng. Không trừ tiền và không lưu số tài khoản.
              </p>

              <div className="hv-pay-actions">
                <button type="button" className="btn btn-secondary" onClick={dongModal} disabled={paying}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={paying}>
                  {paying ? '⏳ Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
