require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('./generated/prisma')

const app = express()
const prisma = new PrismaClient()

// --- IMPORT ROUTES ---
const auth = require('./routes/auth')
const adminUsers = require('./routes/admin/users')
const adminClassrooms = require('./routes/admin/classrooms')
const giangVienQuiz = require('./routes/giangvien/quiz')
const giangVienBaiHoc = require('./routes/giangvien/baihoc')
const giangVienCert = require('./routes/giangvien/certificate')
const giangVienKhoaHoc = require('./routes/giangvien/khoahoc')
const hocvien = require('./routes/hocvien/hocvien')

// --- MIDDLEWARE ---
app.use(cors())
app.use(express.json())

// --- ROUTING ---
app.use('/auth', auth)
app.use('/giang-vien/quiz', giangVienQuiz)
app.use('/admin/users', adminUsers)
app.use('/admin/classrooms', adminClassrooms)
app.use('/giang-vien/bai-hoc', giangVienBaiHoc)
app.use('/giang-vien/certificate', giangVienCert)
app.use('/giang-vien/khoa-hoc', giangVienKhoaHoc)
app.use('/api/hocvien', hocvien)

// Test server
app.get('/', (req, res) => {
    res.json({ message: 'API LMS is running 🚀' })
})

/* ============================================================
   🚀 MÁY BƠM DỮ LIỆU TỔNG HỢP (SEED DATA)
   Tạo Khóa học, Bài học, Quiz và Điểm số mẫu cho Học viên
============================================================ */
app.get('/bom-data', async (req, res) => {
    try {
        const idBo = 8; // ID của giảng viên Vũ Thanh Bo

        console.log("🚀 Đang khởi động máy bơm dữ liệu...");

        // 1. Tạo hoặc Cập nhật Khóa học JAVA 17
        // Sử dụng upsert để tránh tạo trùng lặp nếu bấm nhiều lần
        const khoaJava = await prisma.khoahoc.upsert({
            where: { idKhoaHoc: 1 }, 
            update: {
                tenKhoaHoc: "JAVA 17 Pro - Lập trình hướng đối tượng",
                moTa: "Làm chủ Java core, Collection và Stream API",
            },
            create: {
                idKhoaHoc: 1,
                tenKhoaHoc: "JAVA 17 Pro - Lập trình hướng đối tượng",
                moTa: "Làm chủ Java core, Collection và Stream API",
                danhMuc: "IT",
                gia: 750000,
                idGiangVien: idBo,
                // Tạo bài học mẫu
                baihoc: {
                    create: [
                        { tenBaiHoc: "Bài 1: Cài đặt môi trường JDK 17", thuTu: 1 },
                        { tenBaiHoc: "Bài 2: Biến và Kiểu dữ liệu", thuTu: 2 },
                        { tenBaiHoc: "Bài 3: Lập trình hướng đối tượng (OOP)", thuTu: 3 }
                    ]
                },
                // Tạo Quiz mẫu
                quizzes: {
                    create: [
                        {
                            tenQuiz: "Kiểm tra kiến thức Java Core",
                            thoiGianLamBai: 20,
                            quiz_questions: {
                                create: [
                                    { cauHoi: "Java có phải ngôn ngữ đa nền tảng?", dapAnDung: "Đúng", diemCauHoi: 10 },
                                    { cauHoi: "Từ khóa nào dùng để kế thừa?", dapAnDung: "extends", diemCauHoi: 10 }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        // 2. Lấy ID Quiz vừa tạo/cập nhật của khóa học này
        const targetQuiz = await prisma.quizzes.findFirst({
            where: { idKhoaHoc: khoaJava.idKhoaHoc }
        });

        if (targetQuiz) {
            // Xóa điểm cũ để bơm mới (Tránh lỗi Duplicate)
            await prisma.quiz_results.deleteMany({
                where: { idQuiz: targetQuiz.idQuiz }
            });

            // 3. Bơm điểm số mẫu cho Học viên (ID 7 và 10)
            // Lưu ý: Đảm bảo ID 7 và 10 có trong bảng nguoidung
            await prisma.quiz_results.createMany({
                data: [
                    { idNguoiDung: 7, idQuiz: targetQuiz.idQuiz, diemSo: 10.0, ngayLamBai: new Date() },
                    { idNguoiDung: 10, idQuiz: targetQuiz.idQuiz, diemSo: 4.5, ngayLamBai: new Date() }
                ]
            });
        }

        // 4. Bơm thêm một khóa học ReactJS cho đa dạng
        await prisma.khoahoc.create({
            data: {
                tenKhoaHoc: "ReactJS & Prisma Thực Chiến",
                moTa: "Xây dựng hệ thống quản lý học tập (LMS)",
                danhMuc: "IT",
                gia: 590000,
                idGiangVien: idBo
            }
        }).catch(() => console.log("Khóa React đã tồn tại."));

        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #10b981;">🎉 BƠM DỮ LIỆU TỔNG HỢP THÀNH CÔNG!</h1>
                <p>Khóa học: ${khoaJava.tenKhoaHoc}</p>
                <p>Đã bơm điểm cho Học viên ID 7 (10đ) và ID 10 (4.5đ).</p>
                <hr/>
                <a href="http://localhost:5173/giangvien/bang-diem" 
                   style="background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">
                   Quay lại Dashboard Giảng Viên
                </a>
            </div>
        `);

    } catch (error) {
        console.error("Lỗi bơm data:", error);
        res.status(500).send("Lỗi Server: " + error.message);
    }
});

/* ============================================================
   🛠️ API TEST (DÀNH CHO BẢNG TEST)
============================================================ */
app.get('/users', async (req, res) => {
    try {
        const data = await prisma.test.findMany()
        res.json(data)
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

app.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params
        const user = await prisma.test.findUnique({ where: { id: parseInt(id) } })
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/users', async (req, res) => {
    try {
        const { id, name, email, phone } = req.body
        const newUser = await prisma.test.create({
            data: { id: parseInt(id), name, email, phone: parseInt(phone) }
        })
        res.json(newUser)
    } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})