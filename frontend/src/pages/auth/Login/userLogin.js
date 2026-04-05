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
            // ĐÃ BỎ /api ĐỂ KHỚP VỚI ROUTE BACKEND
            const response = await fetch('https://lmsnhom10thu6.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taiKhoan: taiKhoan.trim(), matKhau })
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                
                // LƯU TOKEN VÀO LOCALSTORAGE
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate(data.redirectTo); 
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