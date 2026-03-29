const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()
const {checkGiangVien} = require('../middleware/middleware')

router.post("/tao-bai-kiem-tra", checkGiangVien, async (req, res) => {
    try{
        const idGiangVien = req.user.idNguoiDung;
        const {idKhoaHoc, tenQuiz, thoiGianLamBai, cauHoi} = req.body;

        if(!idKhoaHoc || !tenQuiz){
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ id khóa học và tên quiz"
            });
        }

         if (isNaN(parseInt(idKhoaHoc))) {
            return res.status(400).json({
                success: false,
                message: "idKhoaHoc phải là số"
            })
        }

        if (typeof tenQuiz !== 'string' || tenQuiz.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "tenQuiz không được để trống"
            })
        }

        if (thoiGianLamBai !== undefined && thoiGianLamBai !== null) {
            const thoiGian = parseInt(thoiGianLamBai)
            if (isNaN(thoiGian) || thoiGian <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "thoiGianLamBai phải là số nguyên dương (đơn vị: phút)"
                })
            }
        }

        if (cauHoi !== undefined) {
            if (!Array.isArray(cauHoi)) {
                return res.status(400).json({
                    success: false,
                    message: "Câu hỏi phải là một mảng"
                })
            }

            for (let i = 0; i < cauHoi.length; i++) {
                const ch = cauHoi[i]

                // cauHoi không được trống
                if (!ch.cauHoi || typeof ch.cauHoi !== 'string' || ch.cauHoi.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Câu hỏi thứ ${i + 1}: nội dung cauHoi không được để trống`
                    })
                }

                // diemCauHoi phải > 0 nếu có truyền
                if (ch.diemCauHoi !== undefined) {
                    const diem = parseFloat(ch.diemCauHoi)
                    if (isNaN(diem) || diem <= 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Câu hỏi thứ ${i + 1}: diemCauHoi phải là số dương`
                        })
                    }
                }
            }
        }

        
        const khoahoc = await prisma.khoahoc.findFirst({
            where: {
                idKhoaHoc: parseInt(idKhoaHoc),
                idGiangVien: idGiangVien
            }
        })

        if (!khoahoc) {
            return res.status(404).json({
                success: false,
                message: "Khóa học không tồn tại hoặc bạn không có quyền tạo quiz cho khóa học này"
            })
        }

        const quiz = await prisma.quizzes.create({
            data: {
                idKhoaHoc: parseInt(idKhoaHoc),
                tenQuiz,
                thoiGianLamBai: thoiGianLamBai ? parseInt(thoiGianLamBai) : null,
                quiz_questions: cauHoi && cauHoi.length > 0 ? {
                    create: cauHoi.map (ch => ({
                        cauHoi: ch.cauHoi,
                        dapAnDung: ch.dapAnDung ?? null,
                        diemCauHoi: ch.diemCauHoi ? parseFloat(ch.diemCauHoi) : 1.00,
                    }))
                } : undefined
            },
            include: {
                quiz_questions: true
            }
        })

        return res.status(201).json ({
            success: true,
            message: "Tạo bài kiểm tra thành công",
            data: quiz
        })
    }catch (error) {
        console.error("Lỗi khi tạo bài kiểm tra:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi tạo bài kiểm tra"
        });
    }
});

module.exports = router