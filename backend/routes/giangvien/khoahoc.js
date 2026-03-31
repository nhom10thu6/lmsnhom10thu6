const express = require('express');
const router = express.Router();

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const { checkGiangVien } = require('../middleware/middleware');
const { chuaKyTuNguyHiem } = require('../../helper/helper.js');


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
      giaParsed = parseFloat(gia);

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
      data: khoaHoc
    });

  } catch (error) {
    console.error("Lỗi tạo khóa học:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;