const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

function userPayload(u) {
  return {
    id: u.idNguoiDung,
    idNguoiDung: u.idNguoiDung,
    hoTen: u.hoTen,
    taiKhoan: u.taiKhoan,
    vaiTro: u.vaiTro,
  };
}

function redirectForRole(vaiTro) {
  if (vaiTro === 'admin') return '/admin/dashboard';
  if (vaiTro === 'giangvien') return '/giangvien/dashboard';
  return '/hocvien';
}

router.post('/login', async (req, res) => {
  try {
    const { taiKhoan, matKhau } = req.body;
    if (!taiKhoan || !matKhau) {
      return res.status(400).json({ success: false, message: 'Nhập đủ tài khoản và mật khẩu.' });
    }
    const user = await prisma.nguoidung.findUnique({
      where: { taiKhoan: String(taiKhoan).trim() },
    });
    if (!user || !user.matKhau || user.matKhau !== matKhau) {
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
    }
    return res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      user: userPayload(user),
      redirectTo: redirectForRole(user.vaiTro),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

router.post('/dangky', async (req, res) => {
  try {
    let { hoTen, taiKhoan, matKhau, vaiTro } = req.body;
    hoTen = hoTen ? String(hoTen).trim() : '';
    taiKhoan = taiKhoan ? String(taiKhoan).trim() : '';
    matKhau = matKhau ? String(matKhau) : '';
    if (!hoTen || !taiKhoan || !matKhau) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
    }
    const exists = await prisma.nguoidung.findUnique({ where: { taiKhoan } });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Tài khoản đã tồn tại.' });
    }
    const role = ['admin', 'giangvien', 'hocvien'].includes(vaiTro) ? vaiTro : 'hocvien';
    await prisma.nguoidung.create({
      data: { hoTen, taiKhoan, matKhau, vaiTro: role },
    });
    return res.json({ success: true, message: 'Đăng ký thành công.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});


module.exports = router;