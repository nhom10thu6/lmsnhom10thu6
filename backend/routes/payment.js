const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const { PrismaClient } = require("../generated/prisma");

const router = express.Router();
const prisma = new PrismaClient();

// ===== CONFIG MOMO (sandbox) =====
const partnerCode = "MOMO";
const accessKey = "F8BBA842ECF85";
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

// ===== API tạo thanh toán =====
router.post("/momo", async (req, res) => {
  try {
    let { idNguoiDung, idKhoaHoc } = req.body;

    if (idNguoiDung === undefined || idKhoaHoc === undefined) {
      return res.status(400).json({ error: "Thiếu idNguoiDung hoặc idKhoaHoc" });
    }

    idNguoiDung = parseInt(idNguoiDung);
    idKhoaHoc = parseInt(idKhoaHoc);

    if (isNaN(idNguoiDung) || isNaN(idKhoaHoc)) {
      return res.status(400).json({ error: "idNguoiDung hoặc idKhoaHoc không hợp lệ" });
    }

    // 1. Lấy khóa học
    const course = await prisma.khoahoc.findUnique({
      where: { idKhoaHoc }
    });

    if (!course) {
      return res.status(404).json({ error: "Không tìm thấy khóa học" });
    }

    const amount = course.gia.toString();

    // 2. Tạo thông tin đơn hàng
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;
    const orderInfo = `Thanh toán khóa học ${idKhoaHoc}`;
    const redirectUrl = "http://localhost:3000/payment-success";
    const ipnUrl = "http://localhost:5000/api/payment/momo-ipn";
    const requestType = "payWithMethod";
    const extraData = JSON.stringify({ idNguoiDung, idKhoaHoc });

    // 3. Tạo chữ ký
    const rawSignature =
      "accessKey=" + accessKey +
      "&amount=" + amount +
      "&extraData=" + extraData +
      "&ipnUrl=" + ipnUrl +
      "&orderId=" + orderId +
      "&orderInfo=" + orderInfo +
      "&partnerCode=" + partnerCode +
      "&redirectUrl=" + redirectUrl +
      "&requestId=" + requestId +
      "&requestType=" + requestType;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    // 4. Body gửi MoMo
    const requestBody = {
      partnerCode,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      signature
    };

    // 5. Gửi request
    const response = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody
    );

    // 6. Trả link thanh toán
    res.json({
      success: true,
      payUrl: response.data.payUrl
    });

  } catch (err) {
    console.error("MoMo error:", err);
    res.status(500).json({ error: "Lỗi thanh toán" });
  }
});


// ===== API nhận callback từ MoMo =====
router.post("/momo-ipn", async (req, res) => {
  try {
    const data = req.body;

    console.log("IPN MOMO:", data);

    // Thành công
    if (data.resultCode === 0) {
      const extra = JSON.parse(data.extraData);

      // đăng ký khóa học (idempotent)
      const existing = await prisma.dangky_khoahoc.findUnique({
        where: {
          idNguoiDung_idKhoaHoc: {
            idNguoiDung: extra.idNguoiDung,
            idKhoaHoc: extra.idKhoaHoc
          }
        }
      });

      if (!existing) {
        await prisma.dangky_khoahoc.create({
          data: {
            idNguoiDung: extra.idNguoiDung,
            idKhoaHoc: extra.idKhoaHoc
          }
        });
      }
    }

    res.json({ message: "OK" });

  } catch (err) {
    console.error("IPN error:", err);
    res.status(500).json({ error: "IPN lỗi" });
  }
});

module.exports = router;