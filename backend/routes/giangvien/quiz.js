const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../../generated/prisma')
const prisma = new PrismaClient()
const {checkGiangVien} = require('../middleware/middleware')
const chuaKyTuNguyHiem = require('../../helper/helper.js').chuaKyTuNguyHiem

const LOAI_CAU_HOI_HOP_LE = new Set(['tracnghiem', 'tuluan'])

function layDanhSachCauHoiTuBody(body) {
    if (body?.cauHoi !== undefined) return body.cauHoi
    if (body?.questions !== undefined) return body.questions
    return undefined
}

function chuanHoaCauHoi(rawCauHoi, { batBuocCoCauHoi = false } = {}) {
    if (rawCauHoi === undefined) {
        if (batBuocCoCauHoi) {
            return { error: 'Bài kiểm tra phải có ít nhất 1 câu hỏi' }
        }
        return { questions: undefined }
    }

    if (!Array.isArray(rawCauHoi)) {
        return { error: 'Câu hỏi phải là một mảng' }
    }

    if (batBuocCoCauHoi && rawCauHoi.length === 0) {
        return { error: 'Bài kiểm tra phải có ít nhất 1 câu hỏi' }
    }

    if (rawCauHoi.length > 100) {
        return {
            error: `Bài kiểm tra chỉ được tối đa 100 câu hỏi (hiện tại: ${rawCauHoi.length} câu)`
        }
    }

    const questions = []

    for (let i = 0; i < rawCauHoi.length; i++) {
        const ch = rawCauHoi[i] || {}
        const stt = i + 1

        const noiDungCauHoi = typeof ch.cauHoi === 'string' ? ch.cauHoi.trim() : ''
        if (!noiDungCauHoi) {
            return { error: `Câu hỏi thứ ${stt}: nội dung câu hỏi không được để trống` }
        }

        let diemCauHoi = 1.0
        if (ch.diemCauHoi !== undefined && ch.diemCauHoi !== null && ch.diemCauHoi !== '') {
            const diem = parseFloat(ch.diemCauHoi)
            if (isNaN(diem) || diem <= 0) {
                return { error: `Câu hỏi thứ ${stt}: điểm câu hỏi phải là số dương` }
            }
            diemCauHoi = diem
        }

        const loaiCauHoi = (typeof ch.loaiCauHoi === 'string' ? ch.loaiCauHoi : 'tracnghiem').trim().toLowerCase()
        if (!LOAI_CAU_HOI_HOP_LE.has(loaiCauHoi)) {
            return { error: `Câu hỏi thứ ${stt}: loại câu hỏi không hợp lệ` }
        }

        const question = {
            cauHoi: noiDungCauHoi,
            diemCauHoi,
            loaiCauHoi,
            dapAnDung: null,
            dapAnA: null,
            dapAnB: null,
            dapAnC: null,
            dapAnD: null
        }

        if (loaiCauHoi === 'tracnghiem') {
            const dapAnA = typeof ch.dapAnA === 'string' ? ch.dapAnA.trim() : ''
            const dapAnB = typeof ch.dapAnB === 'string' ? ch.dapAnB.trim() : ''
            const dapAnC = typeof ch.dapAnC === 'string' ? ch.dapAnC.trim() : ''
            const dapAnD = typeof ch.dapAnD === 'string' ? ch.dapAnD.trim() : ''

            if (!dapAnA || !dapAnB || !dapAnC || !dapAnD) {
                return { error: `Câu hỏi thứ ${stt}: trắc nghiệm phải có đủ đáp án A, B, C, D` }
            }

            const dapAnDung = typeof ch.dapAnDung === 'string' ? ch.dapAnDung.trim().toUpperCase() : ''
            if (!['A', 'B', 'C', 'D'].includes(dapAnDung)) {
                return { error: `Câu hỏi thứ ${stt}: đáp án đúng phải là A, B, C hoặc D` }
            }

            question.dapAnA = dapAnA
            question.dapAnB = dapAnB
            question.dapAnC = dapAnC
            question.dapAnD = dapAnD
            question.dapAnDung = dapAnDung
        } else {
            const goiYDapAn = typeof ch.dapAnDung === 'string' ? ch.dapAnDung.trim() : ''
            question.dapAnDung = goiYDapAn || null
        }

        questions.push(question)
    }

    return { questions }
}

