const express = require('express');
const router = express.Router();

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const { checkGiangVien } = require('../middleware/middleware');
const { chuaKyTuNguyHiem } = require('../../helper/helper.js');

const parseGiaInput = (gia) => {
  if (gia === undefined || gia === null || gia === '') return 0;
  if (typeof gia === 'number') {
    return Number.isFinite(gia) ? gia : NaN;
  }

  const raw = String(gia).trim().replace(/[^\d.,-]/g, '');
  if (raw === '') return NaN;

  // Cho phép nhập kiểu 100.000 / 1,000,000 và quy về số nguyên VND.
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) {
    return Number(raw.replace(/[.,]/g, ''));
  }

  const normalized = raw.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const formatGia = (gia) =>{
  if (gia === null || gia === undefined) return '0';
  return parseFloat(gia).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

const formatKhoaHoc = (khoaHoc) => {
  return {
    ...khoaHoc,
    gia: formatGia(khoaHoc.gia)
  }
}
/* =========================
   TẠO KHÓA HỌC
========================= */
router.post("/tao-khoa-hoc", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;
    const { tenKhoaHoc, moTa, danhMuc, gia } = req.body;

    // ===== VALIDATE TEN =====
    if (!tenKhoaHoc || typeof tenKhoaHoc !== 'string' || tenKhoaHoc.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Tên khóa học không được để trống"
      });
    }

    const ten = tenKhoaHoc.trim();

    if (ten.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Tên khóa học phải >= 5 ký tự"
      });
    }

    if (ten.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Tên khóa học không được vượt quá 255 ký tự"
      });
    }

    if (chuaKyTuNguyHiem(ten)) {
      return res.status(400).json({
        success: false,
        message: "Tên khóa học chứa ký tự không hợp lệ"
      });
    }

    // ===== VALIDATE GIA =====
    let giaParsed = 0;

    if (gia !== undefined && gia !== null) {
      giaParsed = parseGiaInput(gia);

      if (isNaN(giaParsed) || giaParsed < 0) {
        return res.status(400).json({
          success: false,
          message: "Giá phải là số >= 0"
        });
      }

      if (giaParsed > 100000000) {
        return res.status(400).json({
          success: false,
          message: "Giá quá lớn"
        });
      }
    }

    // ===== CHECK TRÙNG =====
    const trungTen = await prisma.khoahoc.findFirst({
      where: {
        tenKhoaHoc: ten,
        idGiangVien
      }
    });

    if (trungTen) {
      return res.status(400).json({
        success: false,
        message: "Tên khóa học đã tồn tại"
      });
    }

    // ===== CREATE =====
    const khoaHoc = await prisma.khoahoc.create({
      data: {
        tenKhoaHoc: ten,
        moTa: moTa?.trim() ?? null,
        danhMuc: danhMuc?.trim() ?? null,
        gia: giaParsed,
        idGiangVien
      }
    });

    return res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công",
      data: formatKhoaHoc(khoaHoc)
    });

  } catch (error) {
    console.error("Lỗi tạo khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =========================
   CẬP NHẬT KHÓA HỌC
========================= */
router.put("/sua-khoa-hoc/:id", checkGiangVien, async (req, res) => {
  try {
    const { id } = req.params;
    const idGiangVien = req.user.idNguoiDung;
    const { tenKhoaHoc, moTa, danhMuc, gia } = req.body;

    // 1. Kiểm tra khóa học có tồn tại và thuộc về giảng viên này không
    const khoaHocHienTai = await prisma.khoahoc.findUnique({
      where: { idKhoaHoc: parseInt(id) }
    });

    if (!khoaHocHienTai) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });
    }

    if (khoaHocHienTai.idGiangVien !== idGiangVien) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền sửa khóa học này" });
    }

    // 2. Validate tên (nếu có thay đổi)
    let tenUpdate = khoaHocHienTai.tenKhoaHoc;
    if (tenKhoaHoc) {
      const ten = tenKhoaHoc.trim();
      if (ten.length < 5 || ten.length > 255 || chuaKyTuNguyHiem(ten)) {
        return res.status(400).json({ success: false, message: "Tên khóa học không hợp lệ" });
      }
      
      // Kiểm tra trùng tên với khóa học KHÁC của cùng giảng viên
      const trungTen = await prisma.khoahoc.findFirst({
        where: {
          tenKhoaHoc: ten,
          idGiangVien,
          NOT: { idKhoaHoc: parseInt(id) }
        }
      });
      if (trungTen) {
        return res.status(400).json({ success: false, message: "Tên khóa học này đã tồn tại" });
      }
      tenUpdate = ten;
    }

    // 3. Validate giá (nếu có thay đổi)
    let giaUpdate = khoaHocHienTai.gia;
    if (gia !== undefined) {
      const giaParsed = parseGiaInput(gia);
      if (isNaN(giaParsed) || giaParsed < 0 || giaParsed > 100000000) {
        return res.status(400).json({ success: false, message: "Giá không hợp lệ" });
      }
      giaUpdate = giaParsed;
    }

    // 4. Tiến hành cập nhật
    const khoaHocCapNhat = await prisma.khoahoc.update({
      where: { idKhoaHoc: parseInt(id) },
      data: {
        tenKhoaHoc: tenUpdate,
        moTa: moTa !== undefined ? moTa.trim() : khoaHocHienTai.moTa,
        danhMuc: danhMuc !== undefined ? danhMuc.trim() : khoaHocHienTai.danhMuc,
        gia: giaUpdate
      }
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật khóa học thành công",
      data: formatKhoaHoc(khoaHocCapNhat)
    });

  } catch (error) {
    console.error("Lỗi sửa khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =========================
   XÓA KHÓA HỌC
========================= */
router.delete("/xoa-khoa-hoc/:id", checkGiangVien, async (req, res) => {
  try {
    const { id } = req.params;
    const idGiangVien = req.user.idNguoiDung;
    const idKhoaHoc = parseInt(id, 10);

    if (Number.isNaN(idKhoaHoc)) {
      return res.status(400).json({ success: false, message: "ID khóa học không hợp lệ" });
    }

    // 1. Kiểm tra tồn tại và quyền sở hữu
    const khoaHoc = await prisma.khoahoc.findUnique({
      where: { idKhoaHoc }
    });

    if (!khoaHoc) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });
    }

    if (khoaHoc.idGiangVien !== idGiangVien) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa khóa học này" });
    }

    // 2. Dọn dữ liệu liên quan để tránh lỗi khóa ngoại (P2003)
    const quizzes = await prisma.quizzes.findMany({
      where: { idKhoaHoc },
      select: { idQuiz: true }
    });
    const quizIds = quizzes.map((q) => q.idQuiz);

    await prisma.$transaction(async (tx) => {
      if (quizIds.length > 0) {
        await tx.quiz_results.deleteMany({
          where: { idQuiz: { in: quizIds } }
        });
      }

      await tx.certificates.deleteMany({ where: { idKhoaHoc } });
      await tx.instructor_payout.deleteMany({ where: { idKhoaHoc } });
      await tx.dangky_khoahoc.deleteMany({ where: { idKhoaHoc } });
      await tx.progress.deleteMany({ where: { idKhoaHoc } });
      await tx.quizzes.deleteMany({ where: { idKhoaHoc } });
      await tx.baihoc.deleteMany({ where: { idKhoaHoc } });

      await tx.khoahoc.delete({
        where: { idKhoaHoc }
      });
    });

    return res.status(200).json({
      success: true,
      message: "Xóa khóa học thành công"
    });

  } catch (error) {
    console.error("Lỗi xóa khóa học:", error);
    // Nếu lỗi do ràng buộc khóa ngoại (ví dụ có học viên đã mua khóa này)
    if (error.code === 'P2003') {
        return res.status(400).json({ 
            success: false, 
            message: "Không thể xóa khóa học đã có dữ liệu liên quan (học viên, bài giảng...)" 
        });
    }
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;