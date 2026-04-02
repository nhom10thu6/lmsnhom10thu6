const express = require("express");
const { PrismaClient } = require("../../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

const checkHocVien = async (req, res, next) => {
    try {
        // Sử dụng Optional Chaining (?.) để không bị lỗi nếu req.body không tồn tại
        const userId = req.body?.idNguoiDung || req.headers["x-user-id"];

        console.log("checkHocVien check:", {
            body: req.body,
            headerId: req.headers["x-user-id"]
        });

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Thiếu thông tin người dùng (idNguoiDung hoặc x-user-id)"
            });
        }

        const idNguoiDung = parseInt(userId);
        if (isNaN(idNguoiDung)) {
            return res.status(400).json({
                success: false,
                error: "ID người dùng không hợp lệ"
            });
        }

        const user = await prisma.nguoidung.findUnique({
            where: { idNguoiDung }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Người dùng không tồn tại"
            });
        }

        if (user.vaiTro !== "hocvien") {
            return res.status(403).json({
                success: false,
                error: "Chỉ học viên mới được truy cập chức năng này"
            });
        }

        req.user = user;

        console.log("HocVien authenticated:", {
            id: user.idNguoiDung,
            hoTen: user.hoTen,
            vaiTro: user.vaiTro
        });

        next();

    } catch (error) {
        console.error("Lỗi checkHocVien:", error);
        res.status(500).json({
            success: false,
            error: "Lỗi server"
        });
    }
};

// router.get("/khoahoc/:idKhoaHoc", checkHocVien, async (req, res) => {
//     try {
//         const idNguoiDung = req.user.idNguoiDung;
//         const idKhoaHoc = parseInt(req.params.idKhoaHoc);
//         if (isNaN(idKhoaHoc)) {
//             return res.status(400).json({ error: "ID khóa học không hợp lệ" });
//         }
//         const dangKy = await prisma.dangky_khoahoc.findFirst({
//             where: {
//                 idNguoiDung,
//                 idKhoaHoc
//             }
//         })
//         if (!dangKy) {
//             return res.status(403).json({
//                 error: "Bạn chưa đăng ký khóa học này"
//             });
//         }
//         const khoaHoc = await prisma.khoahoc.findUnique({
//             where: { idKhoaHoc },
//             include: {
//                 baihoc: {
//                     orderBy: { thuTu: "asc" }
//                 },
//                 quizzes: true
//             }
//         });
//         if (!khoaHoc) {
//             return res.status(404).json({ error: "Không tìm thấy khóa học" });
//         }
//         res.json({
//             success: true,
//             khoaHoc
//         });
//     }
//     catch (error) {
//         console.error("Lỗi xem chi tiết khóa học:", error);
//         res.status(500).json({ error: "Lỗi server" });
//     }
// });

