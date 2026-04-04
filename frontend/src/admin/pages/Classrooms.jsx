import React, { useEffect, useState } from 'react';
import ClassroomsList from '../components/ClassroomsList';
import ClassroomForm from '../components/ClassroomForm';
import { classroomsAPI, usersAPI } from '../services/api';
import '../styles/classrooms.css';

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classroomId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa khóa học này?')) return;

    try {
      await classroomsAPI.delete(classroomId);
      setClassrooms(classrooms.filter((c) => c.idKhoaHoc !== classroomId));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa khóa học');
      console.error(err);
    }
  };

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClassroom(null);
  };

  const handleSaveSuccess = () => {
    loadData();
    handleCloseForm();
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="classrooms-page">
      <div className="page-header">
        <h1>Quản Lý Khóa Học</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm Khóa Học
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <ClassroomForm
          classroom={editingClassroom}
          instructors={instructors}
          onClose={handleCloseForm}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      <ClassroomsList
        classrooms={classrooms}
        instructors={instructors}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
