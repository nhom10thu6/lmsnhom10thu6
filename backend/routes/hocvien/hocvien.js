const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../../generated/prisma');
const { loadUser, parseUserId } = require('../middleware/middleware');

const prisma = new PrismaClient();

function giaKhoa(kh) {
  const n = Number(kh.gia ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function laKhoaMienPhi(kh) {
  return giaKhoa(kh) <= 0;
}

/** Được học nội dung khi đã đăng ký và (miễn phí hoặc đã ghi nhận thanh toán) */
function duocHocNoiDung(dangKy, kh) {
  if (!dangKy) return false;
  if (laKhoaMienPhi(kh)) return true;
  return dangKy.ngayThanhToan != null;
}

function loaiBaiHocRow(bh) {
  if (bh.videoUrl) return 'video';
  if (bh.taiLieuUrl) {
    const u = bh.taiLieuUrl.toLowerCase();
    if (u.includes('.pdf') || u.includes('pdf')) return 'pdf';
    if (u.includes('word') || u.includes('.doc')) return 'word';
    if (u.includes('ppt') || u.includes('presentation')) return 'ppt';
    return 'pdf';
  }
  return 'text';
}

// --- Khóa học: danh sách / đăng ký / thanh toán ---

router.get('/khoahoc', async (req, res) => {
  try {
    const uid = parseUserId(req);
    const list = await prisma.khoahoc.findMany({
      orderBy: { ngayTao: 'desc' },
      include: { nguoidung: { select: { hoTen: true } } },
    });

    let enrollMap = new Map();
    if (uid) {
      const regs = await prisma.dangky_khoahoc.findMany({ where: { idNguoiDung: uid } });
      enrollMap = new Map(regs.map((r) => [r.idKhoaHoc, r]));
    }

    const khoaHoc = list.map((kh) => {
      const dk = enrollMap.get(kh.idKhoaHoc);
      const price = giaKhoa(kh);
      const daDangKy = !!dk;
      const choThanhToan = daDangKy && price > 0 && !dk.ngayThanhToan;
      const canHoc = daDangKy && duocHocNoiDung(dk, kh);
      return {
        idKhoaHoc: kh.idKhoaHoc,
        tenKhoaHoc: kh.tenKhoaHoc,
        moTa: kh.moTa,
        danhMuc: kh.danhMuc,
        gia: price,
        giangVien: kh.nguoidung?.hoTen || 'Giảng viên',
        daDangKy,
        choThanhToan,
        canHoc,
      };
    });

    return res.json({ success: true, khoaHoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

router.get('/khoahoc/dang-ky', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const regs = await prisma.dangky_khoahoc.findMany({
      where: { idNguoiDung: uid },
      include: { khoahoc: { include: { nguoidung: { select: { hoTen: true } } } } },
    });

    const khoaHocDangKy = regs
      .filter((r) => duocHocNoiDung(r, r.khoahoc))
      .map((r) => ({
        idKhoaHoc: r.khoahoc.idKhoaHoc,
        tenKhoaHoc: r.khoahoc.tenKhoaHoc,
        moTa: r.khoahoc.moTa,
        danhMuc: r.khoahoc.danhMuc,
        gia: giaKhoa(r.khoahoc),
        giangVien: r.khoahoc.nguoidung?.hoTen,
      }));

    return res.json({ success: true, khoaHocDangKy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

/** Khóa đã đăng ký nhưng chưa thanh toán (trả phí) */
router.get('/khoahoc/cho-thanh-toan', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const regs = await prisma.dangky_khoahoc.findMany({
      where: { idNguoiDung: uid, ngayThanhToan: null },
      include: { khoahoc: { include: { nguoidung: { select: { hoTen: true } } } } },
    });

    const items = regs
      .filter((r) => !laKhoaMienPhi(r.khoahoc))
      .map((r) => ({
        idDangKy: r.idDangKy,
        idKhoaHoc: r.khoahoc.idKhoaHoc,
        tenKhoaHoc: r.khoahoc.tenKhoaHoc,
        moTa: r.khoahoc.moTa,
        gia: giaKhoa(r.khoahoc),
        giangVien: r.khoahoc.nguoidung?.hoTen,
        ngayDangKy: r.ngayDangKy,
      }));

    return res.json({ success: true, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

router.post('/khoahoc/dang-ky', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idKhoaHoc = parseInt(req.body?.idKhoaHoc, 10);
    if (!idKhoaHoc) {
      return res.status(400).json({ success: false, message: 'Thiếu id khóa học.' });
    }

    const kh = await prisma.khoahoc.findUnique({ where: { idKhoaHoc } });
    if (!kh) {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại.' });
    }

    const existed = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc } },
    });
    if (existed) {
      const price = giaKhoa(kh);
      const pending = price > 0 && !existed.ngayThanhToan;
      return res.json({
        success: true,
        message: pending ? 'Bạn đã đăng ký — vui lòng hoàn tất thanh toán.' : 'Bạn đã đăng ký khóa này rồi.',
        trangThai: pending ? 'cho_thanh_toan' : 'da_kich_hoat',
        idKhoaHoc,
      });
    }

    const now = new Date();
    const payOk = laKhoaMienPhi(kh);
    await prisma.dangky_khoahoc.create({
      data: {
        idNguoiDung: uid,
        idKhoaHoc,
        ngayThanhToan: payOk ? now : null,
      },
    });

    return res.json({
      success: true,
      message: payOk ? 'Đăng ký thành công!' : 'Đăng ký thành công. Vui lòng thanh toán để vào học.',
      trangThai: payOk ? 'mien_phi' : 'cho_thanh_toan',
      idKhoaHoc,
      soTien: payOk ? 0 : giaKhoa(kh),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

/**
 * Demo: chỉ chuyển khoản ngân hàng — kiểm tra định dạng, không lưu STK.
 * Production: thay bằng cổng thanh toán + webhook.
 */
router.post('/khoahoc/thanh-toan', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idKhoaHoc = parseInt(req.body?.idKhoaHoc, 10);
    const phuongThuc = String(req.body?.phuongThuc || 'bank').toLowerCase();

    if (!idKhoaHoc) {
      return res.status(400).json({ success: false, message: 'Thiếu id khóa học.' });
    }

    if (phuongThuc !== 'bank') {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ thanh toán qua ngân hàng.' });
    }

    const tenNganHang = String(req.body?.tenNganHang || '').trim();
    const soTaiKhoan = String(req.body?.soTaiKhoan || '').replace(/\D/g, '');
    const tenChuTaiKhoan = String(req.body?.tenChuTaiKhoan || '').trim();
    if (!tenNganHang || tenNganHang.length < 2) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ngân hàng.' });
    }
    if (soTaiKhoan.length < 8 || soTaiKhoan.length > 16) {
      return res.status(400).json({ success: false, message: 'Số tài khoản không hợp lệ (8–16 chữ số).' });
    }
    if (tenChuTaiKhoan.length < 3) {
      return res.status(400).json({ success: false, message: 'Nhập tên chủ tài khoản (ít nhất 3 ký tự).' });
    }

    const kh = await prisma.khoahoc.findUnique({ where: { idKhoaHoc } });
    if (!kh) {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại.' });
    }
    if (laKhoaMienPhi(kh)) {
      return res.status(400).json({ success: false, message: 'Khóa miễn phí không cần thanh toán.' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc } },
    });
    if (!dk) {
      return res.status(400).json({ success: false, message: 'Bạn chưa đăng ký khóa học này.' });
    }
    if (dk.ngayThanhToan) {
      return res.json({ success: true, message: 'Khóa học đã được kích hoạt trước đó.', idKhoaHoc });
    }

    await prisma.dangky_khoahoc.update({
      where: { idDangKy: dk.idDangKy },
      data: { ngayThanhToan: new Date() },
    });

    return res.json({
      success: true,
      message: 'Thanh toán thành công! Bạn có thể vào học ngay.',
      idKhoaHoc,
      soTien: giaKhoa(kh),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

router.get('/khoahoc/:idKhoaHoc', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idKhoaHoc = parseInt(req.params.idKhoaHoc, 10);
    if (!idKhoaHoc) {
      return res.status(400).json({ success: false, error: 'id không hợp lệ' });
    }

    const kh = await prisma.khoahoc.findUnique({
      where: { idKhoaHoc },
      include: {
        baihoc: { orderBy: { thuTu: 'asc' } },
        quizzes: { select: { idQuiz: true, tenQuiz: true, thoiGianLamBai: true } },
        nguoidung: { select: { hoTen: true } },
      },
    });
    if (!kh) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc } },
    });
    if (!dk) {
      return res.status(403).json({ success: false, error: 'Bạn chưa đăng ký khóa học này' });
    }
    if (!duocHocNoiDung(dk, kh)) {
      return res.status(402).json({
        success: false,
        error: 'Vui lòng hoàn tất thanh toán để truy cập nội dung khóa học.',
        choThanhToan: true,
        gia: giaKhoa(kh),
      });
    }

    const progressRows = await prisma.progress.findMany({
      where: { idNguoiDung: uid, idKhoaHoc },
    });
    const progByLesson = new Map(progressRows.map((p) => [p.idBaiHoc, p]));

    const sorted = [...kh.baihoc].sort(
      (a, b) => (a.thuTu ?? 999999) - (b.thuTu ?? 999999),
    );
    const baiHocMapped = sorted.map((bh) => {
      const p = progByLesson.get(bh.idBaiHoc);
      return {
        idBaiHoc: bh.idBaiHoc,
        tenBaiHoc: bh.tenBaiHoc,
        trangThai: p?.trangThai || 'chua_hoc',
      };
    });

    const chuong = [{ chuong: 1, baiHoc: baiHocMapped }];

    return res.json({
      success: true,
      khoaHoc: {
        idKhoaHoc: kh.idKhoaHoc,
        tenKhoaHoc: kh.tenKhoaHoc,
        moTa: kh.moTa,
        danhMuc: kh.danhMuc,
        gia: giaKhoa(kh),
        giangVien: kh.nguoidung?.hoTen,
        chuong,
        quizzes: kh.quizzes,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

// --- Bài học ---

router.get('/baihoc/:idBaiHoc', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idBaiHoc = parseInt(req.params.idBaiHoc, 10);
    if (!idBaiHoc) {
      return res.status(400).json({ success: false, error: 'id không hợp lệ' });
    }

    const bh = await prisma.baihoc.findUnique({
      where: { idBaiHoc },
      include: { khoahoc: { include: { nguoidung: { select: { hoTen: true } } } } },
    });
    if (!bh) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài học' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, bh.khoahoc)) {
      return res.status(403).json({
        success: false,
        error: dk ? 'Vui lòng thanh toán khóa học để xem bài học.' : 'Bạn chưa đăng ký khóa học này',
      });
    }

    let progress = await prisma.progress.findFirst({
      where: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc, idBaiHoc },
    });

    const loai = loaiBaiHocRow(bh);
    return res.json({
      success: true,
      loaiBaiHoc: loai,
      baiHoc: {
        idBaiHoc: bh.idBaiHoc,
        idKhoaHoc: bh.idKhoaHoc,
        tenBaiHoc: bh.tenBaiHoc,
        videoUrl: bh.videoUrl,
        taiLieuUrl: bh.taiLieuUrl,
        noiDung: null,
      },
      progress: progress
        ? { trangThai: progress.trangThai, thoiGianHoc: progress.thoiGianHoc }
        : { trangThai: 'chua_hoc', thoiGianHoc: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.patch('/start', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idBaiHoc = parseInt(req.body?.idBaiHoc, 10);
    if (!idBaiHoc) {
      return res.status(400).json({ success: false, error: 'Thiếu idBaiHoc' });
    }

    const bh = await prisma.baihoc.findUnique({ where: { idBaiHoc } });
    if (!bh) return res.status(404).json({ success: false, error: 'Không tìm thấy bài học' });

    const kh = await prisma.khoahoc.findUnique({ where: { idKhoaHoc: bh.idKhoaHoc } });
    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, kh)) {
      return res.status(403).json({ success: false, error: 'Không có quyền' });
    }

    let row = await prisma.progress.findFirst({
      where: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc, idBaiHoc },
    });
    if (!row) {
      row = await prisma.progress.create({
        data: {
          idNguoiDung: uid,
          idKhoaHoc: bh.idKhoaHoc,
          idBaiHoc,
          trangThai: 'dang_hoc',
        },
      });
    } else if (row.trangThai === 'chua_hoc') {
      row = await prisma.progress.update({
        where: { idProgress: row.idProgress },
        data: { trangThai: 'dang_hoc' },
      });
    }

    return res.json({ success: true, progress: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.patch('/time', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idBaiHoc = parseInt(req.body?.idBaiHoc, 10);
    const thoiGianHoc = parseInt(req.body?.thoiGianHoc, 10);
    if (!idBaiHoc || Number.isNaN(thoiGianHoc)) {
      return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
    }

    const bh = await prisma.baihoc.findUnique({ where: { idBaiHoc } });
    if (!bh) return res.status(404).json({ success: false, error: 'Không tìm thấy bài học' });

    const kh = await prisma.khoahoc.findUnique({ where: { idKhoaHoc: bh.idKhoaHoc } });
    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, kh)) {
      return res.status(403).json({ success: false, error: 'Không có quyền' });
    }

    let row = await prisma.progress.findFirst({
      where: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc, idBaiHoc },
    });
    if (!row) {
      row = await prisma.progress.create({
        data: {
          idNguoiDung: uid,
          idKhoaHoc: bh.idKhoaHoc,
          idBaiHoc,
          trangThai: 'dang_hoc',
          thoiGianHoc,
        },
      });
    } else {
      row = await prisma.progress.update({
        where: { idProgress: row.idProgress },
        data: { thoiGianHoc },
      });
    }

    return res.json({ success: true, progress: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.patch('/complete', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idBaiHoc = parseInt(req.body?.idBaiHoc, 10);
    if (!idBaiHoc) {
      return res.status(400).json({ success: false, error: 'Thiếu idBaiHoc' });
    }

    const bh = await prisma.baihoc.findUnique({ where: { idBaiHoc } });
    if (!bh) return res.status(404).json({ success: false, error: 'Không tìm thấy bài học' });

    const kh = await prisma.khoahoc.findUnique({ where: { idKhoaHoc: bh.idKhoaHoc } });
    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, kh)) {
      return res.status(403).json({ success: false, error: 'Không có quyền' });
    }

    let row = await prisma.progress.findFirst({
      where: { idNguoiDung: uid, idKhoaHoc: bh.idKhoaHoc, idBaiHoc },
    });
    if (!row) {
      row = await prisma.progress.create({
        data: {
          idNguoiDung: uid,
          idKhoaHoc: bh.idKhoaHoc,
          idBaiHoc,
          trangThai: 'hoan_thanh',
        },
      });
    } else {
      row = await prisma.progress.update({
        where: { idProgress: row.idProgress },
        data: { trangThai: 'hoan_thanh' },
      });
    }

    return res.json({ success: true, progress: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

// --- Quiz ---

function buildDapAnObj(q) {
  const o = {};
  if (q.dapAnA != null) o.A = q.dapAnA;
  if (q.dapAnB != null) o.B = q.dapAnB;
  if (q.dapAnC != null) o.C = q.dapAnC;
  if (q.dapAnD != null) o.D = q.dapAnD;
  if (Object.keys(o).length === 0 && q.dapAnDung) {
    o.A = 'Đúng';
    o.B = 'Sai';
  }
  return o;
}

router.get('/quiz/:idQuiz/start', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idQuiz = parseInt(req.params.idQuiz, 10);
    if (!idQuiz) {
      return res.status(400).json({ success: false, error: 'id quiz không hợp lệ' });
    }

    const quiz = await prisma.quizzes.findUnique({
      where: { idQuiz },
      include: {
        khoahoc: true,
        quiz_questions: true,
      },
    });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy quiz' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: quiz.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, quiz.khoahoc)) {
      return res.status(403).json({ success: false, error: 'Bạn chưa được phép làm bài này' });
    }

    const tongDiemToiDa = quiz.quiz_questions.reduce(
      (s, ch) => s + parseFloat(ch.diemCauHoi ?? 1),
      0,
    );
    const diemDat = tongDiemToiDa * 0.5;

    const prev = await prisma.quiz_results.findFirst({
      where: { idNguoiDung: uid, idQuiz },
      orderBy: { ngayLamBai: 'desc' },
    });

    if (prev && parseFloat(prev.diemSo ?? 0) >= diemDat) {
      return res.json({
        daLam: true,
        diemSo: parseFloat(prev.diemSo ?? 0),
        tongDiemToiDa,
      });
    }

    return res.json({ daLam: false, tongDiemToiDa, diemDat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.get('/quiz/:idQuiz', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idQuiz = parseInt(req.params.idQuiz, 10);
    const quiz = await prisma.quizzes.findUnique({
      where: { idQuiz },
      include: { khoahoc: true, quiz_questions: true },
    });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy quiz' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: quiz.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, quiz.khoahoc)) {
      return res.status(403).json({ success: false, error: 'Không có quyền' });
    }

    const questions = quiz.quiz_questions.map((q) => ({
      idCauHoi: q.idCauHoi,
      cauHoi: q.cauHoi,
      dapAn: buildDapAnObj(q),
    }));

    return res.json({
      success: true,
      quiz: {
        idQuiz: quiz.idQuiz,
        tenQuiz: quiz.tenQuiz,
        thoiGianLamBai: quiz.thoiGianLamBai,
      },
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.post('/quiz/:idQuiz/submit', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idQuiz = parseInt(req.params.idQuiz, 10);
    const { answers, thoiGianLamBai } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Thiếu đáp án' });
    }

    const quiz = await prisma.quizzes.findUnique({
      where: { idQuiz },
      include: { khoahoc: true, quiz_questions: true },
    });
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy quiz' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc: quiz.idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, quiz.khoahoc)) {
      return res.status(403).json({ success: false, error: 'Không có quyền' });
    }

    const tongDiemToiDa = quiz.quiz_questions.reduce(
      (s, ch) => s + parseFloat(ch.diemCauHoi ?? 1),
      0,
    );
    const diemDat = tongDiemToiDa * 0.5;

    let diemSo = 0;
    for (const q of quiz.quiz_questions) {
      const sel = answers[String(q.idCauHoi)] ?? answers[q.idCauHoi];
      if (sel == null) continue;
      const dung = String(q.dapAnDung ?? '').trim();
      const selStr = String(sel).trim();
      const map = buildDapAnObj(q);
      const letter = selStr.toUpperCase();
      let ok = selStr === dung;
      if (!ok && map[letter] != null && String(map[letter]).trim() === dung) ok = true;
      if (!ok && letter === dung) ok = true;
      if (ok) diemSo += parseFloat(q.diemCauHoi ?? 1);
    }

    const dat = diemSo >= diemDat;
    await prisma.quiz_results.create({
      data: {
        idNguoiDung: uid,
        idQuiz,
        diemSo,
        thoiGianLamBai: parseInt(thoiGianLamBai, 10) || 0,
      },
    });

    const phanTram = tongDiemToiDa > 0 ? Math.round((diemSo / tongDiemToiDa) * 100) : 0;

    return res.json({
      dat,
      diemSo,
      tongDiemToiDa,
      diemDat,
      phanTram,
      message: dat
        ? `Chúc mừng! Bạn đạt ${phanTram}% — vượt ngưỡng 50%.`
        : `Bạn đạt ${phanTram}%. Cần tối thiểu 50% để qua bài.`,
      choPhepLamLai: !dat,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.get('/quiz/:idQuiz/result', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idQuiz = parseInt(req.params.idQuiz, 10);
    const r = await prisma.quiz_results.findFirst({
      where: { idNguoiDung: uid, idQuiz },
      orderBy: { ngayLamBai: 'desc' },
    });
    if (!r) {
      return res.status(404).json({ success: false, error: 'Chưa có kết quả' });
    }
    return res.json({ success: true, result: r });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

// --- Chứng chỉ ---

async function allLessonsCompleted(idNguoiDung, idKhoaHoc) {
  const lessons = await prisma.baihoc.findMany({ where: { idKhoaHoc } });
  if (lessons.length === 0) return false;
  const done = await prisma.progress.findMany({
    where: {
      idNguoiDung,
      idKhoaHoc,
      trangThai: 'hoan_thanh',
    },
  });
  const doneSet = new Set(done.map((d) => d.idBaiHoc));
  return lessons.every((l) => doneSet.has(l.idBaiHoc));
}

router.get('/certificate', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const certificates = await prisma.certificates.findMany({
      where: { idNguoiDung: uid },
      include: { khoahoc: true },
      orderBy: { ngayCap: 'desc' },
    });
    return res.json({ success: true, certificates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.get('/certificate/:idKhoaHoc', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idKhoaHoc = parseInt(req.params.idKhoaHoc, 10);
    const kh = await prisma.khoahoc.findUnique({ where: { idKhoaHoc } });
    if (!kh) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học' });
    }

    const dk = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: uid, idKhoaHoc } },
    });
    if (!dk || !duocHocNoiDung(dk, kh)) {
      return res.status(403).json({ success: false, error: 'Không có quyền' });
    }

    const ok = await allLessonsCompleted(uid, idKhoaHoc);
    if (!ok) {
      return res.status(400).json({
        success: false,
        error: 'Bạn cần hoàn thành tất cả bài học để nhận chứng chỉ.',
      });
    }

    let cert = await prisma.certificates.findFirst({
      where: { idNguoiDung: uid, idKhoaHoc },
    });
    if (!cert) {
      cert = await prisma.certificates.create({
        data: { idNguoiDung: uid, idKhoaHoc },
      });
    }

    return res.json({ success: true, certificate: cert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

router.get('/certificate/:idKhoaHoc/print', loadUser, async (req, res) => {
  try {
    const uid = req.userId;
    const idKhoaHoc = parseInt(req.params.idKhoaHoc, 10);
    const user = await prisma.nguoidung.findUnique({ where: { idNguoiDung: uid } });
    const cert = await prisma.certificates.findFirst({
      where: { idNguoiDung: uid, idKhoaHoc },
      include: { khoahoc: true },
    });
    if (!cert) {
      return res.status(404).json({ success: false, error: 'Chưa có chứng chỉ cho khóa này' });
    }

    return res.json({
      success: true,
      printData: {
        idCertificate: cert.idCertificate,
        hoTen: user.hoTen,
        tenKhoaHoc: cert.khoahoc?.tenKhoaHoc || 'Khóa học',
        ngayCap: cert.ngayCap,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
