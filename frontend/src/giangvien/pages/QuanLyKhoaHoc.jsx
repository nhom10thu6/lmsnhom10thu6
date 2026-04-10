import React, { useState, useEffect } from 'react';
import { giangVienAPI } from '../services/giangVienAPI';
import '../../admin/styles/classrooms.css';

const parseGiaApi = (gia) => {
  if (gia === null || gia === undefined || gia === '') return 0;
  const n = Number(gia);
  return Number.isFinite(n) ? n : 0;
};

const parseGiaInput = (gia) => {
  const so = String(gia ?? '').replace(/\D/g, '');
  return so ? Number(so) : 0;
};

const formatGia = (gia) => parseGiaApi(gia).toLocaleString('vi-VN');

export default function QuanLyKhoaHoc() {
  const [danhSach, setDanhSach] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý Modal và Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [currentId, setCurrentId] = useState(null); 
  const [formData, setFormData] = useState({ 
    tenKhoaHoc: '', 
    moTa: '', 
    danhMuc: '', 
    gia: '' 
  });

  useEffect(() => {
    loadKhoaHoc();
  }, []);

  const loadKhoaHoc = async () => {
    setIsLoading(true);
    try {
      const response = await giangVienAPI.getKhoaHocCuaToi();
      if (response.data.success) {
        setDanhSach(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi load danh sách:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Hàm mở Modal để THÊM MỚI
  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ tenKhoaHoc: '', moTa: '', danhMuc: '', gia: '' });
    setShowModal(true);
  };

  // 2. Hàm mở Modal để SỬA
  const handleEditClick = (kh) => {
    setIsEditing(true);
    setCurrentId(kh.idKhoaHoc);
    setFormData({
      tenKhoaHoc: kh.tenKhoaHoc,
      moTa: kh.moTa || '',
      danhMuc: kh.danhMuc || '',
      gia: parseGiaApi(kh.gia) > 0 ? String(parseGiaApi(kh.gia)) : ''
    });
    setShowModal(true);
  };

  // 3. Hàm xử lý XÓA khóa học
  const handleDeleteClick = async (id, ten) => {
    if (window.confirm(` có chắc chắn muốn xóa khóa học "${ten}"? \nLưu ý: Hành động này sẽ xóa toàn bộ bài học và quiz liên quan.`)) {
      try {
        const response = await giangVienAPI.xoaKhoaHoc(id);
        if (response.data.success) {
          alert("✅ Đã xóa khóa học thành công!");
          loadKhoaHoc(); // Tải lại danh sách
        }
      } catch (error) {
        alert("❌ Lỗi: " + (error.response?.data?.message || "Không thể xóa khóa học này"));
      }
    }
  };

  // 4. Hàm xử lý gửi Form (Thêm/Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        gia: formData.gia === '' ? 0 : parseGiaInput(formData.gia)
      };

      let response;
      if (isEditing) {
        response = await giangVienAPI.updateKhoaHoc(currentId, payload);
      } else {
        response = await giangVienAPI.taoKhoaHoc(payload);
      }

      if (response.data.success) {
        alert(isEditing ? "✅ Cập nhật thành công!" : "🎉 Tạo khóa học thành công!");
        setShowModal(false);
        loadKhoaHoc();
      }
    } catch (error) {
      alert("❌ Có lỗi xảy ra: " + (error.response?.data?.message || "Vui lòng thử lại"));
    }
  };

  const filteredCourses = danhSach.filter(kh => 
    kh.tenKhoaHoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kh.danhMuc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="classrooms-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>📚 Khóa học của tôi</h2>
        <button className="btn btn-primary" onClick={handleAddClick}>
          + Thêm Khóa Học Mới
        </button>
      </div>

      <div style={{ marginBottom: '20px', maxWidth: '500px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="🔍 Tìm tên khóa học hoặc danh mục..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="classrooms-list">
        <table className="classrooms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên khóa học</th>
              <th>Danh mục</th>
              <th>Giá tiền</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredCourses.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy khóa học nào.</td></tr>
            ) : (
              filteredCourses.map((kh) => (
                <tr key={kh.idKhoaHoc} className="classroom-row">
                  <td className="cell-id">#{kh.idKhoaHoc}</td>
                  <td className="cell-name">{kh.tenKhoaHoc}</td>
                  <td><span className="student-badge">{kh.danhMuc || 'IT'}</span></td>
                  <td className="cell-price">{parseGiaApi(kh.gia) === 0 ? 'Miễn phí' : `${formatGia(kh.gia)}đ`}</td>
                  <td className="cell-actions" style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-edit" onClick={() => handleEditClick(kh)}>
                      Sửa
                    </button>
                    <button 
                      className="btn btn-sm" 
                      style={{ 
                        backgroundColor: '#cd1212', // ✅ ĐỔI THÀNH MÀU XANH DƯƠNG NHẠT
                        color: 'white',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'

                      }}
                      onClick={() => handleDeleteClick(kh.idKhoaHoc, kh.tenKhoaHoc)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px' }}>
            <div className="modal-header">
              <h3>{isEditing ? "📝 Chỉnh sửa khóa học" : "✨ Tạo khóa học mới"}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Tên khóa học (*)</label>
                <input 
                  type="text" className="form-input" required 
                  value={formData.tenKhoaHoc} 
                  onChange={(e) => setFormData({...formData, tenKhoaHoc: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Danh mục (*)</label>
                <select 
                  className="form-input" 
                  required 
                  value={formData.danhMuc} 
                  onChange={(e) => setFormData({...formData, danhMuc: e.target.value})}
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="">-- Chọn danh mục --</option>
                  <option value="IT">Lập trình (IT)</option>
                  <option value="Ngoại ngữ">Ngoại ngữ</option>
                  <option value="Kỹ năng">Kỹ năng mềm</option>
                  <option value="Thiết kế">Thiết kế đồ họa</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Giá tiền (đ)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="Ví dụ: 100.000"
                  value={formData.gia === '' ? '' : Number(formData.gia).toLocaleString('vi-VN')} 
                  onChange={(e) => setFormData({...formData, gia: e.target.value.replace(/\D/g, '')})} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Mô tả ngắn</label>
                <textarea 
                  className="form-input" rows="3"
                  value={formData.moTa} 
                  onChange={(e) => setFormData({...formData, moTa: e.target.value})} 
                ></textarea>
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {isEditing ? "Lưu thay đổi" : "Tạo ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}