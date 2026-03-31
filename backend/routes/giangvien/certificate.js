const express = require('express');
const router = express.Router();

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const { checkGiangVien } = require('../middleware/middleware');

/* =========================
   CẤP CHỨNG CHỈ
========================= */
router.post("/cap-chung-chi", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;
    const { idNguoiDung, idKhoaHoc } = req.body;

    if (!idNguoiDung || !idKhoaHoc) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin"
      });
    }

    // Check khóa học thuộc giảng viên
    const khoaHoc = await prisma.khoahoc.findFirst({
      where: {
        idKhoaHoc: parseInt(idKhoaHoc),
        idGiangVien
      }
    });

    if (!khoaHoc) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cấp chứng chỉ cho khóa học này"
      });
    }

    // Check học viên đã đăng ký
    const dangKy = await prisma.dangky_khoahoc.findUnique({
      where: {
        idNguoiDung_idKhoaHoc: {
          idNguoiDung: parseInt(idNguoiDung),
          idKhoaHoc: parseInt(idKhoaHoc)
        }
      }
    });

    if (!dangKy) {
      return res.status(400).json({
        success: false,
        message: "Học viên chưa đăng ký khóa học"
      });
    }

    // Check đã có chứng chỉ chưa
    const existed = await prisma.certificates.findFirst({
      where: {
        idNguoiDung: parseInt(idNguoiDung),
        idKhoaHoc: parseInt(idKhoaHoc)
      }
    });

    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Học viên đã có chứng chỉ"
      });
    }

    const cert = await prisma.certificates.create({
      data: {
        idNguoiDung: parseInt(idNguoiDung),
        idKhoaHoc: parseInt(idKhoaHoc)
      }
    });

    return res.json({
      success: true,
      message: "Cấp chứng chỉ thành công",
      data: cert
    });

  } catch (error) {
    console.error("Lỗi cấp chứng chỉ:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;