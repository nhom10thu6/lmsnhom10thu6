const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()
const {checkGiangVien} = require('../middleware/middleware')
const chuaKyTuNguyHiem = require('../../helper/helper.js').chuaKyTuNguyHiem
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

router.delete("/xoa-bai-kiem-tra/:idQuiz", checkGiangVien, async (req, res) => {
    try {
        const idGiangVien = req.user.idNguoiDung
        const { idQuiz } = req.params
        const { tenQuiz } = req.body;

        //Validate idQuiz
        if (!idQuiz || isNaN(parseInt(idQuiz)) || parseInt(idQuiz) <= 0) {
            return res.status(400).json({
                success: false,
                message: "id quiz không hợp lệ"
            })
        }

        if (!tenQuiz || typeof tenQuiz !== 'string' || tenQuiz.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp tên Quiz để xác nhận xóa"
            });
        }

        // Kiểm tra ký tự nguy hiểm cho tenQuiz (đã có biến tenQuiz nên sẽ không còn lỗi ReferenceError)
        if (chuaKyTuNguyHiem(tenQuiz)) {
            return res.status(400).json({ 
                success: false, 
                message: "tenQuiz chứa ký tự không hợp lệ" 
            });
        }

        //Kiểm tra quiz tồn tại và thuộc giảng viên
        const quiz = await prisma.quizzes.findFirst({
            where: {
                idQuiz: parseInt(idQuiz),
                khoahoc: { idGiangVien: idGiangVien }
            },
            include: {
                khoahoc: true,
                quiz_results: true,
                quiz_questions: true
            }
        })

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Bài kiểm tra không tồn tại hoặc bạn không có quyền xóa"
            })
        }

        //Kiểm tra khóa học còn hoạt động không
        if (!quiz.khoahoc.idGiangVien) {
            return res.status(400).json({
                success: false,
                message: "Khóa học không còn hoạt động, không thể xóa bài kiểm tra"
            })
        }

        //Không cho xóa nếu đã có học viên làm bài
        if (quiz.quiz_results.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa vì đã có ${quiz.quiz_results.length} học viên làm bài kiểm tra này`
            })
        }

        //Xóa quiz (quiz_questions tự cascade theo schema)
        await prisma.quizzes.delete({
            where: { idQuiz: parseInt(idQuiz) }
        })

        return res.status(200).json({
            success: true,
            message: `Đã xóa bài kiểm tra "${quiz.tenQuiz}" thành công`
        })

    } catch (error) {
        console.error("Lỗi khi xóa bài kiểm tra:", error)
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa bài kiểm tra"
        })
    }
})

router.put("/sua-bai-kiem-tra/:idQuiz", checkGiangVien, async (req, res) => {
    try {
        const idGiangVien = req.user.idNguoiDung
        const { idQuiz } = req.params
        const { tenQuiz, thoiGianLamBai, cauHoi } = req.body

        //Validate idQuiz
        if (!idQuiz || isNaN(parseInt(idQuiz)) || parseInt(idQuiz) <= 0) {
            return res.status(400).json({
                success: false,
                message: "id quiz không hợp lệ"
            })
        }

        //Phải có ít nhất 1 trường để cập nhật
        if (tenQuiz === undefined && thoiGianLamBai === undefined && cauHoi === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật"
            })
        }

        // 3. Validate tenQuiz nếu có truyền
        if (tenQuiz !== undefined) {
            if (typeof tenQuiz !== 'string' || tenQuiz.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: "tên quiz không được để trống"
                })
            }
            if (tenQuiz.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: "tên quiz phải có ít nhất 5 ký tự"
                })
            }
            if (tenQuiz.trim().length > 255) {
                return res.status(400).json({
                    success: false,
                    message: "tên quiz không được vượt quá 255 ký tự"
                })
            }
        }

        //Validate thoiGianLamBai nếu có truyền
        if (thoiGianLamBai !== undefined && thoiGianLamBai !== null) {
            const thoiGian = parseInt(thoiGianLamBai)
            if (isNaN(thoiGian) || thoiGian <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "thời gian làm bài phải là số nguyên dương (đơn vị: phút)"
                })
            }
            if (thoiGian > 300) {
                return res.status(400).json({
                    success: false,
                    message: "thời gian làm bài không được vượt quá 300 phút"
                })
            }
        }

        //Validate danh sách câu hỏi nếu có truyền
        if (cauHoi !== undefined) {
            if (!Array.isArray(cauHoi)) {
                return res.status(400).json({
                    success: false,
                    message: "câu hỏi phải là một mảng"
                })
            }
            if (cauHoi.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Danh sách câu hỏi không được rỗng"
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

                // Nội dung câu hỏi
                if (!ch.cauHoi || typeof ch.cauHoi !== 'string' || ch.cauHoi.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Câu hỏi thứ ${i + 1}: nội dung không được để trống`
                    })
                }

                if (ch.cauHoi.trim().length > 1000) {
                    return res.status(400).json({
                        success: false,
                        message: `Câu hỏi thứ ${i + 1}: nội dung không được vượt quá 1000 ký tự`
                    })
                }

                if (chuaKyTuNguyHiem(ch.cauHoi)) {
                    return res.status(400).json({ success: false, message: `Câu hỏi thứ ${i + 1}: nội dung chứa ký tự không hợp lệ` })
                }
                if (ch.dapAnDung && chuaKyTuNguyHiem(ch.dapAnDung)) {
                    return res.status(400).json({ success: false, message: `Câu hỏi thứ ${i + 1}: đáp án đúng chứa ký tự không hợp lệ` })
                }

                // Đáp án đúng
                if (ch.dapAnDung !== undefined && ch.dapAnDung !== null) {
                    if (typeof ch.dapAnDung !== 'string' || ch.dapAnDung.trim() === '') {
                        return res.status(400).json({
                            success: false,
                            message: `Câu hỏi thứ ${i + 1}: đáp án đúng không hợp lệ`
                        })
                    }
                    if (ch.dapAnDung.trim().length > 500) {
                        return res.status(400).json({
                            success: false,
                            message: `Câu hỏi thứ ${i + 1}: đáp án đúng không được vượt quá 500 ký tự`
                        })
                    }
                }

                // Điểm câu hỏi
                if (ch.diemCauHoi !== undefined) {
                    const diem = parseFloat(ch.diemCauHoi)
                    if (isNaN(diem) || diem <= 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Câu hỏi thứ ${i + 1}: điểm câu hỏi phải là số dương`
                        })
                    }
                    if (diem > 100) {
                        return res.status(400).json({
                            success: false,
                            message: `Câu hỏi thứ ${i + 1}: điểm câu hỏi không được vượt quá 100`
                        })
                    }
                }
            }
        }

        //Kiểm tra quiz tồn tại và thuộc giảng viên
        const quiz = await prisma.quizzes.findFirst({
            where: {
                idQuiz: parseInt(idQuiz),
                khoahoc: { idGiangVien: idGiangVien }
            },
            include: {
                khoahoc: true,
                quiz_results: true
            }
        })

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Bài kiểm tra không tồn tại hoặc bạn không có quyền sửa"
            })
        }

        //Kiểm tra khóa học còn hoạt động không
        if (!quiz.khoahoc.idGiangVien) {
            return res.status(400).json({
                success: false,
                message: "Khóa học không còn hoạt động, không thể sửa bài kiểm tra"
            })
        }

        //Nếu đã có học viên làm bài → chỉ cho sửa tên và thời gian
        if (quiz.quiz_results.length > 0 && cauHoi !== undefined) {
            return res.status(400).json({
                success: false,
                message: `Không thể sửa câu hỏi vì đã có ${quiz.quiz_results.length} học viên làm bài. Chỉ được sửa tên quiz và thời gian làm bài`
            })
        }

        //Kiểm tra tên quiz mới có trùng với quiz khác trong cùng khóa học không
        if (tenQuiz) {
            const trungTen = await prisma.quizzes.findFirst({
                where: {
                    idKhoaHoc: quiz.idKhoaHoc,
                    tenQuiz: tenQuiz.trim(),
                    NOT: { idQuiz: parseInt(idQuiz) }  
                }
            })
            if (trungTen) {
                return res.status(400).json({
                    success: false,
                    message: "Tên bài kiểm tra đã tồn tại trong khóa học này"
                })
            }
        }

        //Tiến hành cập nhật
        const dataUpdate = {}
        if (tenQuiz) dataUpdate.tenQuiz = tenQuiz.trim()
        if (thoiGianLamBai !== undefined) {
            dataUpdate.thoiGianLamBai = thoiGianLamBai === null ? null : parseInt(thoiGianLamBai)
        }
        if (cauHoi !== undefined) {
            dataUpdate.quiz_questions = {
                deleteMany: {},  // xóa hết câu hỏi cũ
                create: cauHoi.map(ch => ({
                    cauHoi: ch.cauHoi.trim(),
                    dapAnDung: ch.dapAnDung?.trim() ?? null,
                    diemCauHoi: ch.diemCauHoi ? parseFloat(ch.diemCauHoi) : 1.00
                }))
            }
        }

        const quizDaCapNhat = await prisma.quizzes.update({
            where: { idQuiz: parseInt(idQuiz) },
            data: dataUpdate,
            include: { quiz_questions: true }
        })

        return res.status(200).json({
            success: true,
            message: "Cập nhật bài kiểm tra thành công",
            data: quizDaCapNhat
        })

    } catch (error) {
        console.error("Lỗi khi sửa bài kiểm tra:", error)
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi sửa bài kiểm tra"
        })
    }
})

module.exports = router