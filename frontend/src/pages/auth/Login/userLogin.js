import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
    const [taiKhoan, setTaiKhoan] = useState('');
    const [matKhau, setMatKhau] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate();

    const togglePassword = () => setShowPassword(!showPassword);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/auth/login', {
           method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taiKhoan, matKhau })
            });
            const data = await response.json();

            if (data.success) {
                alert(data.message);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate(data.redirectTo); // Chuyển hướng dựa theo role
            } else {
                alert(data.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            alert('Không thể kết nối đến máy chủ.');
        }
    };

    return {
        taiKhoan, setTaiKhoan,
        matKhau, setMatKhau,
        showPassword, togglePassword,
        handleLogin
    };
};