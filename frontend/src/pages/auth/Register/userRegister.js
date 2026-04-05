import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useRegister = () => {
    const [hoTen, setHoTen] = useState('');
    const [taiKhoan, setTaiKhoan] = useState('');
    const [matKhau, setMatKhau] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [vaiTro, setVaiTro] = useState('hocvien');
    
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword(!showPassword);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (matKhau !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            // ĐÃ BỎ /api ĐỂ ĐỒNG BỘ VỚI TRANG LOGIN
            const response = await fetch('https://lmsnhom10thu6.onrender.com/auth/dangky', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    hoTen: hoTen.trim(), 
                    taiKhoan: taiKhoan.trim(), 
                    matKhau, 
                    vaiTro 
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Đăng ký thành công! Mời bạn đăng nhập.');
                navigate('/login'); 
            } else {
                alert(data.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            alert('Không thể kết nối đến máy chủ.');
        }
    };

    return {
        hoTen, setHoTen,
        taiKhoan, setTaiKhoan,
        matKhau, setMatKhau,
        confirmPassword, setConfirmPassword,
        vaiTro, setVaiTro,
        showPassword, togglePassword,
        handleRegister
    };
};