import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

export default function LamQuiz() {
  const { idQuiz } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { diemSo, dat, message, choPhepLamLai }
  const [daLam, setDaLam] = useState(null); // { daLam: true, diemSo }
  const [error, setError] = useState('');
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Kiểm tra đã làm chưa
        const startRes = await hocVienAPI.startQuiz(idQuiz);
        if (startRes.data.daLam) {
          setDaLam(startRes.data);
          setLoading(false);
          return;
        }

        const res = await hocVienAPI.getQuiz(idQuiz);
        if (res.data.success) {
          setQuiz(res.data.quiz);
          setQuestions(res.data.questions);
          const phut = res.data.quiz.thoiGianLamBai || 30;
          setTimeLeft(phut * 60);
          startTimeRef.current = Date.now();
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Không thể tải bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [idQuiz]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft === null || result || daLam) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, result, daLam]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelect = (idCauHoi, option) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [idCauHoi]: option }));
  };

  const handleTextAnswer = (idCauHoi, value) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [idCauHoi]: value }));
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    if (!autoSubmit) {
      const unanswered = questions.filter((q) => {
        const ans = answers[q.idCauHoi];
        if (typeof ans === 'string') return !ans.trim();
        return ans === undefined || ans === null || ans === '';
      });
      if (unanswered.length > 0) {
        const ok = window.confirm(`Bạn còn ${unanswered.length} câu chưa trả lời. Vẫn nộp bài?`);
        if (!ok) return;
      }
    }
    clearTimeout(timerRef.current);
    setSubmitting(true);
    try {
      const thoiGianLamBai = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const res = await hocVienAPI.submitQuiz(idQuiz, answers, thoiGianLamBai);
      setResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Lỗi nộp bài';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [idQuiz, answers, submitting, questions]);

  // Loading
  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#6b7280' }}>⏳ Đang tải bài kiểm tra...</p>
    </div>
  );

  // Lỗi
  if (error) return (
    <div style={{ padding: 20 }}>
      <div className="hv-empty">
        <div className="hv-empty-icon">⚠️</div>
        <h3>{error}</h3>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    </div>
  );

  // Đã làm trước đó (đã đạt >= 5)
  if (daLam) return (
    <div style={{ padding: 20 }}>
      <button className="hv-back-btn" onClick={() => navigate(-1)}>← Quay lại</button>
      <div className="hv-result-card" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 64 }}>🏅</div>
        <h2 style={{ marginTop: 12, color: '#111827' }}>Bạn đã hoàn thành bài này</h2>
        <div className={`hv-result-score pass`}>{Number(daLam.diemSo).toFixed(1)}</div>
        <p style={{ color: '#6b7280', fontSize: 14 }}>điểm</p>
        <p style={{ color: '#059669', fontWeight: 600 }}>Bạn đã đạt bài kiểm tra này!</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate(-1)}>
          Quay lại khóa học
        </button>
      </div>
    </div>
  );

  // Màn hình kết quả sau khi nộp
  if (result) return (
    <div style={{ padding: 20 }}>
      <div className="hv-result-card" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 64 }}>{result.dat ? '🎉' : '😥'}</div>
        <h2 style={{ marginTop: 12, color: '#111827' }}>
          {result.dat ? 'Chúc mừng! Bạn đã đạt!' : 'Chưa đạt'}
        </h2>

        {/* Vòng tròn % */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%', margin: '16px auto',
          background: result.dat
            ? 'linear-gradient(135deg, #059669, #10b981)'
            : 'linear-gradient(135deg, #dc2626, #ef4444)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
            {result.phanTram ?? Math.round((result.diemSo / (result.tongDiemToiDa || 1)) * 100)}%
          </span>
          <span style={{ fontSize: 11, opacity: 0.85 }}>phần trăm</span>
        </div>

        {/* Điểm số */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 12
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
              {Number(result.diemSo).toFixed(1)}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Điểm của bạn</div>
          </div>
          <div style={{ width: 1, background: '#e5e7eb' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6b7280' }}>
              {result.tongDiemToiDa ?? '?'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Tổng điểm</div>
          </div>
          <div style={{ width: 1, background: '#e5e7eb' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {Number(result.diemDat ?? (result.tongDiemToiDa * 0.5)).toFixed(1)}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Điểm đạt (50%)</div>
          </div>
        </div>

        <p style={{
          color: result.dat ? '#059669' : '#dc2626',
          fontWeight: 600, marginBottom: 24, fontSize: 14, padding: '8px 16px',
          background: result.dat ? '#d1fae5' : '#fee2e2', borderRadius: 8
        }}>
          {result.message}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {result.choPhepLamLai && (
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              🔄 Làm lại
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            ← Quay lại khóa học
          </button>
        </div>
      </div>
    </div>
  );

  const isWarning = timeLeft !== null && timeLeft <= 60;

  return (
    <div style={{ padding: '20px' }}>
      <button className="hv-back-btn" onClick={() => navigate(-1)}>← Quay lại</button>

      <div className="hv-quiz-container" style={{ marginTop: 16 }}>
        {/* Header bar */}
        <div className="hv-quiz-header-bar">
          <h2>{quiz?.tenQuiz}</h2>
          {timeLeft !== null && (
            <div className={`hv-timer ${isWarning ? 'warning' : ''}`}>
              {isWarning ? '⚠️ ' : '⏱ '}{formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Câu hỏi */}
        <div className="hv-quiz-body">
          {questions.map((q, idx) => (
            <div key={q.idCauHoi} className="hv-question-block">
              <p className="hv-question-title">
                Câu {idx + 1}: {q.cauHoi}
              </p>
              {((q.loaiCauHoi || '').toLowerCase() === 'tuluan' || Object.keys(q.dapAn || {}).length === 0) ? (
                <textarea
                  className="hv-answer-textarea"
                  placeholder="Nhập câu trả lời của bạn..."
                  value={answers[q.idCauHoi] || ''}
                  onChange={(e) => handleTextAnswer(q.idCauHoi, e.target.value)}
                  rows={4}
                />
              ) : (
                Object.entries(q.dapAn || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className={`hv-answer-option ${answers[q.idCauHoi] === key ? 'selected' : ''}`}
                    onClick={() => handleSelect(q.idCauHoi, key)}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: answers[q.idCauHoi] === key ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, flexShrink: 0
                    }}>{key}</span>
                    <span>{value}</span>
                  </div>
                ))
              )}
            </div>
          ))}

          {/* Footer nộp bài */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Đã trả lời: {Object.keys(answers).length}/{questions.length} câu
            </span>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{ minWidth: 140 }}
            >
              {submitting ? '⏳ Đang nộp...' : '📨 Nộp Bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
