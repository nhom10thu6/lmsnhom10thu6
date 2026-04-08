import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

export default function ChiTietKhoaHoc() {
  const { idKhoaHoc } = useParams();
  const navigate = useNavigate();
  const [khoaHoc, setKhoaHoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [claimingCert, setClaimingCert] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await hocVienAPI.getChiTietKhoaHoc(idKhoaHoc);
        if (res.data.success) {
          setKhoaHoc(res.data.khoaHoc);
          const expanded = {};
          res.data.khoaHoc.chuong?.forEach(c => { expanded[c.chuong] = true; });
          setExpandedChapters(expanded);
        }
      } catch (err) {
        const st = err.response?.status;
        const d = err.response?.data;
        if (st === 402 && d?.choThanhToan) {
          setError('PAYMENT_REQUIRED');
        } else {
          setError(d?.error || 'Không thể tải khóa học');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [idKhoaHoc]);

  const toggleChapter = (idx) =>
    setExpandedChapters(prev => ({ ...prev, [idx]: !prev[idx] }));

  // Gọi API cấp chứng chỉ trước khi navigate
  const handleNhanChungChi = async () => {
    setClaimingCert(true);
    try {
      await hocVienAPI.getChungChi(idKhoaHoc);
      navigate('/hocvien/chung-chi');
    } catch (err) {
      const msg = err.response?.data?.error || 'Không thể cấp chứng chỉ';
      alert(msg);
    } finally {
      setClaimingCert(false);
    }
  };

  // ----- Tính tiến độ -----
  const getAllLessons = () => {
    if (!khoaHoc?.chuong) return [];
    return khoaHoc.chuong.flatMap(c => c.baiHoc);
  };

  const calcProgress = () => {
    const all = getAllLessons();
    const done = all.filter(bh => bh.trangThai === 'hoan_thanh').length;
    return { done, total: all.length, pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0 };
  };

  // ----- Ràng buộc: bài học có mở không? -----
  // Bài đầu tiên luôn mở. Các bài sau chỉ mở khi bài trước hoàn thành.
  const isLessonUnlocked = (bh, globalIndex) => {
    if (globalIndex === 0) return true;
    const all = getAllLessons();
    const prev = all[globalIndex - 1];
    return prev?.trangThai === 'hoan_thanh';
  };

  // ----- Ràng buộc: quiz chỉ làm khi hoàn thành hết bài -----
  const allLessonsDone = () => {
    const all = getAllLessons();
    return all.length > 0 && all.every(bh => bh.trangThai === 'hoan_thanh');
  };

  const statusIcon = (trangThai, unlocked) => {
    if (!unlocked) return '🔒';
    if (trangThai === 'hoan_thanh') return '✅';
    if (trangThai === 'dang_hoc') return '▶️';
    return '⭕';
  };

  const statusLabel = { hoan_thanh: 'Hoàn thành', dang_hoc: 'Đang học', chua_hoc: 'Chưa học' };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>⏳ Đang tải...</div>
  );

  if (error) return (
    <div style={{ padding: 20 }}>
      <div className="hv-empty">
        <div className="hv-empty-icon">{error === 'PAYMENT_REQUIRED' ? '💳' : '🔒'}</div>
        <h3>
          {error === 'PAYMENT_REQUIRED'
            ? 'Khóa học chưa được kích hoạt'
            : error}
        </h3>
        {error === 'PAYMENT_REQUIRED' && (
          <p style={{ color: '#6b7280', marginBottom: 16, maxWidth: 420 }}>
            Vui lòng hoàn tất thanh toán để xem bài học và tiến độ.
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {error === 'PAYMENT_REQUIRED' && (
            <button className="btn btn-primary" onClick={() => navigate('/hocvien/thanh-toan')}>
              💳 Thanh toán ngay
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => navigate(error === 'PAYMENT_REQUIRED' ? '/hocvien/khoa-hoc-cua-toi' : '/hocvien/khoa-hoc')}
          >
            {error === 'PAYMENT_REQUIRED' ? '← Khóa học của tôi' : 'Khám Phá Khóa Học'}
          </button>
        </div>
      </div>
    </div>
  );

  const progress = calcProgress();
  const quizUnlocked = allLessonsDone();

  // Tạo danh sách bài học phẳng để tính globalIndex
  let globalIdx = 0;
  const chaptersWithIndex = khoaHoc?.chuong?.map(ch => ({
    ...ch,
    baiHoc: ch.baiHoc.map(bh => ({ ...bh, globalIndex: globalIdx++ }))
  }));

  return (
    <div style={{ padding: '20px' }}>
      {/* Back */}
      <button className="hv-back-btn" onClick={() => navigate('/hocvien/khoa-hoc-cua-toi')}>
        ← Quay lại Khóa học của tôi
      </button>

      {/* Tiêu đề */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '16px 0 20px' }}>
        {khoaHoc?.tenKhoaHoc}
      </h1>

      {/* Progress tổng */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 20
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Tiến độ học tập</span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              {progress.done}/{progress.total} bài hoàn thành
            </span>
          </div>
          <div className="hv-progress-bar-wrap">
            <div className="hv-progress-bar-fill" style={{ width: `${progress.pct}%` }} />
          </div>
          <div className="hv-progress-label" style={{ marginTop: 4 }}>{progress.pct}% hoàn thành</div>
        </div>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: progress.pct === 100 ? '#d1fae5' : '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0
        }}>
          {progress.pct === 100 ? '🏆' : '📚'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* Nội dung bài học */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            Nội dung khóa học
          </h2>
          <div className="hv-content-tree">
            {chaptersWithIndex?.map((ch) => {
              const chDone = ch.baiHoc.filter(b => b.trangThai === 'hoan_thanh').length;
              return (
                <div key={ch.chuong} className="hv-chapter">
                  <div
                    className="hv-chapter-header"
                    onClick={() => toggleChapter(ch.chuong)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span>📖 Chương {ch.chuong}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                      {chDone}/{ch.baiHoc.length} bài &nbsp;
                      {expandedChapters[ch.chuong] ? '▲' : '▼'}
                    </span>
                  </div>

                  {expandedChapters[ch.chuong] && ch.baiHoc.map(bh => {
                    const unlocked = isLessonUnlocked(bh, bh.globalIndex);
                    return unlocked ? (
                      <Link
                        key={bh.idBaiHoc}
                        to={`/hocvien/bai-hoc/${bh.idBaiHoc}`}
                        className="hv-lesson-item"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="hv-lesson-status">{statusIcon(bh.trangThai, true)}</span>
                        <span className={`hv-lesson-name ${bh.trangThai === 'hoan_thanh' ? 'completed' : ''}`}>
                          {bh.tenBaiHoc}
                        </span>
                        <span className={`hv-status-badge ${bh.trangThai}`}>
                          {statusLabel[bh.trangThai] || bh.trangThai}
                        </span>
                      </Link>
                    ) : (
                      <div
                        key={bh.idBaiHoc}
                        className="hv-lesson-item"
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        title="Hoàn thành bài trước để mở khóa"
                      >
                        <span className="hv-lesson-status">🔒</span>
                        <span className="hv-lesson-name" style={{ color: '#9ca3af' }}>
                          {bh.tenBaiHoc}
                        </span>
                        <span className="hv-status-badge chua_hoc">Đã khóa</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Quiz + Chứng chỉ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Quiz */}
          {khoaHoc?.quizzes?.length > 0 && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Bài Kiểm Tra
              </h2>
              {khoaHoc.quizzes.map(quiz => (
                <div key={quiz.idQuiz} className="hv-quiz-card"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                  <div className="hv-quiz-info">
                    <h3>{quiz.tenQuiz}</h3>
                    <p>⏱ {quiz.thoiGianLamBai} phút</p>
                  </div>

                  {quizUnlocked ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => navigate(`/hocvien/quiz/${quiz.idQuiz}`)}
                    >
                      📝 Làm Bài Kiểm Tra
                    </button>
                  ) : (
                    <div style={{
                      width: '100%', padding: '10px 16px', borderRadius: 8,
                      background: '#f3f4f6', color: '#9ca3af', fontSize: 13,
                      textAlign: 'center', border: '1px dashed #d1d5db'
                    }}>
                      🔒 Hoàn thành tất cả bài học để mở khóa
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chứng chỉ */}
          {progress.pct === 100 && (
            <div style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderRadius: 12, padding: 20, color: 'white', textAlign: 'center'
            }}>
              <div style={{ fontSize: 36 }}>🏆</div>
              <h3 style={{ margin: '8px 0 4px', fontSize: 15 }}>Hoàn thành!</h3>
              <p style={{ fontSize: 13, opacity: 0.9, margin: '0 0 12px' }}>
                Bạn đã hoàn thành tất cả bài học
              </p>
              <button
                className="btn"
                style={{ background: 'white', color: '#059669', width: '100%', justifyContent: 'center', fontWeight: 600 }}
                onClick={handleNhanChungChi}
                disabled={claimingCert}
              >
                {claimingCert ? '⏳ Đang cấp chứng chỉ...' : '🏆 Nhận & Xem Chứng Chỉ'}
              </button>
            </div>
          )}

          {/* Hướng dẫn */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#92400e'
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>📌 Lưu ý:</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Học theo thứ tự từng bài</li>
              <li>Hoàn thành bài học để mở bài tiếp theo</li>
              <li>Quiz mở sau khi xong tất cả bài</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
