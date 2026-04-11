require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('./generated/prisma');

// --- KIỂM TRA BIẾN MÔI TRƯỜNG NGAY KHI KHỞI ĐỘNG ---
console.log("-----------------------------------------");
console.log("🚀 Server đang khởi động...");
console.log("📁 Folder ID Drive:", process.env.GOOGLE_DRIVE_FOLDER_ID ? "ĐÃ NHẬN ✅" : "THIẾU ❌");
if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    console.log("   Mã ID: " + process.env.GOOGLE_DRIVE_FOLDER_ID);
}
console.log("-----------------------------------------");

const app = express();
const prisma = new PrismaClient();

// --- IMPORT ROUTES ---
const auth = require('./routes/auth');
const adminUsers = require('./routes/admin/users');
const adminClassrooms = require('./routes/admin/classrooms');
const giangVienQuiz = require('./routes/giangvien/quiz');
const giangVienBaiHoc = require('./routes/giangvien/baihoc');
const giangVienCert = require('./routes/giangvien/certificate');
const giangVienKhoaHoc = require('./routes/giangvien/khoahoc');
const hocvien = require('./routes/hocvien/hocvien');
const thanhtoan = require('./routes/thanhtoan');

// --- MIDDLEWARE ---
const allowedOrigins = [
    'https://lmsnhom10thu6.onrender.com',
    'https://nhom10thu6.netlify.app',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// --- ROUTING ---
app.use('/auth', auth);
app.use('/giang-vien/quiz', giangVienQuiz);
app.use('/admin/users', adminUsers);
app.use('/admin/classrooms', adminClassrooms);
app.use('/giang-vien/bai-hoc', giangVienBaiHoc);
app.use('/giang-vien/certificate', giangVienCert);
app.use('/giang-vien/khoa-hoc', giangVienKhoaHoc);
app.use('/api/hocvien', hocvien);
app.use('/thanhtoan', thanhtoan);

// Test server
app.get('/', (req, res) => {
    res.json({ message: 'API LMS is running 🚀' });
});

/* ============================================================
    🚀 MÁY BƠM DỮ LIỆU TỔNG HỢP (SEED DATA)
============================================================ */
app.get('/bom-data', async (req, res) => {
    try {
        const idBo = 8;
        console.log("🚀 Đang khởi động máy bơm dữ liệu...");

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
                baihoc: {
                    create: [
                        { tenBaiHoc: "Bài 1: Cài đặt môi trường JDK 17", thuTu: 1 },
                        { tenBaiHoc: "Bài 2: Biến và Kiểu dữ liệu", thuTu: 2 },
                        { tenBaiHoc: "Bài 3: Lập trình hướng đối tượng (OOP)", thuTu: 3 }
                    ]
                },
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

        const targetQuiz = await prisma.quizzes.findFirst({
            where: { idKhoaHoc: khoaJava.idKhoaHoc }
        });

        if (targetQuiz) {
            await prisma.quiz_results.deleteMany({
                where: { idQuiz: targetQuiz.idQuiz }
            });

            await prisma.quiz_results.createMany({
                data: [
                    { idNguoiDung: 7, idQuiz: targetQuiz.idQuiz, diemSo: 10.0, ngayLamBai: new Date() },
                    { idNguoiDung: 10, idQuiz: targetQuiz.idQuiz, diemSo: 4.5, ngayLamBai: new Date() }
                ]
            });
        }

        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #10b981;">🎉 BƠM DỮ LIỆU TỔNG HỢP THÀNH CÔNG!</h1>
                <p>Khóa học: ${khoaJava.tenKhoaHoc}</p>
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
        const data = await prisma.test.findMany();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { id, name, email, phone } = req.body;
        const newUser = await prisma.test.create({
            data: { id: parseInt(id), name, email, phone: parseInt(phone) }
        });
        res.json(newUser);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});