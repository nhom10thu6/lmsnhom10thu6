import React from 'react'; 
import { Link } from 'react-router-dom';
import { useLogin } from './userLogin';
import './Login.css';

const Login = () => {
    const { 
        taiKhoan, setTaiKhoan, 
        matKhau, setMatKhau, 
        showPassword, togglePassword, 
        handleLogin 
    } = useLogin();

    return (
        <div className="login-wrapper">
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
                                    {/* ĐỔI NHÃN THÀNH TÊN TÀI KHOẢN */}
                                    <label htmlFor="taiKhoan">TÊN TÀI KHOẢN</label>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">person</span>
                                        <input 
                                            id="taiKhoan" 
                                            type="text" 
                                            placeholder="Nhập tên tài khoản..." 
                                            value={taiKhoan} 
                                            onChange={(e) => setTaiKhoan(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="label-row">
                                        <label htmlFor="password">MẬT KHẨU</label>
                                        <a href="#forgot" className="forgot-link">Quên mật khẩu?</a>
                                    </div>
                                    <div className="input-wrapper">
                                        <span className="material-symbols-outlined icon">lock</span>
                                        <input 
                                            id="password" 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="••••••••" 
                                            value={matKhau} 
                                            onChange={(e) => setMatKhau(e.target.value)} 
                                            required 
                                        />
                                        <button type="button" className="toggle-password" onClick={togglePassword}>
                                            <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary">Đăng nhập</button>
                            </form>

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