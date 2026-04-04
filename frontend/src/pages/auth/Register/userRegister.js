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

        if (matKhau.length < 6) {
            alert('Mật khẩu nên có ít nhất 6 ký tự.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/auth/dangky', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hoTen, taiKhoan, matKhau, vaiTro })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                navigate('/login'); 
            } else {
                alert(data.message || 'Lỗi đăng ký.');
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