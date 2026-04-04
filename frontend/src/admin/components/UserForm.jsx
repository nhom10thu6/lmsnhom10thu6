import React, { useState } from 'react';
import { usersAPI } from '../services/api';

export default function UserForm({ user, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState(
    user || {
      hoTen: '',
      taiKhoan: '',
      matKhau: '',
      vaiTro: 'hocvien',
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
      if (user?.idNguoiDung) {
        await usersAPI.update(user.idNguoiDung, formData);
      } else {
        if (!formData.matKhau) {
          throw new Error('Vui lòng nhập mật khẩu');
        }
        await usersAPI.create(formData);
      }
      onSaveSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi khi lưu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="hoTen">Họ Tên *</label>
            <input
              id="hoTen"
              type="text"
              name="hoTen"
              value={formData.hoTen}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Nhập họ tên"
            />
          </div>

          <div className="form-group">
            <label htmlFor="taiKhoan">Tài Khoản *</label>
            <input
              id="taiKhoan"
              type="text"
              name="taiKhoan"
              value={formData.taiKhoan}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Nhập tài khoản"
              disabled={!!user}
            />
          </div>

          <div className="form-group">
            <label htmlFor="matKhau">Mật Khẩu {!user && '*'}</label>
            <input
              id="matKhau"
              type="password"
              name="matKhau"
              value={formData.matKhau}
              onChange={handleChange}
              required={!user}
              className="form-input"
              placeholder={user ? 'Để trống nếu không thay đổi' : 'Nhập mật khẩu'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vaiTro">Vai Trò *</label>
            <select
              id="vaiTro"
              name="vaiTro"
              value={formData.vaiTro}
              onChange={handleChange}
              className="form-input"
            >
              <option value="hocvien">Học Viên</option>
              <option value="giangvien">Giảng Viên</option>
              <option value="admin">Quản Trị Viên</option>
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
