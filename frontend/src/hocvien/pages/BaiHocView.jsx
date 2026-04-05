import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hocVienAPI } from '../services/hocVienAPI';
import '../styles/hocvien.css';

/** Link /view hoặc /edit → /preview để iframe ít bị 403 */
function driveEmbedUrl(url) {
  if (!url || !url.includes('drive.google.com')) return url;
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return url;
  return `https://drive.google.com/file/d/${m[1]}/preview`;
}

function isGoogleDriveFileUrl(url) {
  return typeof url === 'string' && url.includes('drive.google.com/file/d/');
}

export default function BaiHocView() {
  const { idBaiHoc } = useParams();
  const navigate = useNavigate();
  const [baiHoc, setBaiHoc] = useState(null);
  const [loaiBaiHoc, setLoaiBaiHoc] = useState('');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const videoRef = useRef(null);
  const timeUpdateRef = useRef(null);

  useEffect(() => {
    const fetchBaiHoc = async () => {
      try {
        const res = await hocVienAPI.getBaiHoc(idBaiHoc);
        if (res.data.success) {
          setBaiHoc(res.data.baiHoc);
          setLoaiBaiHoc(res.data.loaiBaiHoc);
          setProgress(res.data.progress);
          if (res.data.progress?.trangThai === 'hoan_thanh') {
            setCompleted(true);
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Không thể tải bài học');
      } finally {
        setLoading(false);
      }
    };
    fetchBaiHoc();
  }, [idBaiHoc]);

  // Cập nhật thời gian học mỗi 10 giây (cho bài video)
  useEffect(() => {
    if (loaiBaiHoc !== 'video' || completed) return;
    timeUpdateRef.current = setInterval(async () => {
      const vid = videoRef.current;
      if (vid && !vid.paused) {
        try {
          await hocVienAPI.updateTime(parseInt(idBaiHoc), Math.floor(vid.currentTime));
        } catch {}
      }
    }, 10000);
    return () => clearInterval(timeUpdateRef.current);
  }, [loaiBaiHoc, completed, idBaiHoc]);

  // Khi video kết thúc → tự động hoàn thành
  const handleVideoEnded = async () => {
    if (!completed) await handleComplete();
  };

  const handleComplete = async () => {
    if (completing || completed) return;
    setCompleting(true);
    try {
      await hocVienAPI.completeBaiHoc(parseInt(idBaiHoc));
      setCompleted(true);
      setProgress(prev => ({ ...prev, trangThai: 'hoan_thanh' }));
    } catch (err) {
      alert('Lỗi đánh dấu hoàn thành');
    } finally {
      setCompleting(false);
    }
  };

  const renderContent = () => {
    if (loaiBaiHoc === 'video' && baiHoc?.videoUrl) {
      // YouTube embed hoặc video thường
      const isYoutube = baiHoc.videoUrl.includes('youtube.com') || baiHoc.videoUrl.includes('youtu.be');
      if (isYoutube) {
        const videoId = baiHoc.videoUrl.includes('youtu.be')
          ? baiHoc.videoUrl.split('youtu.be/')[1]?.split('?')[0]
          : new URL(baiHoc.videoUrl).searchParams.get('v');
        return (
          <div className="hv-video-wrapper">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={baiHoc.tenBaiHoc}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      // Google Drive: thẻ <video src="..."> thường 403; dùng iframe preview
      if (isGoogleDriveFileUrl(baiHoc.videoUrl)) {
        return (
          <div className="hv-video-wrapper">
            <iframe
              src={driveEmbedUrl(baiHoc.videoUrl)}
              title={baiHoc.tenBaiHoc}
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        );
      }
      return (
        <div className="hv-video-wrapper">
          <video
            ref={videoRef}
            src={baiHoc.videoUrl}
            controls
            onEnded={handleVideoEnded}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      );
    }

    if (loaiBaiHoc === 'pdf' && baiHoc?.taiLieuUrl) {
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 20 }}>
          <iframe
            src={driveEmbedUrl(baiHoc.taiLieuUrl)}
            title="PDF"
            width="100%"
            height="600px"
            style={{ border: 'none', display: 'block' }}
          />
        </div>
      );
    }

    if ((loaiBaiHoc === 'word' || loaiBaiHoc === 'ppt') && baiHoc?.taiLieuUrl) {
      return (
        <div style={{
          background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center',
          border: '1px solid #e5e7eb', marginBottom: 20
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>
            {loaiBaiHoc === 'word' ? '📄' : '📊'}
          </div>
          <p style={{ color: '#374151', marginBottom: 16, fontWeight: 500 }}>
            {loaiBaiHoc === 'word' ? 'Tài liệu Word' : 'Bài trình chiếu PowerPoint'}
          </p>
          <a
            href={baiHoc.taiLieuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            📥 Tải xuống tài liệu
          </a>
        </div>
      );
    }

    // Bài học dạng text/nội dung
    return (
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32,
        border: '1px solid #e5e7eb', marginBottom: 20, lineHeight: 1.8,
        color: '#374151', fontSize: 15
      }}>
        {baiHoc?.noiDung ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{baiHoc.noiDung}</p>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            <p>Đọc xong nội dung bài học và bấm "Hoàn Thành" để tiếp tục.</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>⏳ Đang tải bài học...</div>
  );

  if (error) return (
    <div style={{ padding: 20 }}>
      <div className="hv-empty">
        <div className="hv-empty-icon">⚠️</div>
        <h3>{error}</h3>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    </div>
  );

  const idKhoaHoc = baiHoc?.idKhoaHoc;

  return (
    <div style={{ padding: '20px' }}>
      <button className="hv-back-btn" onClick={() => navigate(`/hocvien/khoa-hoc-cua-toi/${idKhoaHoc}`)}>
        ← Quay lại khóa học
      </button>

      <div className="hv-lesson-view" style={{ marginTop: 16 }}>
        {/* Header bài học */}
        <div className="hv-lesson-view-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20 }}>
                {loaiBaiHoc === 'video' ? '🎬 Video' :
                 loaiBaiHoc === 'pdf' ? '📄 PDF' :
                 loaiBaiHoc === 'word' ? '📝 Word' :
                 loaiBaiHoc === 'ppt' ? '📊 PowerPoint' : '📖 Bài học'}
              </span>
              {completed && (
                <span className="hv-status-badge hoan_thanh">✅ Hoàn thành</span>
              )}
            </div>
            <h1 className="hv-lesson-view-header h1" style={{ fontSize: 22 }}>{baiHoc?.tenBaiHoc}</h1>
          </div>
        </div>

        {/* Nội dung bài học */}
        {renderContent()}

        {/* Thanh hành động */}
        <div className="hv-lesson-actions-bar">
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {completed
              ? '🎉 Bạn đã hoàn thành bài học này'
              : loaiBaiHoc === 'video'
              ? '▶️ Xem hết video để hoàn thành tự động'
              : '📌 Đọc xong nội dung rồi bấm hoàn thành'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!completed && (
              <button
                className="btn btn-primary"
                onClick={handleComplete}
                disabled={completing}
                style={{ minWidth: 160 }}
              >
                {completing ? '⏳ Đang lưu...' : '✅ Đánh Dấu Hoàn Thành'}
              </button>
            )}
            {completed && (
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/hocvien/khoa-hoc-cua-toi/${idKhoaHoc}`)}
              >
                → Tiếp Tục Khóa Học
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
