const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()

const checkRole = (role) => {
    return async (req, res, next) => {
        try {
            const userId = req.headers["x-user-id"]

            console.log(`Middleware check ${role}:`, {
                method: req.method,
                path: req.path,
                headerId: userId
            })

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Thiếu thông tin người dùng"
                })
            }

            const idNguoiDung = parseInt(userId)

            if (isNaN(idNguoiDung)) {
                return res.status(400).json({
                    success: false,
                    error: "ID người dùng không hợp lệ"
                })
            }

            const user = await prisma.nguoidung.findUnique({
                where: { idNguoiDung }
            })

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "Người dùng không tồn tại"
                })
            }

            if (user.vaiTro !== role) {
                return res.status(403).json({
                    success: false,
                    error: `Chỉ ${role} mới có quyền`
                })
            }

            req.user = user

            console.log("User authenticated:", {
                id: user.idNguoiDung,
                hoTen: user.hoTen,
                vaiTro: user.vaiTro
            })

            next()
        } catch (error) {
            console.error(`Lỗi check ${role}:`, error)
            res.status(500).json({
                success: false,
                error: "Lỗi server"
            })
        }
    }
}

// Tạo middleware cụ thể
const checkAdmin = checkRole("admin")
const checkGiangVien = checkRole("giangvien")
const checkHocVien = checkRole("hocvien")

module.exports = {
    checkAdmin,
    checkGiangVien,
    checkHocVien
}

