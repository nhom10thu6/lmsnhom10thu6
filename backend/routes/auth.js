const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

router.post("/login", async (req, res) => {
    try {
        const { taiKhoan, matKhau } = req.body

        if (!taiKhoan || !matKhau) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tài khoản và mật khẩu"
            })
        }

        const nguoiDung = await prisma.nguoidung.findUnique({
            where: { taiKhoan }
        })

        if (!nguoiDung) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản không tồn tại"
            })
        }

        if (matKhau !== nguoiDung.matKhau) {
            return res.status(401).json({
                success: false,
                message: "Mật khẩu không chính xác"
            })
        }

        let duongDan = "/"
        switch (nguoiDung.vaiTro) {
            case "admin":
                duongDan = "/admin"
                break
            case "giangvien":
                duongDan = "/giangvien"
                break
            case "hocvien":
                duongDan = "/khoahoc"
                break
        }

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            user: {
                id: nguoiDung.idNguoiDung,
                hoTen: nguoiDung.hoTen,
                taiKhoan: nguoiDung.taiKhoan,
                vaiTro: nguoiDung.vaiTro
            },
            redirectTo: duongDan
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Không thể đăng nhập" })
    }
})


router.post("/dangky", async (req, res) => {
    try {
        const { hoTen, taiKhoan, matKhau, vaiTro } = req.body

        if (!hoTen || !taiKhoan || !matKhau) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            })
        }

        const existing = await prisma.nguoidung.findUnique({
            where: { taiKhoan }
        })

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Tài khoản đã tồn tại"
            })
        }

        const nguoiDungMoi = await prisma.nguoidung.create({
            data: {
                hoTen,
                taiKhoan,
                matKhau,
                vaiTro: ["giangvien", "hocvien"].includes(vaiTro)
                    ? vaiTro
                    : "hocvien"
            }
        })

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user: nguoiDungMoi
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Không thể đăng ký" })
    }
})

module.exports = router