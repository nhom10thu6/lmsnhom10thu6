const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();
const upload = require("../../utils/multer");
const { checkGiangVien } = require("../middleware/middleware");
const { chuaKyTuNguyHiem } = require("../../helper/helper.js");

const { uploadFile, deleteFile } = require("../../utils/googleDrive");

/* =========================
   TẠO BÀI HỌC
========================= */
router.post(
  "/tao-bai-hoc",
  checkGiangVien,
  upload.single("file"),
  async (req, res) => {
    try {
      const idGiangVien = req.user.idNguoiDung;
      const { idKhoaHoc, tenBaiHoc, thuTu } = req.body;

      /* ===== VALIDATE ===== */
      if (!idKhoaHoc || !tenBaiHoc) {
        return res.status(400).json({
          success: false,
          message: "Thiếu idKhoaHoc hoặc tên bài học",
        });
      }

      const idKH = parseInt(idKhoaHoc);
      if (isNaN(idKH)) {
        return res.status(400).json({
          success: false,
          message: "idKhoaHoc phải là số",
        });
      }

      const ten = tenBaiHoc.trim();

      if (ten.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Tên bài học phải >= 3 ký tự",
        });
      }

      if (chuaKyTuNguyHiem(ten)) {
        return res.status(400).json({
          success: false,
          message: "Tên bài học chứa ký tự không hợp lệ",
        });
      }

      /* ===== CHECK QUYỀN ===== */
      const khoaHoc = await prisma.khoahoc.findFirst({
        where: {
          idKhoaHoc: idKH,
          idGiangVien,
        },
      });

      if (!khoaHoc) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền",
        });
      }

      /* ===== FILE ===== */
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Chưa upload file",
        });
      }

      // 1. Phân loại mimetype TRƯỚC KHI upload
      const isVid = file.mimetype.startsWith("video/");
      const isDoc =
        file.mimetype === "application/pdf" ||
        file.mimetype.includes("word") ||
        file.mimetype.includes("excel") ||
        file.mimetype.includes("presentation");

      // 2. Chặn ngay nếu file rác (không phải video, không phải tài liệu)
      if (!isVid && !isDoc) {
        return res.status(400).json({
          success: false,
          message: "File không hợp lệ (chỉ hỗ trợ video hoặc tài liệu)",
        });
      }

      // 3. File đã hợp lệ -> Tiến hành upload lên Google Drive
      const fileUrl = await uploadFile(file);

      // 4. Gán link vừa upload vào đúng loại biến
      let videoUrl = isVid ? fileUrl : null;
      let taiLieuUrl = isDoc ? fileUrl : null;

      /* ===== THỨ TỰ ===== */
      let thuTuParsed = null;
      if (thuTu !== undefined) {
        const t = parseInt(thuTu);
        if (isNaN(t) || t <= 0) {
          return res.status(400).json({
            success: false,
            message: "Thứ tự phải là số dương",
          });
        }
        thuTuParsed = t;
      }

      /* ===== CREATE ===== */
      const baiHoc = await prisma.baihoc.create({
        data: {
          idKhoaHoc: idKH,
          tenBaiHoc: ten,
          videoUrl,
          taiLieuUrl,
          thuTu: thuTuParsed,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Tạo bài học thành công",
        data: baiHoc,
      });
    } catch (error) {
      console.error("Lỗi tạo bài học:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
);

/* =========================
   XÓA BÀI HỌC
========================= */
router.delete("/xoa-bai-hoc/:idBaiHoc", checkGiangVien, async (req, res) => {
  try {
    const idGiangVien = req.user.idNguoiDung;
    const id = parseInt(req.params.idBaiHoc);

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "idBaiHoc không hợp lệ" });
    }

    const baiHoc = await prisma.baihoc.findFirst({
      where: { idBaiHoc: id, khoahoc: { idGiangVien } },
    });

    if (!baiHoc) {
      return res.status(404).json({
        success: false,
        message: "Bài học không tồn tại hoặc bạn không có quyền",
      });
    }

    const count = await prisma.progress.count({ where: { idBaiHoc: id } });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa vì đã có học viên học bài này",
      });
    }

    // ===========================================

    await prisma.baihoc.delete({
      where: { idBaiHoc: id },
    });

    // === GỌI HÀM XÓA FILE TRÊN GOOGLE DRIVE ===
    // Chỉ gọi xóa nếu URL có chứa "drive.google.com" (đề phòng link Youtube)
    // === GỌI HÀM XÓA FILE TRÊN GOOGLE DRIVE ===
    if (baiHoc.videoUrl && baiHoc.videoUrl.includes("drive.google.com")) {
      await deleteFile(baiHoc.videoUrl).catch((err) =>
        console.error("Lỗi xóa Video Drive:", err),
      );
    }
    if (baiHoc.taiLieuUrl && baiHoc.taiLieuUrl.includes("drive.google.com")) {
      await deleteFile(baiHoc.taiLieuUrl).catch((err) =>
        console.error("Lỗi xóa Tài liệu Drive:", err),
      );
    }

    return res.json({
      success: true,
      message: "Đã xóa bài học thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa bài học:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

/* =========================
   SỬA BÀI HỌC (Upload file mới thì xóa file cũ)
========================= */
router.put(
  "/sua-bai-hoc/:idBaiHoc",
  checkGiangVien,
  upload.single("file"),
  async (req, res) => {
    try {
      const idGiangVien = req.user.idNguoiDung;
      const id = parseInt(req.params.idBaiHoc);
      const { tenBaiHoc, thuTu } = req.body;

      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, message: "idBaiHoc không hợp lệ" });

      const baiHoc = await prisma.baihoc.findFirst({
        where: { idBaiHoc: id, khoahoc: { idGiangVien } },
      });

      if (!baiHoc)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bài học" });

      const dataUpdate = {};

      if (tenBaiHoc !== undefined) {
        const ten = tenBaiHoc.trim();
        if (ten.length < 3 || chuaKyTuNguyHiem(ten)) {
          return res
            .status(400)
            .json({ success: false, message: "Tên bài học không hợp lệ" });
        }
        dataUpdate.tenBaiHoc = ten;
      }

      /* ===== XỬ LÝ UPLOAD FILE MỚI ===== */
      const file = req.file;
      if (file) {
        // 1. Phân loại mimetype TRƯỚC KHI upload
        const isVid = file.mimetype.startsWith("video/");
        const isDoc =
          file.mimetype === "application/pdf" ||
          file.mimetype.includes("word") ||
          file.mimetype.includes("excel") ||
          file.mimetype.includes("presentation");

        // 2. Chặn ngay nếu file không hợp lệ
        if (!isVid && !isDoc) {
          return res
            .status(400)
            .json({ success: false, message: "File không hợp lệ" });
        }

        // 3. File chuẩn -> Upload lên Drive
        const fileUrl = await uploadFile(file);

        if (isVid) {
          dataUpdate.videoUrl = fileUrl;
          dataUpdate.taiLieuUrl = null;
        } else if (isDoc) {
          dataUpdate.taiLieuUrl = fileUrl;
          dataUpdate.videoUrl = null;
        }
      }

      /* ===== THỨ TỰ ===== */
      if (thuTu !== undefined) {
        const t = parseInt(thuTu);
        if (isNaN(t) || t <= 0) {
          return res
            .status(400)
            .json({ success: false, message: "Thứ tự không hợp lệ" });
        }
        dataUpdate.thuTu = t;
      }

      // 4. CẬP NHẬT DATABASE TRƯỚC TIÊN
      const updated = await prisma.baihoc.update({
        where: { idBaiHoc: id },
        data: dataUpdate,
      });

      // 5. XÓA FILE CŨ TRÊN DRIVE NẾU CÓ UPLOAD FILE MỚI
      // (Chạy ngầm với .catch() để phản hồi nhanh và không làm crash nếu Drive lỗi)
      if (file) {
        if (baiHoc.videoUrl?.includes("drive.google.com")) {
          deleteFile(baiHoc.videoUrl).catch((err) =>
            console.error("Lỗi xóa Video cũ:", err),
          );
        }
        if (baiHoc.taiLieuUrl?.includes("drive.google.com")) {
          deleteFile(baiHoc.taiLieuUrl).catch((err) =>
            console.error("Lỗi xóa Tài liệu cũ:", err),
          );
        }
      }

      return res.json({
        success: true,
        message: "Cập nhật bài học thành công",
        data: updated,
      });
    } catch (error) {
      console.error("Lỗi sửa bài học:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
);

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
            thuTu: "asc",
          },
        },
        quizzes: true,
      },
    });

    return res.json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: danhSach,
    });
  } catch (error) {
    console.error("Lỗi lấy khóa học:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
});

module.exports = router;