router.get("/khoahoc/:idKhoaHoc", checkHocVien, async (req, res) => {
  try {
    const idNguoiDung = req.user.idNguoiDung;
    const idKhoaHoc = parseInt(req.params.idKhoaHoc);

    if (isNaN(idKhoaHoc)) {
      return res.status(400).json({ error: "ID khóa học không hợp lệ" });
    }

    const dangKy = await prisma.dangky_khoahoc.findFirst({
      where: { idNguoiDung, idKhoaHoc }
    });

    if (!dangKy) {
      return res.status(403).json({ error: "Bạn chưa đăng ký khóa học này" });
    }

    const khoaHoc = await prisma.khoahoc.findUnique({
  where: { idKhoaHoc },
  include: {
    baihoc: {
      orderBy: { thuTu: "asc" },
      include: {
        progress: {
          where: { idNguoiDung },
          orderBy: { idProgress: "desc" },
          take: 1,
          select: {
            trangThai: true
          }
        }
      }
    },
    quizzes: true
  }
});


    if (!khoaHoc) {
      return res.status(404).json({ error: "Không tìm thấy khóa học" });
    }

    const chuongMap = {};

    khoaHoc.baihoc.forEach((bh) => {
      const chuong = bh.thuTu;

      if (!chuongMap[chuong]) {
        chuongMap[chuong] = [];
      }

    //   chuongMap[chuong].push(bh);
      chuongMap[chuong].push({
        idBaiHoc: bh.idBaiHoc,
        tenBaiHoc: bh.tenBaiHoc,
        thuTu: bh.thuTu,
        trangThai:
          bh.progress.length > 0
            ? bh.progress[0].trangThai
            : "chua_hoc"
      });
    });

    const chuong = Object.keys(chuongMap).map((key) => ({
      chuong: Number(key),
      baiHoc: chuongMap[key]
    }));

    res.json({
      success: true,
      khoaHoc: {
        idKhoaHoc: khoaHoc.idKhoaHoc,
        tenKhoaHoc: khoaHoc.tenKhoaHoc,
        chuong,
        quizzes: khoaHoc.quizzes
      }
    });
  } catch (error) {
    console.error("Lỗi xem chi tiết khóa học:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});


// router.get("/baihoc/:idBaiHoc", checkHocVien, async (req, res) => {
//     try {
//         const idBaiHoc = parseInt(req.params.idBaiHoc);
//         const idNguoiDung = req.user.idNguoiDung;
//         if (isNaN(idBaiHoc)) {
//             return res.status(400).json({ error: "ID bài học không hợp lệ" });
//         }
//         const baiHoc = await prisma.baihoc.findUnique({
//             where: { idBaiHoc },
//             include: {
//                 khoahoc: {
//                     select: { idKhoaHoc: true }
//                 }
//             }
//         });

//         if (!baiHoc) {
//             return res.status(404).json({ error: "Không tìm thấy bài học" });
//         }
//         const dangKy = await prisma.dangky_khoahoc.findFirst({
//             where: {
//                 idNguoiDung,
//                 idKhoaHoc: baiHoc.idKhoaHoc
//             }
//         });
//         if (!dangKy) {
//             return res.status(403).json({ error: "Bạn chưa đăng ký khóa học này" });
//         }
//         let progress = await prisma.progress.findFirst({
//             where: {
//                 idNguoiDung,
//                 idKhoaHoc: baiHoc.idKhoaHoc,
//                 idBaiHoc
//             }
//         });
//         let loaiBaiHoc = "unknown";

//         if (baiHoc.videoUrl) {
//             loaiBaiHoc = "video";
//         } else if (baiHoc.taiLieuUrl) {
//             const ext = baiHoc.taiLieuUrl.split(".").pop().toLowerCase();

//             if (ext === "pdf") loaiBaiHoc = "pdf";
//             else if (ext === "doc" || ext === "docx") loaiBaiHoc = "word";
//             else if (ext === "ppt" || ext === "pptx") loaiBaiHoc = "ppt";
//             else loaiBaiHoc = "tailieu";
//         }

//         if (!progress) {
//             progress = await prisma.progress.create({
//                 data: {
//                     idNguoiDung,
//                     idKhoaHoc: baiHoc.idKhoaHoc,
//                     idBaiHoc,
//                     trangThai: "chua_hoc",
//                     thoiGianHoc: 0
//                 }
//             });
//         }

//         res.json({
//             success: true,
//             baiHoc,
//             loaiBaiHoc,
//             progress
//         });
//     } catch (error) {
//         console.error("Lỗi học bài:", error);
//         res.status(500).json({ error: "Lỗi server" });
//     }
// });
router.get("/baihoc/:idBaiHoc", checkHocVien, async (req, res) => {
    try {
        const idBaiHoc = parseInt(req.params.idBaiHoc);
        const idNguoiDung = req.user.idNguoiDung;
        if (isNaN(idBaiHoc)) {
            return res.status(400).json({ error: "ID bài học không hợp lệ" });
        }
        const baiHoc = await prisma.baihoc.findUnique({
            where: { idBaiHoc },
            include: {
                khoahoc: {
                    select: { idKhoaHoc: true }
                }
            }
        });

        if (!baiHoc) {
            return res.status(404).json({ error: "Không tìm thấy bài học" });
        }
        const dangKy = await prisma.dangky_khoahoc.findFirst({
            where: {
                idNguoiDung,
                idKhoaHoc: baiHoc.idKhoaHoc
            }
        });
        if (!dangKy) {
            return res.status(403).json({ error: "Bạn chưa đăng ký khóa học này" });
        }

        let progress = await prisma.progress.findFirst({
            where: {
                idNguoiDung,
                idKhoaHoc: baiHoc.idKhoaHoc,
                idBaiHoc
            }
        });
        let loaiBaiHoc = "unknown";
        if (baiHoc.videoUrl) {
            loaiBaiHoc = "video";
        } else if (baiHoc.taiLieuUrl) {
            const ext = baiHoc.taiLieuUrl.split(".").pop().toLowerCase();
            if (ext === "pdf") loaiBaiHoc = "pdf";
            else if (ext === "doc" || ext === "docx") loaiBaiHoc = "word";
            else if (ext === "ppt" || ext === "pptx") loaiBaiHoc = "ppt";
            else loaiBaiHoc = "tailieu";
        }
        if (!progress) {
            progress = await prisma.progress.create({
                data: {
                    idNguoiDung,
                    idKhoaHoc: baiHoc.idKhoaHoc,
                    idBaiHoc,
                    // trangThai: loaiBaiHoc === "video" ? "chua_hoc" : "hoan_thanh",
                    trangThai: "dang_hoc",
                    thoiGianHoc: 0
                }
            });
        }

        res.json({
            success: true,
            baiHoc,
            loaiBaiHoc,
            progress
        });
    } catch (error) {
        console.error("Lỗi học bài:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

//.patch: update 1 phần
router.patch("/start", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const { idBaiHoc } = req.body;
        if (!idBaiHoc) {
            return res.status(400).json({ error: "Thiếu idBaiHoc" });
        }

        const progress = await prisma.progress.findFirst({
            where: {
                idNguoiDung,
                idBaiHoc
            }
        });

        if (!progress) {
            return res.status(404).json({ error: "Chưa có progress" });
        }
        if (progress.trangThai !== "chua_hoc") {
            return res.json({
                success: true,
                progress
            });
        }
        const updated = await prisma.progress.update({
            where: {
                idProgress: progress.idProgress
            },
            data: {
                trangThai: "dang_hoc"
            }
        });

        res.json({
            success: true,
            progress: updated
        });
    }
    catch (error) {
        console.error("Lỗi start learning:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
//update thoi gian bai hoc
router.patch("/time", checkHocVien, async (req, res) => {
    try {
        const { idBaiHoc, thoiGianHoc } = req.body;
        const idNguoiDung = req.user.idNguoiDung;

        if (!idBaiHoc || thoiGianHoc === undefined) {
            return res.status(400).json({ error: "Thiếu dữ liệu" });
        }

        const progress = await prisma.progress.updateMany({
            where: {
                idNguoiDung,
                idBaiHoc
            },
            data: {
                thoiGianHoc,
                trangThai: "dang_hoc"
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi cập nhật time:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

router.patch("/complete", checkHocVien, async (req, res) => {
    try {
        const { idBaiHoc } = req.body;
        const idNguoiDung = req.user.idNguoiDung;

        await prisma.progress.updateMany({
            where: {
                idNguoiDung,
                idBaiHoc
            },
            data: {
                trangThai: "hoan_thanh"
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi complete:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

//check quyen truoc khi lam
router.get("/quiz/:idQuiz/start", checkHocVien, async (req, res) => {
    try {
        const idQuiz = parseInt(req.params.idQuiz);
        const idNguoiDung = req.user.idNguoiDung;

        const quiz = await prisma.quizzes.findUnique({
            where: { idQuiz },
            include: {
                quiz_questions: true,
                khoahoc: true
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz không tồn tại" });
        }

        const dangKy = await prisma.dangky_khoahoc.findFirst({
            where: {
                idNguoiDung,
                idKhoaHoc: quiz.idKhoaHoc
            }
        });

        if (!dangKy) {
            return res.status(403).json({ error: "Bạn chưa đăng ký khóa học" });
        }

        const daLam = await prisma.quiz_results.findFirst({
            where: {
                idNguoiDung,
                idQuiz
            }
        });

        if (daLam) {
            return res.json({
                success: true,
                daLam: true,
                diemSo: daLam.diemSo
            });
        }

        res.json({
            success: true,
            quiz,
            totalCauHoi: quiz.quiz_questions.length
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

//Lay bai kt
router.get("/quiz/:idQuiz", checkHocVien, async (req, res) => {
    try {
        const idQuiz = parseInt(req.params.idQuiz);
        const idNguoiDung = req.user.idNguoiDung;
        if (isNaN(idQuiz)) {
            return res.status(400).json({ error: "ID quiz không hợp lệ" });
        }
        const quiz = await prisma.quizzes.findUnique({
            where: {
                idQuiz
            },
            include: {
                khoahoc: {
                    select: {
                        idKhoaHoc: true
                    }
                },
                quiz_questions: {
                    orderBy: {
                        idCauHoi: "asc"
                    }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Không tìm thấy bài kiểm tra" });
        }

        const dangKy = await prisma.dangky_khoahoc.findFirst({
            where: {
                idNguoiDung,
                idKhoaHoc: quiz.khoahoc.idKhoaHoc
            }
        });
        if (!dangKy) {
            return res.status(403).json({ error: "Bạn chưa đăng ký khóa học này" });
        }
        const questions = quiz.quiz_questions.map(q => {
            const lines = q.cauHoi.split("\n").filter(Boolean);
            const cauHoi = lines[0];

            const dapAn = {};
            lines.forEach(line => {
                if (line.startsWith("A. ")) dapAn.A = line.replace("A. ", "");
                if (line.startsWith("B. ")) dapAn.B = line.replace("B. ", "");
                if (line.startsWith("C. ")) dapAn.C = line.replace("C. ", "");
                if (line.startsWith("D. ")) dapAn.D = line.replace("D. ", "");
            });

            return {
                idCauHoi: q.idCauHoi,
                cauHoi,
                dapAn
            };
        });
        const ketQua = await prisma.quiz_results.aggregate({
            where: { idNguoiDung, idQuiz },
            _max: { diemSo: true }
        });

        res.json({
            success: true,
            quiz: {
                idQuiz: quiz.idQuiz,
                tenQuiz: quiz.tenQuiz,
                thoiGianLamBai: quiz.thoiGianLamBai
            },
            questions,
            diemCaoNhat: ketQua._max.diemSo
        });
    }
    catch (error) {
        console.error("Lỗi lấy quiz:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

//Nop bai
router.post("/quiz/:idQuiz/submit", checkHocVien, async (req, res) => {
    try {
        const idQuiz = parseInt(req.params.idQuiz);
        const idNguoiDung = req.user.idNguoiDung;
        const { answers, thoiGianLamBai } = req.body;

        if (isNaN(idQuiz)) {
            return res.status(400).json({ error: "ID quiz không hợp lệ" });
        }

        if (!answers || typeof answers !== "object") {
            return res.status(400).json({ error: "Thiếu câu trả lời" });
        }
        const quiz = await prisma.quizzes.findUnique({
            where: { idQuiz },
            include: {
                quiz_questions: true
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Bài kiểm tra không tồn tại" });
        }
        const dangKy = await prisma.dangky_khoahoc.findFirst({
            where: {
                idNguoiDung,
                idKhoaHoc: quiz.idKhoaHoc
            }
        });

        if (!dangKy) {
            return res.status(403).json({ error: "Bạn chưa đăng ký khóa học này" });
        }
        const ketQuaCu = await prisma.quiz_results.findFirst({
            where: {
                idNguoiDung,
                idQuiz
            }
        });
        if (ketQuaCu && Number(ketQuaCu.diemSo) >= 5) {
            return res.status(403).json({
                error: "Bạn đã đạt bài kiểm tra, không thể làm lại",
                diemSo: ketQuaCu.diemSo
            });
        }
        if (quiz.thoiGianLamBai) {
            const maxTime = quiz.thoiGianLamBai * 60;
            if (thoiGianLamBai > maxTime) {
                return res.status(403).json({ error: "Hết thời gian làm bài" });
            }
        }
        let diemSo = 0;

        quiz.quiz_questions.forEach(q => {
            if (answers[q.idCauHoi] === q.dapAnDung) {
                diemSo += Number(q.diemCauHoi || 0);
            }
        });
        if (ketQuaCu) {
            await prisma.quiz_results.delete({
                where: { idKetQua: ketQuaCu.idKetQua }
            });
        }
        const ketQuaMoi = await prisma.quiz_results.create({
            data: {
                idNguoiDung,
                idQuiz,
                diemSo,
                thoiGianLamBai: thoiGianLamBai || 0
            }
        });

        res.json({
            success: true,
            diemSo,
            dat: diemSo >= 5,
            choPhepLamLai: diemSo < 5,
            message: diemSo >= 5 ? "Chúc mừng bạn đã đạt" : "Bạn chưa đạt, có thể làm lại"
        });

    } catch (error) {
        console.error("Lỗi submit quiz:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

router.get("/quiz/:idQuiz/result", checkHocVien, async (req, res) => {
    try {
        const idQuiz = parseInt(req.params.idQuiz);
        const idNguoiDung = req.user.idNguoiDung;

        const result = await prisma.quiz_results.findFirst({
            where: {
                idQuiz,
                idNguoiDung
            }
        });

        if (!result) {
            return res.status(404).json({ error: "Chưa làm bài kiểm tra" });
        }

        res.json({
            success: true,
            result
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// Thêm đoạn này vào cuối file routes/hocvien/hocvien.js
router.get("/certificate/:idKhoaHoc", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const idKhoaHoc = parseInt(req.params.idKhoaHoc);

        if (isNaN(idKhoaHoc)) {
            return res.status(400).json({ success: false, error: "ID khóa học không hợp lệ" });
        }

        // 1. Kiểm tra chứng chỉ đã tồn tại chưa
        const existingCert = await prisma.certificates.findFirst({
            where: { idNguoiDung, idKhoaHoc }
        });

        if (existingCert) {
            return res.json({ success: true, cert: existingCert });
        }

        // 2. Nếu chưa có, kiểm tra tiến độ học tập
        const allLessons = await prisma.baihoc.findMany({
            where: { idKhoaHoc }
        });

        const progress = await prisma.progress.findMany({
            where: { idNguoiDung, idKhoaHoc, trangThai: "hoan_thanh" }
        });

        // So sánh số lượng bài học đã hoàn thành với tổng số bài học
        if (progress.length < allLessons.length || allLessons.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: "Bạn chưa hoàn thành tất cả bài học trong khóa học này",
                progress: `${progress.length}/${allLessons.length}`
            });
        }

        // 3. Tạo chứng chỉ mới
        const newCert = await prisma.certificates.create({
            data: {
                idNguoiDung,
                idKhoaHoc,
                ngayCap: new Date()
            }
        });

        res.json({ success: true, cert: newCert });

    } catch (err) {
        console.error("Lỗi cấp chứng chỉ:", err);
        res.status(500).json({ success: false, error: "Lỗi server nội bộ" });
    }
});

// ===== API xem danh sách khóa học =====
router.get("/khoahoc", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const dsKhoaHoc = await prisma.khoahoc.findMany({
            include: {
                nguoidung: {
                    select: { hoTen: true }
                }
            }
        });

        const dangKy = await prisma.dangky_khoahoc.findMany({
            where: { idNguoiDung },
            select: { idKhoaHoc: true }
        });
        const dangKySet = new Set(dangKy.map(item => item.idKhoaHoc));

        const result = dsKhoaHoc.map(kh => ({
            idKhoaHoc: kh.idKhoaHoc,
            tenKhoaHoc: kh.tenKhoaHoc,
            moTa: kh.moTa,
            danhMuc: kh.danhMuc,
            gia: kh.gia,
            idGiangVien: kh.idGiangVien,
            giangVien: kh.nguoidung?.hoTen || null,
            daDangKy: dangKySet.has(kh.idKhoaHoc)
        }));

        res.json({ success: true, khoaHoc: result });
    } catch (err) {
        console.error("Lỗi lấy danh sách khóa học:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ===== API xem khóa học đã đăng ký =====
router.get("/khoahoc/dang-ky", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const dsDangKy = await prisma.dangky_khoahoc.findMany({
            where: { idNguoiDung },
            include: { khoahoc: true }
        });

        const result = dsDangKy.map(dk => ({
            idKhoaHoc: dk.khoahoc.idKhoaHoc,
            tenKhoaHoc: dk.khoahoc.tenKhoaHoc,
            moTa: dk.khoahoc.moTa,
            gia: dk.khoahoc.gia,
            ngayDangKy: dk.ngayDangKy
        }));

        res.json({ success: true, khoaHocDangKy: result });
    } catch (err) {
        console.error("Lỗi lấy khóa học đăng ký:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ===== API đăng ký khóa học =====
router.post("/khoahoc/dang-ky", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const { idKhoaHoc } = req.body;

        if (!idKhoaHoc || isNaN(parseInt(idKhoaHoc))) {
            return res.status(400).json({ error: "idKhoaHoc không hợp lệ" });
        }

        const khoaHoc = await prisma.khoahoc.findUnique({ where: { idKhoaHoc: parseInt(idKhoaHoc) } });
        if (!khoaHoc) {
            return res.status(404).json({ error: "Khóa học không tồn tại" });
        }

        const existed = await prisma.dangky_khoahoc.findUnique({
            where: { idNguoiDung_idKhoaHoc: { idNguoiDung, idKhoaHoc: parseInt(idKhoaHoc) } }
        });

        if (existed) {
            return res.status(400).json({ success: false, message: "Bạn đã đăng ký khóa học này" });
        }

        const dangKy = await prisma.dangky_khoahoc.create({
            data: {
                idNguoiDung,
                idKhoaHoc: parseInt(idKhoaHoc)
            }
        });

        res.json({ success: true, message: "Đăng ký khóa học thành công", dangKy });
    } catch (err) {
        console.error("Lỗi đăng ký khóa học:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ===== API xem chứng chỉ =====
router.get("/certificate", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const certificates = await prisma.certificates.findMany({
            where: { idNguoiDung },
            include: { khoahoc: true }
        });

        res.json({ success: true, certificates });
    } catch (err) {
        console.error("Lỗi lấy chứng chỉ:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ===== API in chứng chỉ =====
router.get("/certificate/:idKhoaHoc/print", checkHocVien, async (req, res) => {
    try {
        const idNguoiDung = req.user.idNguoiDung;
        const idKhoaHoc = parseInt(req.params.idKhoaHoc);

        if (isNaN(idKhoaHoc)) {
            return res.status(400).json({ error: "ID khóa học không hợp lệ" });
        }

        const cert = await prisma.certificates.findFirst({
            where: { idNguoiDung, idKhoaHoc },
            include: { khoahoc: true, nguoidung: true }
        });

        if (!cert) {
            return res.status(404).json({ error: "Chứng chỉ chưa có" });
        }

        // Trả dữ liệu dạng JSON để frontend xây dựng template in
        res.json({
            success: true,
            printData: {
                hoTen: cert.nguoidung.hoTen,
                tenKhoaHoc: cert.khoahoc.tenKhoaHoc,
                ngayCap: cert.ngayCap,
                idCertificate: cert.idCertificate
            }
        });
    } catch (err) {
        console.error("Lỗi in chứng chỉ:", err);
        res.status(500).json({ error: "Lỗi server" });
    }
});

module.exports = router;