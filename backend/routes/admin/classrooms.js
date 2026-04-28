const express = require('express')
const router = express.Router()
const { PrismaClient, Prisma } = require('../../generated/prisma')
const prisma = new PrismaClient()
const { checkAdmin } = require('../middleware/middleware')

router.get("/",checkAdmin ,async (req, res) => {
    try {
        const dsKhoaHoc = await prisma.khoahoc.findMany({
            include: {
                nguoidung: {
                    select: {
                        hoTen: true,
                    },
                },
                _count: {
                    select: {
                        dangky_khoahoc: true
                    }
                }
            },
        });

        const result = dsKhoaHoc.map(kh => ({
            ...kh,
            soHocVien: kh._count.dangky_khoahoc,
        }));

        res.json(result);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu khóa học:", error);
        res.status(500).json({ error: "Không lấy được dữ liệu" });
    }
});

router.get("/search", checkAdmin, async (req, res) => {
    try {
        const { taiKhoan, tenKhoaHoc, tenGiangVien } = req.query;
        let whereCondition = {};
        
        // const whereCondition = {
        //     AND: [
        //         taiKhoan && {
        //             nguoidung: {
        //                 taiKhoan: {
        //                     contains: taiKhoan,
        //                     mode: "insensitive"
        //                 }
        //             }
        //         },
        //         tenKhoaHoc && {
        //             tenKhoaHoc: {
        //                 contains: tenKhoaHoc,
        //                 mode: "insensitive"
        //             }
        //         },
        //         tenGiangVien && {
        //             nguoidung: {
        //                 hoTen: {
        //                     contains: tenGiangVien,
        //                     mode: "insensitive"
        //                 }
        //             }
        //         }
        //     ].filter(Boolean)
        // };
        //insensitive ko phan biet hoa thường
        if (taiKhoan) {
            whereCondition.nguoidung = {
                taiKhoan: {
                    contains: taiKhoan,
                    mode: 'insensitive'
                }
            };
        }
        
        if (tenKhoaHoc) {
            whereCondition.tenKhoaHoc = {
                contains: tenKhoaHoc,
                mode: 'insensitive'
            };
        }

        if (tenGiangVien) {
            whereCondition.nguoidung = {
                hoTen: {
                    contains: tenGiangVien,
                    mode: 'insensitive'
                }
            };
        }
        
        const dsKhoaHoc = await prisma.khoahoc.findMany({
            where: whereCondition,
            include: {
                nguoidung: {
                    select: {
                        hoTen: true,
                    },
                },
                _count: {
                    select: {
                        dangky_khoahoc: true
                    }
                }
            },
        });

        const result = dsKhoaHoc.map(kh => ({
            ...kh,
            soHocVien: kh._count.dangky_khoahoc,
        }));

        res.json(result);
        
    } catch (error) {
        console.error("Lỗi khi tìm kiếm khóa học:", error);
        res.status(500).json({ error: "Không thể tìm kiếm dữ liệu" });
    }
});

router.get("/:id",checkAdmin, async (req, res) => {
    try {
        const khoaHocId = parseInt(req.params.id);

        if (isNaN(khoaHocId)) {
            return res.status(400).json({ error: "ID khóa học không hợp lệ" });
        }

        const khoaHoc = await prisma.khoahoc.findUnique({
            where: { idKhoaHoc: khoaHocId },
            include: {
                nguoidung: {
                    select: {
                        hoTen: true,
                    },
                },
            },
        });

        if (!khoaHoc) {
            return res.status(404).json({ error: "Khóa học không tồn tại" });
        }

        res.json(khoaHoc);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết khóa học:", error);
        res.status(500).json({ error: "Không lấy được dữ liệu" });
    }
});

router.post("/", checkAdmin, async (req, res) => {
    try {
        let { tenKhoaHoc, moTa, gia, danhMuc, idGiangVien } = req.body;
        tenKhoaHoc = tenKhoaHoc ? tenKhoaHoc.trim() : undefined
        moTa = moTa ? moTa.trim() : undefined
        danhMuc = danhMuc ? danhMuc.trim() : undefined
        if (!tenKhoaHoc || !moTa || !gia) {
            return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
        }
        
        const giangVien = await prisma.nguoidung.findUnique({
            where: {
                idNguoiDung: parseInt(idGiangVien) 
            }
        })
        if(!giangVien||giangVien.vaiTro !== "giangvien"){
            return res.status(400).json({
                success: false,
                message: "Giảng viên không hợp lệ"
            });
        }
        const khoaHocMoi = await prisma.khoahoc.create({
            data: {
                tenKhoaHoc,
                moTa: moTa || null,
                gia: gia ? new Prisma.Decimal(parseFloat(gia)) : new Prisma.Decimal(0.00),
                danhMuc: danhMuc || null,
                idGiangVien: idGiangVien ? parseInt(idGiangVien) : null
            },
            include: {
                nguoidung: {
                    select: {
                        idNguoiDung: true,
                        hoTen: true,
                        vaiTro: true
                    }
                }
            }
        });
        res.status(201).json(khoaHocMoi);
    }
    catch (error) {
        console.error("Lỗi khi tạo khóa học mới:", error);
        res.status(500).json({ error: "Không thể tạo khóa học mới" });
    }
});

router.delete("/:id", checkAdmin, async (req, res) => {
    try {
        const idKhoaHoc = parseInt(req.params.id);
        if (isNaN(idKhoaHoc)) {
            return res.status(400).json({ error: "ID khóa học không hợp lệ" });
        }
        await prisma.certificates.deleteMany({
            where: { idKhoaHoc }
        });
        await prisma.dangky_khoahoc.deleteMany({
            where: { idKhoaHoc }
        });
        await prisma.instructor_payout.deleteMany({
            where: { idKhoaHoc }
        });
        await prisma.khoahoc.delete({
            where: { idKhoaHoc }
        });

        res.json({ success: true, message: "Xóa khóa học thành công" });

    } catch (error) {
        console.error("Lỗi xóa khóa học:", error);
        res.status(500).json({ error: "Không thể xóa khóa học" });
    }
});

router.put("/:id", checkAdmin, async (req, res) => {
    try {
        const khoaHocId = parseInt(req.params.id);
        let { tenKhoaHoc, moTa, gia, danhMuc, idGiangVien } = req.body;
        tenKhoaHoc = tenKhoaHoc ? tenKhoaHoc.trim() : undefined
        moTa = moTa ? moTa.trim() : undefined
        danhMuc = danhMuc ? danhMuc.trim() : undefined
        const giangVien = await prisma.nguoidung.findUnique({
            where: {
                idNguoiDung:  parseInt(idGiangVien)
            }
        })
        if(!giangVien||giangVien.vaiTro !== "giangvien"){
            return res.status(400).json({
                success: false,
                message: "Giảng viên không hợp lệ"
            });
        }
        const updateKhoaHoc = await prisma.khoahoc.update({
            where: { idKhoaHoc: khoaHocId },
            data: {
                tenKhoaHoc,
                moTa: moTa || null,
                gia: gia ? new Prisma.Decimal(parseFloat(gia)) : new Prisma.Decimal(0.00),
                danhMuc: danhMuc || null,
                idGiangVien: idGiangVien ? parseInt(idGiangVien) : null
            }
        });
        res.json(updateKhoaHoc);
    }
    catch (error) {
        console.error("Lỗi khi cập nhật khóa học:", error);
        res.status(500).json({ error: "Không thể cập nhật khóa học" });
    }
});

module.exports = router
