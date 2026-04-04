import React, { useState } from 'react'; // Đã thêm useState
import { Link } from 'react-router-dom';
import { useRegister } from './userRegister';
import './Register.css';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Register = () => {
    const {
        hoTen, setHoTen,
        taiKhoan, setTaiKhoan,
        matKhau, setMatKhau,
        confirmPassword, setConfirmPassword,
        vaiTro, setVaiTro,
        showPassword, togglePassword,
        handleRegister
    } = useRegister();

    // --- THÊM STATE ĐỂ QUẢN LÝ MODAL ---
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [tempUser, setTempUser] = useState(null);

    // Hàm xử lý Đăng ký nhanh bằng Google
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('http://localhost:5000/auth/google-login', {
                idToken: credentialResponse.credential
            });
            
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                
                // NẾU LÀ NGƯỜI MỚI -> HIỆN MODAL LỊCH SỰ
                if (res.data.isNewUser=true) {
                    setTempUser(res.data.user);
                    setShowRoleModal(true); 
                } else {
                    // Nếu là người cũ thì vào thẳng
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    const role = res.data.user.vaiTro;
                    if (role === 'admin') window.location.href = '/admin/dashboard';
                    else if (role === 'giangvien') window.location.href = '/giangvien/dashboard';
                    else window.location.href = '/hocvien';
                }
            }
        } catch (err) {
            console.error("Lỗi Google Login:", err);
            alert("Đăng nhập Google thất bại!");
        }
    };

    // Hàm xử lý khi nhấn chọn vai trò trên Modal
    const selectRole = async (role) => {
    try {
        // 1. Gửi API tạo/cập nhật User trong Database
        const res = await axios.post('http://localhost:5000/auth/update-role', {
            userId: tempUser.id || tempUser.idNguoiDung,
            vaiTro: role
        });

        if (res.data.success) {
            // 2. XÓA SẠCH LocalStorage (Để họ không được "đăng nhập lén")
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // 3. HIỆN THÔNG BÁO THÀNH CÔNG
            alert(`🎉 Chúc mừng! Bạn đã đăng ký tài khoản ${role === 'giangvien' ? 'GIẢNG VIÊN' : 'HỌC VIÊN'} thành công. \nVui lòng đăng nhập để bắt đầu hành trình!`);

            // 4. ĐẨY VỀ TRANG ĐĂNG NHẬP
            window.location.href = '/login'; 
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi hệ thống khi hoàn tất đăng ký!");
    }
};

    return (
        <div className="register-wrapper">
            {/* --- MODAL CHỌN VAI TRÒ (HIỆN LÊN GIỮA MÀN HÌNH) --- */}
            {showRoleModal && (
                <div className="role-modal-overlay">
                    <div className="role-modal-content">
                        <span className="material-symbols-outlined modal-icon">verified_user</span>
                        <h3>Chào mừng thành viên mới! 🎉</h3>
                        <p>Vui lòng xác nhận vai trò của bạn để tiếp tục hành trình học tập.</p>
                        
                        <div className="role-options">
                            <div className="role-item" onClick={() => selectRole('giangvien')}>
                                <span className="material-symbols-outlined">psychology</span>
                                <h4>GIẢNG VIÊN</h4>
                                <span>Tôi muốn tạo khóa học</span>
                            </div>
                            <div className="role-item" onClick={() => selectRole('hocvien')}>
                                <span className="material-symbols-outlined">school</span>
                                <h4>HỌC VIÊN</h4>
                                <span>Tôi muốn tham gia học</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="header">
                <div className="logo">HỆ THỐNG LMS<br />QUẢN LÝ HỌC TẬP</div>
                <div className="nav-links">
                    <span>Cần hỗ trợ?</span>
                    <a href="#help">Help</a>
                </div>
            </header>

            <main className="main-container">
                <div className="register-card">
                    <div className="panel-left">
                        <div className="bg-overlay">
                            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" alt="Academic" />
                        </div>
                        <div className="content-top">
                            <span className="material-symbols-outlined icon-large">auto_stories</span>
                            <h2 className="headline">Kiến tạo tương lai trí tuệ của bạn.</h2>
                            <p className="description">Tham gia cộng đồng học thuật tinh hoa, nơi tri thức được quản lý và truyền tải với tiêu chuẩn cao nhất.</p>
                        </div>
                        <div className="glass-box">
                            <p className="quote">"Nơi giáo dục không chỉ là việc học, mà là một trải nghiệm nghệ thuật curated."</p>
                            <div className="brand-tag">
                                <div className="brand-icon">
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                <span className="brand-text">SCHOLARIS CORE</span>
                            </div>
                        </div>
                    </div>

                    <div className="panel-right">
                        <div className="form-container">
                            <div className="form-header">
                                <h1>Bắt đầu hành trình học tập</h1>
                                <p>Tạo tài khoản cá nhân để tiếp cập kho tàng tri thức.</p>
                            </div>

                            <form className="register-form" onSubmit={handleRegister}>
                                <div className="form-group">
                                    <label htmlFor="fullname">HỌ VÀ TÊN</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">person</span>
                                        <input id="fullname" type="text" placeholder="Nguyễn Văn A" value={hoTen} onChange={(e) => setHoTen(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">EMAIL / TÀI KHOẢN</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">mail</span>
                                        <input id="email" type="email" placeholder="example@scholaris.edu.vn" value={taiKhoan} onChange={(e) => setTaiKhoan(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="password">MẬT KHẨU</label>
                                        <div className="input-wrapper">
                                            <span className="material-symbols-outlined icon">lock</span>
                                            <input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirm_password">XÁC NHẬN</label>
                                        <div className="input-wrapper">
                                            <span className="material-symbols-outlined icon">verified_user</span>
                                            <input id="confirm_password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                            <button type="button" className="toggle-password-reg" onClick={togglePassword}>
                                                 <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="role">VAI TRÒ</label>
                                    <div className="input-wrapper" style={{ padding: 0 }}>
                                        <select id="role" value={vaiTro} onChange={(e) => setVaiTro(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', outline: 'none', fontFamily: 'inherit' }}>
                                            <option value="hocvien">Học viên</option>
                                            <option value="giangvien">Giảng viên</option>
                                        </select>
                                        <span className="material-symbols-outlined icon" style={{ pointerEvents: 'none' }}>badge</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                    Tạo tài khoản
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>

                                <div className="divider"><span>Hoặc đăng ký nhanh</span></div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => alert("Đăng ký Google thất bại!")}
                                        width="350"
                                    />
                                </div>
                            </form>

                            <p className="login-prompt">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="footer-logo">LMS</div>
                <div className="footer-links">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms of Service</a>
                    <a href="#support">Support</a>
                </div>
                <div className="footer-copyright">© 2024 LMS Curator. All rights reserved.</div>
            </footer>
        </div>
    );
};

export default Register;