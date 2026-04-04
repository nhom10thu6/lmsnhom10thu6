import React, { useState } from 'react'; // Đã thêm useState
import { Link } from 'react-router-dom';
import { useLogin } from './userLogin';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login = () => {
    const { 
        taiKhoan, setTaiKhoan, 
        matKhau, setMatKhau, 
        showPassword, togglePassword, 
        handleLogin 
    } = useLogin();

    // --- STATE ĐỂ HIỆN MODAL CHỌN VAI TRÒ ---
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [tempUser, setTempUser] = useState(null);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('http://localhost:5000/auth/google-login', {
                idToken: credentialResponse.credential
            });
            
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                
                // NẾU LÀ NGƯỜI MỚI -> BẬT MODAL LÊN, CHƯA CHO VÀO TRONG
                if (res.data.isNewUser==true) {
                    setTempUser(res.data.user);
                    setShowRoleModal(true); 
                } else {
                    // NẾU NGƯỜI CŨ -> VÀO THẲNG LUÔN
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    const role = res.data.user.vaiTro;
                    if (role === 'admin') window.location.href = '/admin/dashboard';
                    else if (role === 'giangvien') window.location.href = '/giangvien/dashboard';
                    else window.location.href = '/hocvien';
                }
            }
        } catch (err) {
            console.error("Lỗi Google Login:", err);
            alert("Đăng nhập thất bại!");
        }
    };

    // Hàm gọi khi User bấm chọn nút trên Modal
    const selectRole = async (role) => {
        try {
            const res = await axios.post('http://localhost:5000/auth/update-role', {
                userId: tempUser.id || tempUser.idNguoiDung,
                vaiTro: role
            });
            if (res.data.success) {
                const updatedUser = { ...tempUser, vaiTro: role };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Chọn xong mới chính thức cho chuyển trang
                if (role === 'giangvien') window.location.href = '/giangvien/dashboard';
                else window.location.href = '/hocvien';
            }
        } catch (err) {
            alert("Lỗi cập nhật vai trò!");
        }
    };

    return (
        <div className="login-wrapper">
            {/* --- MODAL CHỌN VAI TRÒ XỊN SÒ --- */}
            {showRoleModal && (
                <div className="role-modal-overlay">
                    <div className="role-modal-content">
                        <div className="modal-header">
                            <span className="material-symbols-outlined">verified_user</span>
                            <h3>Chào mừng bạn đến với LMS!</h3>
                            <p>Bạn tham gia hệ thống với tư cách là:</p>
                        </div>
                        
                        <div className="role-options">
                            <div className="role-card" onClick={() => selectRole('giangvien')}>
                                <span className="material-symbols-outlined">psychology</span>
                                <h4>GIẢNG VIÊN</h4>
                                <p>Tôi muốn tạo nội dung và giảng dạy</p>
                            </div>
                            <div className="role-card" onClick={() => selectRole('hocvien')}>
                                <span className="material-symbols-outlined">school</span>
                                <h4>HỌC VIÊN</h4>
                                <p>Tôi muốn đăng ký và tham gia học</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="header">
                <div className="logo">
                    <span className="material-symbols-outlined" style={{fontSize: '28px'}}>school</span>
                    <span>SCHOLARIS LMS</span>
                </div>
                <div className="nav-links">
                    <a href="#support">Hỗ trợ</a>
                </div>
            </header>

            <main className="main-container">
                <div className="login-card">
                    <div className="panel-left">
                        <img className="bg-image" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" alt="Hợp tác học thuật" />
                        <div className="content-overlay">
                            <div className="text-content">
                                <span className="badge">Kiến tạo tương lai</span>
                                <h1 className="headline">Nâng tầm tri thức thông qua sự tinh tuyển.</h1>
                                <p className="description">Chào mừng bạn đến với LSM, nơi công nghệ gặp gỡ nghệ thuật giảng dạy.</p>
                            </div>
                        </div>
                        <div className="gradient-overlay"></div>
                    </div>

                    <div className="panel-right">
                        <div className="form-container">
                            <div className="form-header">
                                <h2>LMS Xin Chào</h2>
                                <p>Nhập thông tin tài khoản của bạn để tiếp tục.</p>
                            </div>

                            <form className="login-form" onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label htmlFor="email">TÀI KHOẢN (EMAIL)</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">mail</span>
                                        <input id="email" type="text" placeholder="example@scholaris.edu.vn" value={taiKhoan} onChange={(e) => setTaiKhoan(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="label-row">
                                        <label htmlFor="password">MẬT KHẨU</label>
                                        <a href="#forgot" className="forgot-link">Quên mật khẩu?</a>
                                    </div>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">lock</span>
                                        <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} required />
                                        <button type="button" className="toggle-password" onClick={togglePassword}>
                                            <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary">Đăng nhập</button>
                            </form>

                            <div className="divider"><span>Hoặc tiếp tục với</span></div>

                            <div className="social-login" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Lỗi!")} width="350" />
                            </div>

                            <p className="signup-prompt">
                                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;