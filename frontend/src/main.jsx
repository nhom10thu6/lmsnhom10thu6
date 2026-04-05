import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import './style.css' 

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

// --- Import các trang Học Viên ---
import HocVienLayout from './hocvien/components/HocVienLayout.jsx';
import DashboardHV from './hocvien/pages/DashboardHV.jsx';
import KhamPhaKhoaHoc from './hocvien/pages/KhamPhaKhoaHoc.jsx';
import KhoaHocCuaToi from './hocvien/pages/KhoaHocCuaToi.jsx';
import ChiTietKhoaHoc from './hocvien/pages/ChiTietKhoaHoc.jsx';
import BaiHocView from './hocvien/pages/BaiHocView.jsx';
import LamQuiz from './hocvien/pages/LamQuiz.jsx';
import ChungChiHV from './hocvien/pages/ChungChiHV.jsx';
import ChoThanhToan from './hocvien/pages/ChoThanhToan.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* GỠ BỎ GOOGLE OAUTH PROVIDER */}
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào web sẽ chuyển hướng đến trang Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
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

        {/* --- LUỒNG GIAO DIỆN HỌC VIÊN --- */}
        <Route path="/hocvien" element={<HocVienLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHV />} />
          <Route path="khoa-hoc" element={<KhamPhaKhoaHoc />} />
          <Route path="thanh-toan" element={<ChoThanhToan />} />
          <Route path="khoa-hoc-cua-toi" element={<KhoaHocCuaToi />} />
          <Route path="khoa-hoc-cua-toi/:idKhoaHoc" element={<ChiTietKhoaHoc />} />
          <Route path="bai-hoc/:idBaiHoc" element={<BaiHocView />} />
          <Route path="quiz/:idQuiz" element={<LamQuiz />} />
          <Route path="chung-chi" element={<ChungChiHV />} />
        </Route>

        {/* Bắt lỗi đường dẫn không tồn tại */}
        <Route path="*" element={<h1 style={{textAlign: 'center', marginTop: '50px'}}>404 - Trang không tồn tại</h1>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)