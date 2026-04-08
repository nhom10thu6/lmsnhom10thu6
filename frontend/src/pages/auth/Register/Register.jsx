import React from 'react'; 
import { Link } from 'react-router-dom';
import { useRegister } from './userRegister';
import './Register.css';

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

    return (
        <div className="register-wrapper">
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
                                    {/* ĐỔI THÀNH TÊN TÀI KHOẢN */}
                                    <label htmlFor="taiKhoan">TÊN TÀI KHOẢN</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">badge</span>
                                        <input 
                                            id="taiKhoan" 
                                            type="text" 
                                            placeholder="Nhập tên đăng nhập..." 
                                            value={taiKhoan} 
                                            onChange={(e) => setTaiKhoan(e.target.value)} 
                                            required 
                                        />
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
                                        <span className="material-symbols-outlined icon" style={{ pointerEvents: 'none' }}>groups</span>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                    Tạo tài khoản
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
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