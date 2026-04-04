import React, { useState } from 'react';
import { classroomsAPI } from '../services/api';

export default function ClassroomForm({ classroom, instructors, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState(
    classroom || {
      tenKhoaHoc: '',
      moTa: '',
      gia: '',
      danhMuc: '',
      idGiangVien: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (classroom?.idKhoaHoc) {
        await classroomsAPI.update(classroom.idKhoaHoc, formData);
      } else {
        await classroomsAPI.create(formData);
      }
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lưu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content classroom-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{classroom ? 'Chỉnh Sửa Khóa Học' : 'Thêm Khóa Học Mới'}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="tenKhoaHoc">Tên Khóa Học *</label>
            <input
              id="tenKhoaHoc"
              type="text"
              name="tenKhoaHoc"
              value={formData.tenKhoaHoc}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Nhập tên khóa học"
            />
          </div>

          <div className="form-group">
            <label htmlFor="moTa">Mô Tả</label>
            <textarea
              id="moTa"
              name="moTa"
              value={formData.moTa}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Nhập mô tả khóa học"
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gia">Giá *</label>
              <input
                id="gia"
                type="number"
                name="gia"
                value={formData.gia}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Nhập giá"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="danhMuc">Danh Mục</label>
              <input
                id="danhMuc"
                type="text"
                name="danhMuc"
                value={formData.danhMuc}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập danh mục"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="idGiangVien">Giảng Viên</label>
            <select
              id="idGiangVien"
              name="idGiangVien"
              value={formData.idGiangVien}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">-- Chọn giảng viên --</option>
              {instructors.map((instructor) => (
                <option key={instructor.idNguoiDung} value={instructor.idNguoiDung}>
                  {instructor.hoTen}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
