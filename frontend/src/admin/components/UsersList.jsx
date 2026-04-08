import React from 'react';

export default function UsersList({ users, onEdit, onDelete }) {
  const getRoleLabel = (role) => {
    const roles = {
      admin: '👑 Quản Trị Viên',
      giangvien: '🎓 Giảng Viên',
      hocvien: '📖 Học Viên',
    };
    return roles[role] || role;
  };

  if (users.length === 0) {
    return (
      <div className="empty-state">
        <p>Không có người dùng nào</p>
      </div>
    );
  }

  return (
    <div className="users-list">
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ Tên</th>
              <th>Tài Khoản</th>
              <th>Vai Trò</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.idNguoiDung} className={`user-row role-${user.vaiTro}`}>
                <td className="cell-id">{user.idNguoiDung}</td>
                <td className="cell-name">{user.hoTen}</td>
                <td className="cell-account">{user.taiKhoan}</td>
                <td className="cell-role">
                  <span className={`role-badge role-${user.vaiTro}`}>{getRoleLabel(user.vaiTro)}</span>
                </td>
                <td className="cell-actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => onEdit(user)}
                    title="Chỉnh sửa"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => onDelete(user.idNguoiDung)}
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
