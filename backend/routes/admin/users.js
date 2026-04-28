const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()
const {checkAdmin} = require('../middleware/middleware')

router.get("/", checkAdmin ,async (req, res) => {
    try {
        // const { role } = req.query;
        // const where = {};
        // if (role) {
        //     where.vaiTro = role;
        // }
        // const dsNguoiDung = await prisma.nguoidung.findMany({
        //     where,
        //     include: {},
        //     orderBy: {
        //         idNguoiDung: 'asc'
        //     }
        // });
        // res.json(dsNguoiDung);
        
        //lấy 3 học viên có tổng tiền đăng ký mua nhiều nhất
        const ds = await prisma.nguoidung.findMany({
            select:{
                idNguoiDung: true,
                hoTen: true,
                taiKhoan: true,
                vaiTro: true,
                _count:{
                    select:{
                        dangky_khoahoc: true
                    }
                },
            },
            orderBy:{
                idNguoiDung: 'asc'
            },
        })

        res.json(ds)
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        res.status(500).json({ error: "Không thể lấy thông tin người dùng" });
    }
});


router.get('/search', checkAdmin, async (req, res) => {
  try {
    const { taiKhoan } = req.query

    const users = await prisma.nguoidung.findMany({
      where: taiKhoan
        ? {
            taiKhoan: {
              contains: taiKhoan,
            },
          }
        : {},
    })

    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/search', checkAdmin, async (req, res) => {
  try {
    const { taiKhoan } = req.query

    const users = await prisma.nguoidung.findMany({
      where: taiKhoan
        ? {
            taiKhoan: {
              contains: taiKhoan,
            },
          }
        : {},
    })

    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


router.get("/:idNguoiDung", checkAdmin,async (req, res) => {
    try {
        const nguoiDungId = parseInt(req.params.idNguoiDung);

        if (isNaN(nguoiDungId)) {
            return res.status(400).json({ error: "ID người dùng không hợp lệ" });
        }

        const nguoiDung = await prisma.nguoidung.findUnique({
            where: {
                idNguoiDung: nguoiDungId
            }
        });

        if (!nguoiDung) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        res.json(nguoiDung);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        res.status(500).json({ error: "Không thể lấy thông tin người dùng" });
    }
});

router.post("/", checkAdmin, async (req, res) => {
    try {
        let { hoTen, taiKhoan, matKhau, vaiTro } = req.body;
        hoTen = hoTen ? hoTen.trim().replace(/\s+/g, ' ') : undefined
        taiKhoan = taiKhoan ? taiKhoan.trim() : undefined
        matKhau = matKhau ? matKhau.trim() : undefined
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/

        if (!hoTen || !taiKhoan || !matKhau) {
            return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
        }

        if (!nameRegex.test(hoTen)) {
            return res.status(400).json({ error: "Họ tên chỉ được chứa chữ cái và khoảng trắng" });
        }
        const existing = await prisma.nguoidung.findUnique({
            where: { taiKhoan }
        });

        if (existing) {
            return res.status(409).json({ 
                error: "Tài khoản đã tồn tại" });
        }

        const vaiTroMoi = ["admin", "giangvien", "hocvien"].includes(vaiTro)
            ? vaiTro
            : "hocvien";

        const nguoiDungMoi = await prisma.nguoidung.create({
            data: {
                hoTen,
                taiKhoan,
                matKhau,
                vaiTro: vaiTroMoi
            }
        });

        // ẩn password
        const { matKhau: _, ...userSafe } = nguoiDungMoi;

        res.status(201).json(userSafe);

    } catch (error) {
        res.status(500).json({ error: "Không thể tạo người dùng" });
    }
});

router.delete("/:idNguoiDung", checkAdmin,async (req, res) => {
    try {
        const idNguoiDung = parseInt(req.params.idNguoiDung);
        if (isNaN(idNguoiDung)) {
            return res.status(400).json({ error: "ID người dùng không hợp lệ" });
        }

        const user = await prisma.nguoidung.findUnique({
            where: { idNguoiDung }
        });

        if (!user) {
            return res.status(404).json({ error: "Người dùng không tồn tại" });
        }
        
        if (user.vaiTro === "giangvien") {
            return res.status(403).json({
                error: "Không được xóa giảng viên"
            });
        }
        
        if (user.vaiTro === "admin") {
            return res.status(403).json({
                error: "Không được xóa admin"
            });
        }
        const hasData =
            await prisma.dangky_khoahoc.findFirst({ where: { idNguoiDung } }) ||
            await prisma.progress.findFirst({ where: { idNguoiDung } }) ||
            await prisma.quiz_results.findFirst({ where: { idNguoiDung } }) ||
            await prisma.certificates.findFirst({ where: { idNguoiDung } });

        if (hasData) {
            return res.status(400).json({
                error: "Không thể xóa học viên đã phát sinh dữ liệu học tập"
            });
        }
        await prisma.nguoidung.delete({
            where: { idNguoiDung }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

router.put("/:idNguoiDung",checkAdmin ,async (req, res) => {
    try {
        const nguoiDungId = parseInt(req.params.idNguoiDung);
        let { hoTen, taiKhoan, matKhau, vaiTro } = req.body;
        hoTen = hoTen ? hoTen.trim().replace(/\s+/g, ' ') : undefined
        taiKhoan = taiKhoan ? taiKhoan.trim() : undefined
        matKhau = matKhau ? matKhau.trim() : undefined
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/
        if (!nameRegex.test(hoTen)) {
            return res.status(400).json({ error: "Họ tên chỉ được chứa chữ cái và khoảng trắng" });
        }
        const updateNguoiDung = await prisma.nguoidung.update({
            where: { idNguoiDung: nguoiDungId },
            data: {
                hoTen,
                taiKhoan,
                matKhau,
                vaiTro
            }
        });
        res.json(updateNguoiDung);
    }
    catch (error) {
        console.error("Lỗi khi cập nhật người dùng:", error);
        res.status(500).json({ error: "Không thể cập nhật người dùng" });
    }
});

module.exports = router