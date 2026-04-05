import React, { useEffect, useState } from 'react';
import ClassroomsList from '../components/ClassroomsList';
import ClassroomForm from '../components/ClassroomForm';
import { classroomsAPI, usersAPI } from '../services/api';
import '../styles/classrooms.css';

const SEARCH_TYPES = [
  { value: 'tenKhoaHoc', label: 'Tên khóa học', icon: '📚', placeholder: 'Nhập tên khóa học...' },
  { value: 'tenGiangVien', label: 'Tên giảng viên', icon: '🎓', placeholder: 'Nhập tên giảng viên...' },
  { value: 'taiKhoan', label: 'Tài khoản giảng viên', icon: '👤', placeholder: 'Nhập tài khoản GV...' },
];

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);

  // Search
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('tenKhoaHoc');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classroomsRes, instructorsRes] = await Promise.all([
        classroomsAPI.getAll(),
        usersAPI.getAll('giangvien'),
      ]);
      setClassrooms(classroomsRes.data);
      setInstructors(instructorsRes.data);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      setIsSearching(false);
      loadData();
      return;
    }
    try {
      setIsSearching(true);
      setLoading(true);
      const params = { [searchType]: keyword };
      const res = await classroomsAPI.search(params);
      setClassrooms(res.data);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tìm kiếm khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchKeyword('');
    setIsSearching(false);
    loadData();
  };

  const handleDelete = async (classroomId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa khóa học này?')) return;
    try {
      await classroomsAPI.delete(classroomId);
      setClassrooms(classrooms.filter((c) => c.idKhoaHoc !== classroomId));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa khóa học');
    }
  };

  const handleEdit = (classroom) => { setEditingClassroom(classroom); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingClassroom(null); };
  const handleSaveSuccess = () => { isSearching ? handleSearch() : loadData(); handleCloseForm(); };

  const currentType = SEARCH_TYPES.find(t => t.value === searchType);

  return (
    <div className="classrooms-page">
      <div className="page-header">
        <h1>Quản Lý Khóa Học</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm Khóa Học
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ===== SEARCH BAR ===== */}
      <div className="search-section">
        <div className="search-bar">
          {/* Dropdown chọn loại */}
          <select
            className="search-type-select"
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value); setSearchKeyword(''); }}
          >
            {SEARCH_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>

          <div className="search-divider" />

          {/* Input tìm kiếm */}
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder={currentType.placeholder}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchKeyword && (
              <button className="btn-clear-search" onClick={handleClear} title="Xóa">✕</button>
            )}
          </div>

          {/* Nút tìm */}
          <button className="btn-search" onClick={handleSearch}>
            🔍 Tìm Kiếm
          </button>
        </div>

        {isSearching && (
          <div className="search-result-info">
            📋 Tìm theo <strong>{currentType.label}</strong> &ldquo;{searchKeyword}&rdquo; — {classrooms.length} kết quả
            <button className="btn-reset-search" onClick={handleClear}>Xem tất cả</button>
          </div>
        )}
      </div>

      {showForm && (
        <ClassroomForm
          classroom={editingClassroom}
          instructors={instructors}
          onClose={handleCloseForm}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {loading ? (
        <div className="loading">Đang tải dữ liệu...</div>
      ) : (
        <ClassroomsList
          classrooms={classrooms}
          instructors={instructors}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
