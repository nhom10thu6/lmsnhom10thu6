const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('../generated/prisma');
const { loadUser } = require('./middleware/middleware');

const router = express.Router();
const prisma = new PrismaClient();

function toInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function toAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parsePrice(decimalLike) {
  const n = Number(decimalLike ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function timingSafeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifyWebhookSecret(req) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret) return true;

  const rawToken =
    req.get('x-sepay-webhook-secret')
    || req.get('x-sepay-secret')
    || req.get('authorization')
    || '';

  const token = String(rawToken || '').trim().replace(/^(Bearer|ApiKey|Apikey)\s+/i, '');
  const raw = String(rawToken || '').trim();

  return timingSafeEqual(token, secret) || timingSafeEqual(raw, secret);
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function buildTransferContent(userId, courseId) {
  return `LMS-${userId}-${courseId}-${randomSuffix()}`;
}

function parseTransferContent(contentRaw) {
  const content = String(contentRaw || '').toUpperCase();
  const m = content.match(/LMS[\s_\-]?(\d+)[\s_\-]?(\d+)[\s_\-]?([A-Z0-9]{4,})/);
  if (!m) return null;
  return {
    userId: toInt(m[1]),
    courseId: toInt(m[2]),
    ref: m[3],
  };
}

function getSepayConfig() {
  const bankCode = String(process.env.SEPAY_BANK_CODE || '').trim();
  const accountNo = String(process.env.SEPAY_ACCOUNT_NO || '').trim();
  const accountName = String(process.env.SEPAY_ACCOUNT_NAME || '').trim();
  const qrBaseUrl = String(process.env.SEPAY_QR_BASE_URL || 'https://qr.sepay.vn/img').trim();

  return {
    bankCode,
    accountNo,
    accountName,
    qrBaseUrl,
  };
}

function normalizeBankCodeForQr(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return '';

  const map = {
    TPBVVNVX: 'TPB',
    VCBVVNVX: 'VCB',
    BIDVVNVX: 'BIDV',
    TCBVVNVX: 'TCB',
    ICBVVNVX: 'CTG',
    MBBEVNVX: 'MB',
    ACBVVNVX: 'ACB',
  };

  if (map[code]) return map[code];
  if (code.endsWith('VVNVX') && code.length > 5) {
    return code.slice(0, -5);
  }
  return code;
}

function buildQrUrls(cfg, amount, transferContent) {
  const roundedAmount = Math.round(amount);
  const bankForQr = normalizeBankCodeForQr(cfg.bankCode);

  const sepayQuery = new URLSearchParams({
    acc: cfg.accountNo,
    bank: cfg.bankCode,
    amount: String(roundedAmount),
    des: transferContent,
    template: 'compact',
  });

  const sepayQrUrl = `${cfg.qrBaseUrl}?${sepayQuery.toString()}`;
  const vietQrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankForQr)}-${encodeURIComponent(cfg.accountNo)}-compact2.png?amount=${encodeURIComponent(String(roundedAmount))}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(cfg.accountName)}`;

  return {
    bankForQr,
    primaryQrUrl: vietQrUrl,
    fallbackQrUrl: sepayQrUrl,
  };
}

/**
 * POST /thanhtoan/sepay/tao
 * Body: { idKhoaHoc }
 * Tao thong tin chuyen khoan cho hoc vien theo dang tai khoan ca nhan.
 */
router.post('/sepay/tao', loadUser, async (req, res) => {
  try {
    const userId = req.userId;
    const idKhoaHoc = toInt(req.body?.idKhoaHoc);

    if (!idKhoaHoc) {
      return res.status(400).json({ success: false, message: 'Thieu id khóa học.' });
    }

    const cfg = getSepayConfig();
    if (!cfg.bankCode || !cfg.accountNo || !cfg.accountName) {
      return res.status(500).json({
        success: false,
        message: 'Thiếu cấu hình sepay (SEPAY_BANK_CODE, SEPAY_ACCOUNT_NO, SEPAY_ACCOUNT_NAME).',
      });
    }

    const course = await prisma.khoahoc.findUnique({ where: { idKhoaHoc } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại.' });
    }

    const amount = parsePrice(course.gia);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Khóa học miễn phí, không cần thanh toán.' });
    }

    const enrollment = await prisma.dangky_khoahoc.findUnique({
      where: { idNguoiDung_idKhoaHoc: { idNguoiDung: userId, idKhoaHoc } },
    });
    if (!enrollment) {
      return res.status(400).json({ success: false, message: 'Bạn chưa đăng ký khóa học này.' });
    }
    if (enrollment.ngayThanhToan) {
      return res.json({
        success: true,
        paid: true,
        message: 'Khóa học đã thanh toán trước đó.',
        idKhoaHoc,
      });
    }

    const transferContent = buildTransferContent(userId, idKhoaHoc);
    const qr = buildQrUrls(cfg, amount, transferContent);

    return res.json({
      success: true,
      paid: false,
      provider: 'sepay',
      idKhoaHoc,
      soTien: Math.round(amount),
      thongTinChuyenKhoan: {
        nganHang: cfg.bankCode,
        nganHangQr: qr.bankForQr,
        soTaiKhoan: cfg.accountNo,
        tenTaiKhoan: cfg.accountName,
        noiDung: transferContent,
      },
      qrUrl: qr.primaryQrUrl,
      qrUrlFallback: qr.fallbackQrUrl,
      note: 'sau khi chuyển khoản, SePay webhook sẽ tự động kích hoạt khóa học.',
    });
  } catch (error) {
    console.error('[SEPAY_CREATE_PAYMENT]', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * POST /thanhtoan/sepay/webhook
 * SePay goi vao endpoint nay khi co bien dong so du.
 */
router.post('/sepay/webhook', async (req, res) => {
  try {
    if (!verifyWebhookSecret(req)) {
      return res.status(401).json({ success: false, message: 'Webhook secret không hợp lệ.' });
    }

    const payload = req.body || {};
    const status = String(payload.status || payload.state || 'success').toLowerCase();
    if (status.includes('pending') || status.includes('fail') || status.includes('error')) {
      return res.json({ success: true, ignored: true, reason: 'transaction_not_success' });
    }

    const content =
      payload.content
      || payload.description
      || payload.transferContent
      || payload.transactionContent
      || '';

    const amount = toAmount(payload.amount ?? payload.transferAmount ?? payload.money ?? payload.value);
    const parsed =
      parseTransferContent(content)
      || parseTransferContent(payload.code)
      || parseTransferContent(payload.paymentCode)
      || parseTransferContent(payload.transferCode);

    if (!parsed) {
      return res.status(400).json({ success: false, message: 'Nội dung chuyển khoản không đúng định dạng.' });
    }

    const enrollment = await prisma.dangky_khoahoc.findUnique({
      where: {
        idNguoiDung_idKhoaHoc: {
          idNguoiDung: parsed.userId,
          idKhoaHoc: parsed.courseId,
        },
      },
      include: { khoahoc: true },
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký khóa học.' });
    }

    if (enrollment.ngayThanhToan) {
      return res.json({ success: true, updated: false, message: 'Đơn đã được xác nhận trước đó.' });
    }

    const expected = Math.round(parsePrice(enrollment.khoahoc?.gia));
    if (amount < expected) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền giao dịch nhỏ hơn học phí.',
        expected,
        received: amount,
      });
    }

    await prisma.dangky_khoahoc.update({
      where: { idDangKy: enrollment.idDangKy },
      data: { ngayThanhToan: new Date() },
    });

    return res.json({
      success: true,
      updated: true,
      userId: parsed.userId,
      idKhoaHoc: parsed.courseId,
      soTienNhan: amount,
    });
  } catch (error) {
    console.error('[SEPAY_WEBHOOK]', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
