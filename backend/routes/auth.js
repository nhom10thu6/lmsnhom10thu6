const express = require('express')
const router = express.Router()
const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

// --- THÊM 2 DÒNG KHAI BÁO NÀY LÊN ĐẦU ĐỂ KHÔNG LỖI ---
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client("657089288234-f50a73cblf44qneh64id60j6d1i0d3d6.apps.googleusercontent.com");
// ---------------------------------------------------

router.post("/login", async (req, res) => {
    try {
        let { taiKhoan, matKhau } = req.body

        taiKhoan = taiKhoan ? taiKhoan.trim() : undefined
        matKhau = matKhau ? matKhau.trim() : undefined
        if (!taiKhoan || !matKhau) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tài khoản và mật khẩu"
            })
        }

        const nguoiDung = await prisma.nguoidung.findUnique({
            where: { taiKhoan }
        })

        if (!nguoiDung) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản không tồn tại"
            })
        }

        if (matKhau !== nguoiDung.matKhau) {
            return res.status(401).json({
                success: false,
                message: "Mật khẩu không chính xác"
            })
        }

        let duongDan = "/"
        switch (nguoiDung.vaiTro) {
            case "admin":
                duongDan = "/admin"
                break
            case "giangvien":
                duongDan = "/giangvien"
                break
            case "hocvien":
                duongDan = "/khoahoc"
                break
        }

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            user: {
                id: nguoiDung.idNguoiDung,
                hoTen: nguoiDung.hoTen,
                taiKhoan: nguoiDung.taiKhoan,
                vaiTro: nguoiDung.vaiTro
            },
            redirectTo: duongDan
        })

    } catch (error) {
        res.status(500).json({ success: false, message: "Không thể đăng nhập" })
    }
})


router.post("/dangky", async (req, res) => {
    try {
        let { hoTen, taiKhoan, matKhau, vaiTro } = req.body
        hoTen = hoTen ? hoTen.trim().replace(/\s+/g, ' ') : undefined
        taiKhoan = taiKhoan ? taiKhoan.trim() : undefined
        matKhau = matKhau ? matKhau.trim() : undefined
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/
        if (!hoTen || !taiKhoan || !matKhau) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            })
        }

        if(!nameRegex.test(hoTen)) {
            return res.status(400).json({
                success: false,
                message: "Họ tên chỉ được chứa chữ cái và khoảng trắng"
            })
        }

        const existing = await prisma.nguoidung.findUnique({
            where: { taiKhoan }
        })

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Tài khoản đã tồn tại"
            })
        }

        const nguoiDungMoi = await prisma.nguoidung.create({
            data: {
                hoTen,
                taiKhoan,
                matKhau,
                vaiTro: ["giangvien", "hocvien"].includes(vaiTro)
                    ? vaiTro
                    : "hocvien"
            }
        })

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user: nguoiDungMoi
        })

    } catch (error) {
        console.error("LỖI DATABASE CHI TIẾT:", error);
        res.status(500).json({ success: false, message: "Không thể đăng ký" })
    }
})

router.post("/google-login", async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: "657089288234-f50a73cblf44qneh64id60j6d1i0d3d6.apps.googleusercontent.com",
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    let user = await prisma.nguoidung.findFirst({
      where: { OR: [{ googleId: googleId }, { taiKhoan: email }] }
    });

    let isNewUser = false; // Biến cờ hiệu

    if (!user) {
      isNewUser = true; // Đây là người mới tinh
      user = await prisma.nguoidung.create({
        data: {
          hoTen: name,
          taiKhoan: email,
          googleId: googleId,
          vaiTro: "hocvien" // Tạm thời để học viên, lát nữa sẽ cho đổi
        },
      });
    }

    const token = jwt.sign(
      { idNguoiDung: user.idNguoiDung, vaiTro: user.vaiTro },
      process.env.JWT_SECRET || "bi_mat_cua_nhom_10",
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      isNewUser, // Gửi cờ này về Frontend
      user: { id: user.idNguoiDung, hoTen: user.hoTen, vaiTro: user.vaiTro }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Xác thực thất bại!" });
  }
});
router.post("/update-role", async (req, res) => {
  const { userId, vaiTro } = req.body;
  try {
    const updatedUser = await prisma.nguoidung.update({
      where: { idNguoiDung: userId },
      data: { vaiTro: vaiTro }
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không thể cập nhật vai trò" });
  }
});

module.exports = router