router.post("/tao-bai-kiem-tra", checkGiangVien, async (req, res) => {
    try{
        const idGiangVien = req.user.idNguoiDung;
        const {idKhoaHoc, tenQuiz, thoiGianLamBai} = req.body;
        const rawCauHoi = layDanhSachCauHoiTuBody(req.body)

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

        const parsedQuestions = chuanHoaCauHoi(rawCauHoi, { batBuocCoCauHoi: true })
        if (parsedQuestions.error) {
            return res.status(400).json({
                success: false,
                message: parsedQuestions.error
            })
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
            quiz_questions: {
                create: parsedQuestions.questions
            }
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

        if (isNaN(parseInt(idKhoaHoc))) {
            return res.status(400).json({
                success: false,
                message: "idKhoaHoc phải là số nguyên"
            })
        }

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

        const danhSachQuiz = await prisma.quizzes.findMany({
            where: { idKhoaHoc: parseInt(idKhoaHoc) },
            include: {
                quiz_questions: true, // Liêm nên để lấy hết thay vì chỉ lấy diemCauHoi để FE hiển thị nếu cần
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

        const ketQuaTheoQuiz = danhSachQuiz.map(quiz => {
            const tongDiemToiDa = quiz.quiz_questions.reduce((sum, ch) => {
                return sum + parseFloat(ch.diemCauHoi ?? 1)
            }, 0)

            const danhSachKetQua = quiz.quiz_results.map(kq => ({
                idKetQua: kq.idKetQua,
                hocVien: kq.nguoidung,
                diemSo: parseFloat(kq.diemSo ?? 0),
                thoiGianLamBai: kq.thoiGianLamBai,
                ngayLamBai: kq.ngayLamBai
            }))

            const danhSachDiem = danhSachKetQua.map(kq => kq.diemSo)
            const tongSoHocVienDaLam = danhSachDiem.length

            const thongKe = tongSoHocVienDaLam > 0 ? {
                tongSoHocVienDaLam,
                diemTrungBinh: parseFloat((danhSachDiem.reduce((a, b) => a + b, 0) / tongSoHocVienDaLam).toFixed(2)),
                diemCaoNhat: Math.max(...danhSachDiem),
                diemThapNhat: Math.min(...danhSachDiem),
                soHocVienDat: danhSachDiem.filter(d => d >= tongDiemToiDa * 0.5).length,
                soHocVienKhongDat: danhSachDiem.filter(d => d < tongDiemToiDa * 0.5).length
            } : {
                tongSoHocVienDaLam: 0, diemTrungBinh: 0, diemCaoNhat: 0, diemThapNhat: 0, soHocVienDat: 0, soHocVienKhongDat: 0
            }

            return {
                idQuiz: quiz.idQuiz,
                tenQuiz: quiz.tenQuiz,
                thoiGianLamBai: quiz.thoiGianLamBai,
                tongDiemToiDa,
                thongKe,
                bangDiem: danhSachKetQua,
                quiz_questions: quiz.quiz_questions // Trả về thêm câu hỏi để đồng bộ giáo trình
            }
        })

        return res.status(200).json({
            success: true,
            message: "Lấy bảng điểm thành công",
            data: {
                khoaHoc: { idKhoaHoc: khoaHoc.idKhoaHoc, tenKhoaHoc: khoaHoc.tenKhoaHoc },
                tongSoQuiz: danhSachQuiz.length,
                danhSachQuiz: ketQuaTheoQuiz
            }
        })

    } catch (error) {
        console.error("Lỗi khi xem bảng điểm:", error)
        return res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi xem bảng điểm" })
    }
})

router.delete("/xoa-bai-kiem-tra/:idQuiz", checkGiangVien, async (req, res) => {
    try {
        const idGiangVien = req.user.idNguoiDung
        const { idQuiz } = req.params
        const { tenQuiz } = req.body;

        if (!idQuiz || isNaN(parseInt(idQuiz)) || parseInt(idQuiz) <= 0) {
            return res.status(400).json({ success: false, message: "id quiz không hợp lệ" })
        }
        if (!tenQuiz || typeof tenQuiz !== 'string' || tenQuiz.trim() === '') {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên Quiz để xác nhận xóa" });
        }
        if (chuaKyTuNguyHiem(tenQuiz)) {
            return res.status(400).json({ success: false, message: "tenQuiz chứa ký tự không hợp lệ" });
        }

        const quiz = await prisma.quizzes.findFirst({
            where: { idQuiz: parseInt(idQuiz), khoahoc: { idGiangVien: idGiangVien } },
            include: { khoahoc: true, quiz_results: true }
        })

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Bài kiểm tra không tồn tại hoặc bạn không có quyền xóa" })
        }
        if (quiz.quiz_results.length > 0) {
            return res.status(400).json({ success: false, message: `Không thể xóa vì đã có ${quiz.quiz_results.length} học viên làm bài` })
        }

        await prisma.quizzes.delete({ where: { idQuiz: parseInt(idQuiz) } })
        return res.status(200).json({ success: true, message: `Đã xóa bài kiểm tra "${quiz.tenQuiz}" thành công` })
    } catch (error) {
        console.error("Lỗi khi xóa bài kiểm tra:", error)
        return res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi xóa bài kiểm tra" })
    }
})

router.put("/sua-bai-kiem-tra/:idQuiz", checkGiangVien, async (req, res) => {
    try {
        const idGiangVien = req.user.idNguoiDung
        const { idQuiz } = req.params
        const { tenQuiz, thoiGianLamBai } = req.body
        const rawCauHoi = layDanhSachCauHoiTuBody(req.body)

        if (!idQuiz || isNaN(parseInt(idQuiz)) || parseInt(idQuiz) <= 0) {
            return res.status(400).json({ success: false, message: "id quiz không hợp lệ" })
        }

        if (tenQuiz === undefined && thoiGianLamBai === undefined && rawCauHoi === undefined) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật" })
        }

        const quiz = await prisma.quizzes.findFirst({
            where: { idQuiz: parseInt(idQuiz), khoahoc: { idGiangVien: idGiangVien } },
            include: { khoahoc: true, quiz_results: true }
        })

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Bài kiểm tra không tồn tại hoặc bạn không có quyền sửa" })
        }

        if (quiz.quiz_results.length > 0 && rawCauHoi !== undefined) {
            return res.status(400).json({
                success: false,
                message: `Không thể sửa câu hỏi vì đã có ${quiz.quiz_results.length} học viên làm bài.`
            })
        }

        const dataUpdate = {}
        if (tenQuiz) dataUpdate.tenQuiz = tenQuiz.trim()
        if (thoiGianLamBai !== undefined) {
            dataUpdate.thoiGianLamBai = thoiGianLamBai === null ? null : parseInt(thoiGianLamBai)
        }
        if (rawCauHoi !== undefined) {
            const parsedQuestions = chuanHoaCauHoi(rawCauHoi, { batBuocCoCauHoi: true })
            if (parsedQuestions.error) {
                return res.status(400).json({ success: false, message: parsedQuestions.error })
            }

            dataUpdate.quiz_questions = {
                deleteMany: {},
                create: parsedQuestions.questions
            }
        }

        const quizDaCapNhat = await prisma.quizzes.update({
            where: { idQuiz: parseInt(idQuiz) },
            data: dataUpdate,
            include: { quiz_questions: true }
        })

        return res.status(200).json({ success: true, message: "Cập nhật thành công", data: quizDaCapNhat })

    } catch (error) {
        console.error("Lỗi khi sửa bài kiểm tra:", error)
        return res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi sửa bài kiểm tra" })
    }
})

module.exports = router