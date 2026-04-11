import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

export default function ChoThanhToan() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalKhoa, setModalKhoa] = useState(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [qrSrc, setQrSrc] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await hocVienAPI.getKhoaHocChoThanhToan();
      if (res.data.success) setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dongModal = () => {
    if (creatingPayment) return;
    setModalKhoa(null);
    setPaymentInfo(null);
    setStatusText('');
    setCopiedField('');
    setQrSrc('');
  };

  const saoChep = async (field, text) => {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 1500);
    } catch (err) {
      alert('Không thể sao chép. Hãy sao chép thủ công.');
    }
  };

  const kiemTraDaThanhToan = useCallback(async (showSuccessMessage = false) => {
    if (!modalKhoa) return false;

    setCheckingStatus(true);
    try {
      const res = await hocVienAPI.getKhoaHocChoThanhToan();
      const pending = Array.isArray(res.data?.items) ? res.data.items : [];
      const conCho = pending.some((x) => Number(x.idKhoaHoc) === Number(modalKhoa.idKhoaHoc));

      setItems(pending);

      if (!conCho) {
        if (showSuccessMessage) {
          alert('Thanh toán đã được xác nhận. Khóa học đã kích hoạt!');
        }
        setModalKhoa(null);
        setPaymentInfo(null);
        setStatusText('');
        setCopiedField('');
        setQrSrc('');
        return true;
      }

      setStatusText('Đã nhận yêu cầu. Hệ thống đang chờ webhook SePay xác nhận giao dịch.');
      if (showSuccessMessage) {
        alert('Hệ thống chưa nhận webhook xác nhận. Vui lòng chờ 10-30 giây rồi bấm lại.');
      }
      return false;
    } catch (err) {
      console.error(err);
      setStatusText('Không kiểm tra được trạng thái lúc này. Hệ thống sẽ tự thử lại.');
      return false;
    } finally {
      setCheckingStatus(false);
    }
  }, [modalKhoa]);

  useEffect(() => {
    if (!modalKhoa || !paymentInfo || creatingPayment) return undefined;

    const t = setInterval(() => {
      kiemTraDaThanhToan(false);
    }, 5000);

    return () => clearInterval(t);
  }, [modalKhoa, paymentInfo, creatingPayment, kiemTraDaThanhToan]);

  const moModal = useCallback(async (row) => {
    setModalKhoa(row);
    setPaymentInfo(null);
    setStatusText('Đang tạo yêu cầu thanh toán SePay...');
    setCopiedField('');
    setQrSrc('');
    setCreatingPayment(true);

    try {
      const res = await hocVienAPI.taoThanhToanSePay(row.idKhoaHoc);
      if (res.data.success) {
        if (res.data.paid) {
          alert(res.data.message || 'Khóa học đã thanh toán trước đó.');
          setModalKhoa(null);
          setStatusText('');
          await load();
          return;
        }

        setPaymentInfo(res.data);
        setQrSrc(res.data.qrUrl || '');
        setStatusText('Vui lòng chuyển khoản đúng số tiền và đúng nội dung để hệ thống tự động kích hoạt.');
      } else {
        alert(res.data.message || 'Không thể tạo thanh toán SePay.');
        setModalKhoa(null);
        setStatusText('');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Lỗi tạo thanh toán SePay.');
      setModalKhoa(null);
      setStatusText('');
    } finally {
      setCreatingPayment(false);
    }
  }, [load]);

  const onQrError = () => {
    if (!paymentInfo) return;

    if (paymentInfo.qrUrlFallback && qrSrc !== paymentInfo.qrUrlFallback) {
      setQrSrc(paymentInfo.qrUrlFallback);
      setStatusText('QR chính không tương thích ngân hàng, đã chuyển sang QR dự phòng.');
      return;
    }

    setStatusText('Không hiển thị được QR. Vui lòng chuyển khoản thủ công theo thông tin tài khoản và nội dung bên dưới.');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="hv-page-header">
        <h1>Thanh toán khóa học</h1>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 14 }}>
          Quét QR SePay để chuyển khoản và kích hoạt tự động bằng webhook.
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
                💳 SePay - Chuyển khoản cá nhân
              </p>
            </div>

            <div className="hv-pay-body">
              {creatingPayment ? (
                <p className="hv-pay-hint" style={{ fontSize: 13 }}>
                  {statusText || 'Đang tạo yêu cầu thanh toán...'}
                </p>
              ) : paymentInfo ? (
                <>
                  <div className="hv-pay-qr-wrap">
                    {qrSrc ? (
                      <img src={qrSrc} alt="QR SePay" className="hv-pay-qr" onError={onQrError} />
                    ) : (
                      <p className="hv-pay-hint">Không tìm thấy ảnh QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.</p>
                    )}
                  </div>

                  <div className="hv-pay-field">
                    <label>Ngân hàng</label>
                    <div className="hv-pay-static-value">{paymentInfo.thongTinChuyenKhoan?.nganHang || '-'}</div>
                  </div>

                  <div className="hv-pay-field">
                    <label>Số tài khoản</label>
                    <div className="hv-pay-inline-value">
                      <span>{paymentInfo.thongTinChuyenKhoan?.soTaiKhoan || '-'}</span>
                      <button
                        type="button"
                        className="btn btn-secondary hv-pay-copy-btn"
                        onClick={() => saoChep('stk', paymentInfo.thongTinChuyenKhoan?.soTaiKhoan)}
                      >
                        {copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="hv-pay-field">
                    <label>Tên tài khoản</label>
                    <div className="hv-pay-static-value">{paymentInfo.thongTinChuyenKhoan?.tenTaiKhoan || '-'}</div>
                  </div>

                  <div className="hv-pay-field">
                    <label>Nội dung chuyển khoản</label>
                    <div className="hv-pay-inline-value">
                      <span>{paymentInfo.thongTinChuyenKhoan?.noiDung || '-'}</span>
                      <button
                        type="button"
                        className="btn btn-secondary hv-pay-copy-btn"
                        onClick={() => saoChep('nd', paymentInfo.thongTinChuyenKhoan?.noiDung)}
                      >
                        {copiedField === 'nd' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <p className="hv-pay-hint" style={{ marginTop: 10 }}>
                    {statusText}
                  </p>
                </>
              ) : (
                <p className="hv-pay-hint" style={{ fontSize: 13 }}>
                  Không thể tạo mã thanh toán. Vui lòng đóng và thử lại.
                </p>
              )}

              <div className="hv-pay-actions">
                <button type="button" className="btn btn-secondary" onClick={dongModal} disabled={creatingPayment}>
                  Hủy
                </button>

                {qrSrc ? (
                  <a className="btn btn-secondary hv-pay-open-qr" href={qrSrc} target="_blank" rel="noreferrer">
                    Mở QR
                  </a>
                ) : null}

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={creatingPayment || checkingStatus || !paymentInfo}
                  onClick={() => kiemTraDaThanhToan(true)}
                >
                  {checkingStatus ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
