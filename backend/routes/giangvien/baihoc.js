const express = require('express');
const router = express.Router();

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const { checkGiangVien } = require('../middleware/middleware');
const { chuaKyTuNguyHiem } = require('../../helper/helper.js');

/* =========================
   TẠO BÀI HỌC
========================= */
router.post("/tao-bai-hoc", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;
    const { idKhoaHoc, tenBaiHoc, videoUrl, taiLieuUrl, thuTu } = req.body;

    // Validate cơ bản
    if (!idKhoaHoc || !tenBaiHoc) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập id khóa học và tên bài học"
      });
    }

    if (isNaN(parseInt(idKhoaHoc))) {
      return res.status(400).json({
        success: false,
        message: "idKhoaHoc phải là số"
      });
    }

    if (typeof tenBaiHoc !== 'string' || tenBaiHoc.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Tên bài học phải có ít nhất 3 ký tự"
      });
    }

    if (chuaKyTuNguyHiem(tenBaiHoc)) {
      return res.status(400).json({
        success: false,
        message: "Tên bài học chứa ký tự không hợp lệ"
      });
    }

    // Validate thuTu
    let thuTuParsed = null;
    if (thuTu !== undefined) {
      const t = parseInt(thuTu);
      if (isNaN(t) || t <= 0) {
        return res.status(400).json({
          success: false,
          message: "Thứ tự phải là số nguyên dương"
        });
      }
      thuTuParsed = t;
    }

    // Check quyền giảng viên
    const khoaHoc = await prisma.khoahoc.findFirst({
      where: {
        idKhoaHoc: parseInt(idKhoaHoc),
        idGiangVien
      }
    });

    if (!khoaHoc) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thêm bài học vào khóa học này"
      });
    }

    // Tạo bài học
    const baiHoc = await prisma.baihoc.create({
      data: {
        idKhoaHoc: parseInt(idKhoaHoc),
        tenBaiHoc: tenBaiHoc.trim(),
        videoUrl: videoUrl ?? null,
        taiLieuUrl: taiLieuUrl ?? null,
        thuTu: thuTuParsed
      }
    });

    return res.status(201).json({
      success: true,
      message: "Tạo bài học thành công",
      data: baiHoc
    });

  } catch (error) {
    console.error("Lỗi tạo bài học:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
});

/* =========================
   XÓA BÀI HỌC
========================= */
router.delete("/xoa-bai-hoc/:idBaiHoc", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;
    const { idBaiHoc } = req.params;

    if (!idBaiHoc || isNaN(parseInt(idBaiHoc))) {
      return res.status(400).json({
        success: false,
        message: "idBaiHoc không hợp lệ"
      });
    }

    const id = parseInt(idBaiHoc);

    // Check bài học + quyền
    const baiHoc = await prisma.baihoc.findFirst({
      where: {
        idBaiHoc: id,
        khoahoc: {
          idGiangVien
        }
      }
    });

    if (!baiHoc) {
      return res.status(404).json({
        success: false,
        message: "Bài học không tồn tại hoặc bạn không có quyền"
      });
    }

    // Check đã có học viên học chưa
    const count = await prisma.progress.count({
      where: { idBaiHoc: id }
    });

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa vì đã có học viên học bài này"
      });
    }

    await prisma.baihoc.delete({
      where: { idBaiHoc: id }
    });

    return res.json({
      success: true,
      message: "Đã xóa bài học"
    });

  } catch (error) {
    console.error("Lỗi xóa bài học:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
});

/* =========================
   SỬA BÀI HỌC
========================= */
router.put("/sua-bai-hoc/:idBaiHoc", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;
    const { idBaiHoc } = req.params;
    const { tenBaiHoc, videoUrl, taiLieuUrl, thuTu } = req.body;

    if (!idBaiHoc || isNaN(parseInt(idBaiHoc))) {
      return res.status(400).json({
        success: false,
        message: "idBaiHoc không hợp lệ"
      });
    }

    const id = parseInt(idBaiHoc);

    // Check bài học + quyền
    const baiHoc = await prisma.baihoc.findFirst({
      where: {
        idBaiHoc: id,
        khoahoc: {
          idGiangVien
        }
      }
    });

    if (!baiHoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài học hoặc bạn không có quyền"
      });
    }

    const dataUpdate = {};

    if (tenBaiHoc !== undefined) {
      if (typeof tenBaiHoc !== 'string' || tenBaiHoc.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Tên bài học không hợp lệ"
        });
      }
      dataUpdate.tenBaiHoc = tenBaiHoc.trim();
    }

    if (videoUrl !== undefined) dataUpdate.videoUrl = videoUrl;
    if (taiLieuUrl !== undefined) dataUpdate.taiLieuUrl = taiLieuUrl;

    if (thuTu !== undefined) {
      const t = parseInt(thuTu);
      if (isNaN(t) || t <= 0) {
        return res.status(400).json({
          success: false,
          message: "Thứ tự phải là số dương"
        });
      }
      dataUpdate.thuTu = t;
    }

    const updated = await prisma.baihoc.update({
      where: { idBaiHoc: id },
      data: dataUpdate
    });

    return res.json({
      success: true,
      message: "Cập nhật bài học thành công",
      data: updated
    });

  } catch (error) {
    console.error("Lỗi sửa bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =========================
   KHÓA HỌC CỦA TÔI
========================= */
router.get("/khoa-hoc-cua-toi", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;

    const danhSach = await prisma.khoahoc.findMany({
      where: { idGiangVien },
      include: {
        baihoc: {
          orderBy: {
            thuTu: "asc"
          }
        },
        quizzes: true
      }
    });

    return res.json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: danhSach
    });

  } catch (error) {
    console.error("Lỗi lấy khóa học:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
});

module.exports = router;