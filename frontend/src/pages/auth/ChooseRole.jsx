import React from 'react';
import axios from 'axios';

const ChooseRole = () => {
    const handleSelectRole = async (role) => {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            const res = await axios.post('http://localhost:5000/auth/update-role', {
                userId: user.id,
                vaiTro: role
            });
            if (res.data.success) {
                const updatedUser = { ...user, vaiTro: role };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Chuyển hướng đúng nhà
                if (role === 'giangvien') window.location.href = '/giangvien/dashboard';
                else window.location.href = '/hocvien';
            }
        } catch (err) {
            alert("Lỗi cập nhật vai trò!");
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <h1>Chào mừng bạn mới! 🎉</h1>
            <p>Vui lòng chọn vai trò của bạn để tiếp tục:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                <button onClick={() => handleSelectRole('hocvien')} style={{ padding: '15px 30px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}>
                    TÔI LÀ HỌC VIÊN 🎓
                </button>
                <button onClick={() => handleSelectRole('giangvien')} style={{ padding: '15px 30px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px' }}>
                    TÔI LÀ GIẢNG VIÊN 👨‍🏫
                </button>
            </div>
        </div>
    );
};

export default ChooseRole;