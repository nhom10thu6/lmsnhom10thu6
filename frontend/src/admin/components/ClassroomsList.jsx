import React from 'react';

export default function ClassroomsList({ classrooms, instructors, onEdit, onDelete }) {
  const getInstructorName = (instructorId) => {
    const instructor = instructors.find((i) => i.idNguoiDung === instructorId);
    return instructor?.hoTen || 'Chưa gán';
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return num.toLocaleString('vi-VN') + ' đ';
  };

  if (classrooms.length === 0) {
    return (
      <div className="empty-state">
        <p>Không có khóa học nào</p>
      </div>
    );
  }

  return (
    <div className="classrooms-list">
      <div className="table-wrapper">
        <table className="classrooms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Khóa Học</th>
              <th>Giảng Viên</th>
              <th>Giá</th>
              <th>Danh Mục</th>
              <th>Số Học Viên</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((classroom) => (
              <tr key={classroom.idKhoaHoc} className="classroom-row">
                <td className="cell-id">{classroom.idKhoaHoc}</td>
                <td className="cell-name">{classroom.tenKhoaHoc}</td>
                <td className="cell-instructor">{getInstructorName(classroom.idGiangVien)}</td>
                <td className="cell-price">{formatPrice(classroom.gia)}</td>
                <td className="cell-category">{classroom.danhMuc || '-'}</td>
                <td className="cell-students">
                  <span className="student-badge">{classroom.soHocVien || 0}</span>
                </td>
                <td className="cell-actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => onEdit(classroom)}
                    title="Chỉnh sửa"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => onDelete(classroom.idKhoaHoc)}
                    title="Xóa"
                  >
                    🗑️ Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
