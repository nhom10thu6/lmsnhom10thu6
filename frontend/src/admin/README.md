# Admin Panel Documentation

## 📋 Tổng Quan

Admin Panel là một ứng dụng quản lý hoàn chỉnh cho hệ thống học tập trực tuyến. Nó cung cấp các chức năng quản lý người dùng, khóa học, và thống kê.

## 🏗️ Cấu Trúc Dự Án

```
admin/
├── components/           # Các component React
│   ├── AdminLayout.jsx   # Layout chính của admin
│   ├── UsersList.jsx     # Danh sách người dùng
│   ├── UserForm.jsx      # Form thêm/sửa người dùng
│   ├── ClassroomsList.jsx # Danh sách khóa học
│   └── ClassroomForm.jsx  # Form thêm/sửa khóa học
├── pages/                # Các page chính
│   ├── Dashboard.jsx     # Bảng điều khiển
│   ├── Users.jsx         # Trang quản lý người dùng
│   └── Classrooms.jsx    # Trang quản lý khóa học
├── services/             # API services
│   └── api.js           # Axios instance và API calls
└── styles/              # CSS files
    ├── layout.css       # Layout styling
    ├── dashboard.css    # Dashboard styling
    ├── users.css        # Users page styling
    └── classrooms.css   # Classrooms page styling
```

## 🎯 Các Chức Năng Chính

### 1. **Bảng Điều Khiển (Dashboard)**
- Hiển thị thống kê tổng quan:
  - Tổng số người dùng
  - Tổng số khóa học
  - Số giảng viên
  - Số học viên
- Quick access to main features

### 2. **Quản Lý Người Dùng (Users Management)**
- **Liệt kê**: Xem danh sách tất cả người dùng
- **Lọc**: Lọc theo vai trò (Admin, Giảng viên, Học viên)
- **Thêm**: Tạo người dùng mới
- **Sửa**: Chỉnh sửa thông tin người dùng
- **Xóa**: Xóa người dùng (có các ràng buộc)

**Các trường:**
- Họ Tên (bắt buộc)
- Tài Khoản (bắt buộc, không được trùng)
- Mật Khẩu (bắt buộc khi tạo mới)
- Vai Trò: admin, giangvien, hocvien

### 3. **Quản Lý Khóa Học (Classrooms Management)**
- **Liệt kê**: Xem danh sách khóa học
- **Thêm**: Tạo khóa học mới
- **Sửa**: Chỉnh sửa thông tin khóa học
- **Xóa**: Xóa khóa học
- **Hiển thị**: Số lượng học viên đăng ký

**Các trường:**
- Tên Khóa Học (bắt buộc)
- Mô Tả
- Giá (bắt buộc)
- Danh Mục
- Giảng Viên (tùy chọn)

## 🔌 API Integration

### Base URL Configuration
```javascript
// Local development
const API_BASE_URL = 'http://localhost:5000';

// Production
const API_BASE_URL = 'https://lmsnhom10thu6.onrender.com';
```

### Available Endpoints

#### Users
- `GET /admin/users` - Lấy danh sách người dùng
- `GET /admin/users/:idNguoiDung` - Lấy thông tin người dùng
- `POST /admin/users` - Tạo người dùng mới
- `PUT /admin/users/:idNguoiDung` - Cập nhật người dùng
- `DELETE /admin/users/:idNguoiDung` - Xóa người dùng

#### Classrooms
- `GET /admin/classrooms` - Lấy danh sách khóa học
- `GET /admin/classrooms/:id` - Lấy thông tin khóa học
- `POST /admin/classrooms` - Tạo khóa học mới
- `PUT /admin/classrooms/:id` - Cập nhật khóa học
- `DELETE /admin/classrooms/:id` - Xóa khóa học

## 🛠️ Development

### Add New Feature
1. Create API service method in `admin/services/api.js`
2. Create page component in `admin/pages/`
3. Create related components in `admin/components/`
4. Add styling in `admin/styles/`
5. Update routing in `App.jsx`
6. Add navigation link in `AdminLayout.jsx`
