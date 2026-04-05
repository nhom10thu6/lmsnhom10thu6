const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

function parseUserId(req) {
  const raw = req.headers['x-user-id'];
  if (raw == null || raw === '') return null;
  const id = parseInt(String(raw), 10);
  return Number.isNaN(id) ? null : id;
}

async function loadUser(req, res, next) {
  try {
    const id = parseUserId(req);
    if (!id) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập (thiếu x-user-id).' });
    }
    const user = await prisma.nguoidung.findUnique({ where: { idNguoiDung: id } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại.' });
    }
    req.user = user;
    req.userId = id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ.' });
  }
}

async function checkAdmin(req, res, next) {
  try {
    const id = parseUserId(req);
    if (!id) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    }
    const user = await prisma.nguoidung.findUnique({ where: { idNguoiDung: id } });
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    }
    if (user.vaiTro !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới được truy cập.' });
    }
    req.user = user;
    req.userId = id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}

async function checkGiangVien(req, res, next) {
  try {
    const id = parseUserId(req);
    if (!id) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }
    const user = await prisma.nguoidung.findUnique({ where: { idNguoiDung: id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }
    if (user.vaiTro !== 'giangvien') {
      return res.status(403).json({ success: false, message: 'Chỉ giảng viên mới được truy cập.' });
    }
    req.user = user;
    req.userId = id;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

module.exports = {
  parseUserId,
  loadUser,
  checkAdmin,
  checkGiangVien,
};
