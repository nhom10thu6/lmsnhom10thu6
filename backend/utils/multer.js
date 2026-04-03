const multer = require("multer");

// lưu file tạm ở memory (để upload lên drive)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

module.exports = upload;