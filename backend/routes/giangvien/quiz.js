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
                message: "tên quiz không được để trống"
            })
        }

        if (thoiGianLamBai !== undefined && thoiGianLamBai !== null) {
            const thoiGian = parseInt(thoiGianLamBai)
            if (isNaN(thoiGian) || thoiGian <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "thời gian làm bài phải là số nguyên dương (đơn vị: phút)"
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

        if (cauHoi.length > 100) {
            return res.status(400).json({
                success: false,
                message: `Bài kiểm tra chỉ được tối đa 100 câu hỏi (hiện tại: ${cauHoi.length} câu)`
            })
        }

            for (let i = 0; i < cauHoi.length; i++) {
                const ch = cauHoi[i]

                // cauHoi không được trống
                if (!ch.cauHoi || typeof ch.cauHoi !== 'string' || ch.cauHoi.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Câu hỏi thứ ${i + 1}: nội dung câu hỏi không được để trống`
                    })
                }

                // diemCauHoi phải > 0 nếu có truyền
                if (ch.diemCauHoi !== undefined) {
                    const diem = parseFloat(ch.diemCauHoi)
                    if (isNaN(diem) || diem <= 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Câu hỏi thứ ${i + 1}: điểm câu hỏi phải là số dương`
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
            tenQuiz: tenQuiz.trim(),
            thoiGianLamBai: thoiGianLamBai ? parseInt(thoiGianLamBai) : null,
            quiz_questions: cauHoi && cauHoi.length > 0
                ? {
                    create: cauHoi.map(ch => ({
                        cauHoi: ch.cauHoi.trim(),
                        dapAnDung: ch.dapAnDung ?? null,
                        diemCauHoi: ch.diemCauHoi ? parseFloat(ch.diemCauHoi) : 1.00
                    }))
                }
                : undefined
        },
        include: {
            quiz_questions: true
        }
        })

        return res.status(201).json({
            success: true,
            message: `Tạo bài kiểm tra thành công (${quiz.quiz_questions.length} câu hỏi)`,
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

router.get("/bang-diem/:idKhoaHoc", checkGiangVien, async (req, res) => {
    try {
        const idGiangVien = req.user.idNguoiDung
        const { idKhoaHoc } = req.params

        // 1. Validate
        if (isNaN(parseInt(idKhoaHoc))) {
            return res.status(400).json({
                success: false,
                message: "idKhoaHoc phải là số nguyên"
            })
        }

        // 2. Kiểm tra khóa học có thuộc giảng viên này không
        const khoaHoc = await prisma.khoahoc.findFirst({
            where: {
                idKhoaHoc: parseInt(idKhoaHoc),
                idGiangVien: idGiangVien
            }
        })

        if (!khoaHoc) {
            return res.status(404).json({
                success: false,
                message: "Khóa học không tồn tại hoặc bạn không có quyền"
            })
        }

        // 3. Lấy tất cả quiz thuộc khóa học này kèm kết quả học viên
        const danhSachQuiz = await prisma.quizzes.findMany({
            where: { idKhoaHoc: parseInt(idKhoaHoc) },
            include: {
                quiz_questions: {
                    select: { diemCauHoi: true }
                },
                quiz_results: {
                    include: {
                        nguoidung: {
                            select: { idNguoiDung: true, hoTen: true, taiKhoan: true }
                        }
                    }
                }
            }
        })

        if (danhSachQuiz.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Khóa học này chưa có bài kiểm tra nào",
                data: {
                    khoaHoc: { idKhoaHoc: khoaHoc.idKhoaHoc, tenKhoaHoc: khoaHoc.tenKhoaHoc },
                    tongSoQuiz: 0,
                    danhSachQuiz: []
                }
            })
        }

        // 4. Xử lý từng quiz
        const ketQuaTheoQuiz = danhSachQuiz.map(quiz => {
            // Tính tổng điểm tối đa của quiz
            const tongDiemToiDa = quiz.quiz_questions.reduce((sum, ch) => {
                return sum + parseFloat(ch.diemCauHoi ?? 1)
            }, 0)

            // Chỉ lấy học viên đã có kết quả (đã làm bài)
            const danhSachKetQua = quiz.quiz_results.map(kq => ({
                idKetQua: kq.idKetQua,
                hocVien: kq.nguoidung,
                diemSo: parseFloat(kq.diemSo ?? 0),
                thoiGianLamBai: kq.thoiGianLamBai, // giây
                ngayLamBai: kq.ngayLamBai
            }))

            // Thống kê
            const danhSachDiem = danhSachKetQua.map(kq => kq.diemSo)
            const tongSoHocVienDaLam = danhSachDiem.length

            const thongKe = tongSoHocVienDaLam > 0 ? {
                tongSoHocVienDaLam,
                diemTrungBinh: parseFloat(
                    (danhSachDiem.reduce((a, b) => a + b, 0) / tongSoHocVienDaLam).toFixed(2)
                ),
                diemCaoNhat: Math.max(...danhSachDiem),
                diemThapNhat: Math.min(...danhSachDiem),
                soHocVienDat: danhSachDiem.filter(d => d >= tongDiemToiDa * 0.5).length,  // đạt >= 50%
                soHocVienKhongDat: danhSachDiem.filter(d => d < tongDiemToiDa * 0.5).length
            } : {
                tongSoHocVienDaLam: 0,
                diemTrungBinh: 0,
                diemCaoNhat: 0,
                diemThapNhat: 0,
                soHocVienDat: 0,
                soHocVienKhongDat: 0
            }

            return {
                idQuiz: quiz.idQuiz,
                tenQuiz: quiz.tenQuiz,
                thoiGianLamBai: quiz.thoiGianLamBai,
                tongDiemToiDa,
                thongKe,
                bangDiem: danhSachKetQua
            }
        })

        return res.status(200).json({
            success: true,
            message: "Lấy bảng điểm thành công",
            data: {
                khoaHoc: {
                    idKhoaHoc: khoaHoc.idKhoaHoc,
                    tenKhoaHoc: khoaHoc.tenKhoaHoc
                },
                tongSoQuiz: danhSachQuiz.length,
                danhSachQuiz: ketQuaTheoQuiz
            }
        })

    } catch (error) {
        console.error("Lỗi khi xem bảng điểm:", error)
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xem bảng điểm"
        })
    }
})

module.exports = router