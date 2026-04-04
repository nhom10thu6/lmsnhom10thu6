import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import './style.css' // CSS Reset full màn hình của chúng ta

// --- Import các trang Auth ---
import Login from './pages/auth/Login/Login.jsx'
import Register from './pages/auth/Register/Register.jsx'

// --- Import các trang Admin ---
import AdminLayout from './admin/components/AdminLayout.jsx'
import Dashboard from './admin/pages/Dashboard.jsx'
import Users from './admin/pages/Users.jsx'
import Classrooms from './admin/pages/Classrooms.jsx'

// --- Import các trang Giảng viên ---
import GiangVienLayout from './giangvien/components/GiangVienLayout.jsx';
import DashboardGV from './giangvien/pages/DashboardGV.jsx';
import QuanLyKhoaHoc from './giangvien/pages/QuanLyKhoaHoc.jsx';
import QuanLyGiaoTrinh from './giangvien/pages/QuanLyGiaoTrinh.jsx';
import QuanLyBangDiem from './giangvien/pages/QuanLyBangDiem.jsx';

// --- THƯ VIỆN GOOGLE ---
import { GoogleOAuthProvider } from '@react-oauth/google';
import ChooseRole from './pages/auth/ChooseRole';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* CHÈN GOOGLE PROVIDER Ở ĐÂY */}
    <GoogleOAuthProvider clientId="657089288234-f50a73cblf44qneh64id60j6d1i0d3d6.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          {/* Mặc định vào web sẽ chuyển hướng đến trang Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/choose-role" element={<ChooseRole />} />
          
          {/* Các trang Đăng nhập / Đăng ký */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* --- LUỒNG GIAO DIỆN ADMIN --- */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="classrooms" element={<Classrooms />} />
          </Route>

          {/* --- LUỒNG GIAO DIỆN GIẢNG VIÊN --- */}
          <Route path="/giangvien" element={<GiangVienLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardGV />} />
            <Route path="khoa-hoc" element={<QuanLyKhoaHoc />} />
            <Route path="giao-trinh" element={<QuanLyGiaoTrinh />} />
            <Route path="bang-diem" element={<QuanLyBangDiem />} />
          </Route>

          {/* Bắt lỗi đường dẫn không tồn tại */}
          <Route path="*" element={<h1 style={{textAlign: 'center', marginTop: '50px'}}>404 - Trang không tồn tại</h1>} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
)