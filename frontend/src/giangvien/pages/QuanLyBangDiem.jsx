import React, { useState, useEffect } from 'react';
import { giangVienAPI } from '../services/giangVienAPI';
import '../../admin/styles/classrooms.css';

export default function QuanLyBangDiem() {
  const [danhSachKhoaHoc, setDanhSachKhoaHoc] = useState([]);
  const [khoaHocDuocChon, setKhoaHocDuocChon] = useState('');
  const [duLieuBangDiem, setDuLieuBangDiem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [listDaCap, setListDaCap] = useState([]);

  // --- 1. DỮ LIỆU MẪU ĐỂ TEST CẤP CHỨNG CHỈ ---
  const duLieuMau = [
    {
      idKetQua: 'mock-1',
      hocVien: { idNguoiDung: 999, hoTen: 'Nguyễn Văn Mẫu A', taiKhoan: 'mau_a@gmail.com' },
      diemSo: 9,
      ngayLamBai: new Date().toISOString(),
    },
    {
      idKetQua: 'mock-2',
      hocVien: { idNguoiDung: 888, hoTen: 'Trần Thị Mẫu B', taiKhoan: 'mau_b@gmail.com' },
      diemSo: 4,
      ngayLamBai: new Date().toISOString(),
    }
  ];

  useEffect(() => {
    const loadKhoaHoc = async () => {
      try {
        const response = await giangVienAPI.getKhoaHocCuaToi();
        if (response.data.success) {
          setDanhSachKhoaHoc(response.data.data);
          if (response.data.data.length > 0) setKhoaHocDuocChon(response.data.data[0].idKhoaHoc);
        }
      } catch (error) { console.error(error); }
    };
    loadKhoaHoc();
  }, []);

  useEffect(() => {
    if (!khoaHocDuocChon) return;
    const loadBangDiem = async () => {
      setIsLoading(true);
      try {
        const response = await giangVienAPI.getBangDiem(parseInt(khoaHocDuocChon));
        if (response.data.success) {
          let rawData = response.data.data;

          // --- TRỘN DATA MẪU VÀO ĐỂ LIÊM TEST ---
          if (rawData && rawData.danhSachQuiz && rawData.danhSachQuiz.length > 0) {
            rawData.danhSachQuiz = rawData.danhSachQuiz.map((quiz, index) => {
              // Mẫu A làm tất cả các bài, Mẫu B chỉ làm bài đầu tiên
              const mockChoQuizNay = index === 0 ? duLieuMau : [duLieuMau[0]]; 
              return {
                ...quiz,
                bangDiem: [...(quiz.bangDiem || []), ...mockChoQuizNay]
              };
            });
          }
          setDuLieuBangDiem(rawData);
        }
      } catch (error) { setDuLieuBangDiem(null); } finally { setIsLoading(false); }
    };
    loadBangDiem();
  }, [khoaHocDuocChon]);

  const handleCapChungChi = async (idNguoiDung, tenHocVien) => {
    if (!window.confirm(`Xác nhận cấp chứng chỉ cho học viên ${tenHocVien}?`)) return;
    // Nếu là ID mẫu thì alert thành công luôn không cần gọi API
    if (idNguoiDung === 999 || idNguoiDung === 888) {
        alert("🎓 [TEST] Cấp chứng chỉ cho dữ liệu mẫu thành công!");
        setListDaCap(prev => [...prev, idNguoiDung]);
        return;
    }
    try {
      const response = await giangVienAPI.capChungChi({ idKhoaHoc: parseInt(khoaHocDuocChon), idNguoiDung: parseInt(idNguoiDung) });
      if (response.data.success) {
        alert("🎓 Cấp chứng chỉ thành công!");
        setListDaCap(prev => [...prev, idNguoiDung]);
      }
    } catch (error) { alert(error.response?.data?.message || "Lỗi cấp chứng chỉ."); }
  };

  const renderTongHopLop = () => {
    if (!duLieuBangDiem || !duLieuBangDiem.danhSachQuiz || duLieuBangDiem.danhSachQuiz.length === 0) return null;
    const tatCaHocVien = [];
    const mapHocVien = new Map();
    duLieuBangDiem.danhSachQuiz.forEach(quiz => {
      quiz.bangDiem?.forEach(kq => {
        if (!mapHocVien.has(kq.hocVien.idNguoiDung)) {
          mapHocVien.set(kq.hocVien.idNguoiDung, kq.hocVien);
          tatCaHocVien.push(kq.hocVien);
        }
      });
    });
    const filteredHocVien = tatCaHocVien.filter(hv => hv.hoTen.toLowerCase().includes(searchStudent.toLowerCase()));

    return (
      <div style={{ background: '#fff', borderRadius: '12px', marginBottom: '40px', overflow: 'hidden', border: '2px solid #3b82f6' }}>
        <div style={{ background: '#3b82f6', color: 'white', padding: '15px 20px' }}><h3>📊 BẢNG TỔNG HỢP ĐIỂM THEO LỚP</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="classrooms-table" style={{ margin: 0 }}>
            <thead style={{ background: '#334155' }}>
              <tr>
                <th style={{ padding: '15px 20px', color: 'white' }}>Học viên</th>
                {duLieuBangDiem.danhSachQuiz.map(q => <th key={q.idQuiz} style={{ color: 'white', textAlign: 'center' }}>{q.tenQuiz}</th>)}
                <th style={{ color: 'white', textAlign: 'right', paddingRight: '20px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHocVien.map(hv => {
                let countDone = 0;
                duLieuBangDiem.danhSachQuiz.forEach(q => {
                  if (q.bangDiem?.find(r => r.hocVien.idNguoiDung === hv.idNguoiDung)) countDone++;
                });
                const hoanThanhHet = countDone === duLieuBangDiem.danhSachQuiz.length;

                return (
                  <tr key={hv.idNguoiDung} className="classroom-row">
                    <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{hv.hoTen}</td>
                    {duLieuBangDiem.danhSachQuiz.map(q => {
                      const ketQua = q.bangDiem?.find(r => r.hocVien.idNguoiDung === hv.idNguoiDung);
                      return (
                        <td key={q.idQuiz} style={{ textAlign: 'center' }}>
                          {ketQua ? <b style={{ color: ketQua.diemSo >= (parseFloat(q.tongDiemToiDa || 10) / 2) ? '#166534' : '#991b1b' }}>{ketQua.diemSo}đ</b> : <span style={{ color: '#cbd5e1' }}>-</span>}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      {hoanThanhHet ? (
                        listDaCap.includes(hv.idNguoiDung) ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>Đã cấp ✅</span> : 
                        <button className="btn btn-sm" style={{ backgroundColor: '#10b981', color: 'white' }} onClick={() => handleCapChungChi(hv.idNguoiDung, hv.hoTen)}>🎓 Cấp CC</button>
                      ) : <span style={{ color: '#94a3b8', fontSize: '11px' }}>Thiếu bài ({countDone}/{duLieuBangDiem.danhSachQuiz.length})</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="classrooms-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e293b' }}>🎓 Điểm & Chứng Chỉ</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" className="form-input" placeholder="🔍 Tìm tên học viên..." style={{ width: '250px' }} value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
          <select className="filter-select" style={{ width: '250px' }} value={khoaHocDuocChon} onChange={(e) => setKhoaHocDuocChon(e.target.value)}>
            {danhSachKhoaHoc.map(kh => <option key={kh.idKhoaHoc} value={kh.idKhoaHoc}>{kh.tenKhoaHoc}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div> : (
        <>
          {renderTongHopLop()}
          <h4 style={{ color: '#64748b', margin: '40px 0 20px' }}>👇 CHI TIẾT TỪNG BÀI KIỂM TRA</h4>
          {duLieuBangDiem?.danhSachQuiz?.filter(q => q.bangDiem?.length > 0).map((quiz) => {
            const diemChuan = parseFloat(quiz.tongDiemToiDa) || 10;
            return (
              <div key={quiz.idQuiz} style={{ background: '#fff', borderRadius: '12px', marginBottom: '30px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ background: '#090202', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>{quiz.tenQuiz} ({diemChuan}đ)</h3>
                  <span>ĐTB: {Number(quiz.thongKe?.diemTrungBinh || 0).toFixed(1)}</span>
                </div>
                <table className="classrooms-table">
                  <thead style={{ background: '#334155' }}>
                    <tr><th style={{ color: 'white', paddingLeft: '20px' }}>Học viên</th><th style={{ color: 'white' }}>Tài khoản</th><th style={{ color: 'white' }}>Điểm số</th><th style={{ color: 'white' }}>Ngày nộp</th><th style={{ color: 'white', textAlign: 'right', paddingRight: '20px' }}>Thao tác</th></tr>
                  </thead>
                  <tbody>
                    {quiz.bangDiem.filter(r => r.hocVien.hoTen.toLowerCase().includes(searchStudent.toLowerCase())).map((ketQua) => (
                      <tr key={ketQua.idKetQua} className="classroom-row">
                        <td style={{ paddingLeft: '20px', fontWeight: 'bold' }}>{ketQua.hocVien.hoTen}</td>
                        <td>{ketQua.hocVien.taiKhoan}</td>
                        <td><span style={{ padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', background: ketQua.diemSo >= (diemChuan / 2) ? '#dcfce7' : '#fee2e2', color: ketQua.diemSo >= (diemChuan / 2) ? '#166534' : '#991b1b' }}>{ketQua.diemSo} / {diemChuan}</span></td>
                        <td>{new Date(ketQua.ngayLamBai).toLocaleDateString('vi-VN')}</td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          {ketQua.diemSo >= (diemChuan / 2) && (listDaCap.includes(ketQua.hocVien.idNguoiDung) ? "Đã cấp ✅" : <button className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: 'white' }} onClick={() => handleCapChungChi(ketQua.hocVien.idNguoiDung, ketQua.hocVien.hoTen)}>🎓 Cấp CC</button>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}