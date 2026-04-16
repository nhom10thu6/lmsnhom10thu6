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
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const first = letters[Math.floor(Math.random() * letters.length)];
  const rest = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${first}${rest}`;
}

function buildTransferContent(userId, courseId) {
  // Tagged code remains parseable even if bank app strips separators.
  return `LMSU${userId}C${courseId}R${randomSuffix()}`;
}

//hàm tách nội dung chuyển khoản
function parseTransferContent(contentRaw) {
  const content = String(contentRaw || '').toUpperCase();

  // New tagged format: LMSU10C32RABC123 (with or without separators).
  const tagged = content.match(/LMS[\s_\-]*U(\d+)[\s_\-]*C(\d+)[\s_\-]*R([A-Z0-9]{4,})/);
  if (tagged) {
    return {
      userId: toInt(tagged[1]),
      courseId: toInt(tagged[2]),
      ref: tagged[3],
      needsResolve: false,
    };
  }

  // Legacy explicit format: LMS-10-32-ABC123.
  const legacy = content.match(/LMS[\s_\-]+(\d+)[\s_\-]+(\d+)[\s_\-]+([A-Z0-9]{4,})/);
  if (legacy) {
    return {
      userId: toInt(legacy[1]),
      courseId: toInt(legacy[2]),
      ref: legacy[3],
      needsResolve: false,
    };
  }

  // Legacy compact when separators are stripped by bank app: LMS1032ABC123.
  const compact = content.match(/LMS(\d+)([A-Z][A-Z0-9]{3,})/);
  if (compact) {
    return {
      userId: 0,
      courseId: 0,
      ref: compact[2],
      compactDigits: compact[1],
      needsResolve: true,
    };
  }

  return null;
}

async function resolveLegacyCompact(compactDigits, amount) {
  const digits = String(compactDigits || '').replace(/\D/g, '');
  if (digits.length < 2) return null;

  const matched = [];
  for (let i = 1; i < digits.length; i += 1) {
    const userId = toInt(digits.slice(0, i));
    const courseId = toInt(digits.slice(i));
    if (!userId || !courseId) continue;

    const enrollment = await prisma.dangky_khoahoc.findUnique({
      where: {
        idNguoiDung_idKhoaHoc: {
          idNguoiDung: userId,
          idKhoaHoc: courseId,
        },
      },
      include: { khoahoc: true },
    });

    if (!enrollment || enrollment.ngayThanhToan) continue;

    const expected = Math.round(parsePrice(enrollment.khoahoc?.gia));
    if (amount >= expected) {
      matched.push({ userId, courseId, enrollment });
    }
  }

  if (matched.length !== 1) return null;
  return matched[0];
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

    let resolvedUserId = parsed.userId;
    let resolvedCourseId = parsed.courseId;
    let enrollment = null;

    if (parsed.needsResolve) {
      const resolved = await resolveLegacyCompact(parsed.compactDigits, amount);
      if (!resolved) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xác định đơn thanh toán từ nội dung chuyển khoản.',
        });
      }
      resolvedUserId = resolved.userId;
      resolvedCourseId = resolved.courseId;
      enrollment = resolved.enrollment;
    }

    if (!enrollment) {
      enrollment = await prisma.dangky_khoahoc.findUnique({
        where: {
          idNguoiDung_idKhoaHoc: {
            idNguoiDung: resolvedUserId,
            idKhoaHoc: resolvedCourseId,
          },
        },
        include: { khoahoc: true },
      });
    }

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
      userId: resolvedUserId,
      idKhoaHoc: resolvedCourseId,
      soTienNhan: amount,
    });
  } catch (error) {
    console.error('[SEPAY_WEBHOOK]', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

module.exports = router;
