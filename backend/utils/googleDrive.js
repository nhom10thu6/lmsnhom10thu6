const { google } = require("googleapis");
const stream = require("stream");
require("dotenv").config();

// 1. Khởi tạo xác thực bằng OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground",
);

// 2. Cấp quyền bằng Refresh Token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// 3. Khởi tạo Google Drive API
const drive = google.drive({ version: "v3", auth: oauth2Client });

async function uploadFile(file) {
  try {
    // --- BƯỚC XỬ LÝ ID THƯ MỤC CỰC KỲ QUAN TRỌNG ---
    // Loại bỏ dấu ngoặc kép, dấu nháy và khoảng trắng dư thừa
    const folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || "")
      .replace(/['"]/g, "")
      .trim();

    console.log("--- DEBUG UPLOAD ---");
    console.log("Target Folder ID:", `[${folderId}]`);
    console.log("File Name:", file.originalname);

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        // Ép buộc file phải vào đúng thư mục này
        parents: [folderId], 
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: "id",
      supportsAllDrives: true,
    });

    const fileId = response.data.id;
    console.log("=> Upload thành công! File ID:", fileId);

    // Gắn quyền xem công khai (anyone can view)
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });
      console.log("=> Đã mở quyền xem công khai.");
    } catch (permErr) {
      console.warn("Drive: Cảnh báo gắn quyền:", permErr.message);
    }

    return `https://drive.google.com/file/d/${fileId}/preview`;
    
  } catch (error) {
    console.error("❌ Lỗi upload Drive chi tiết:", error.message);
    // In thêm dữ liệu lỗi từ Google nếu có
    if (error.response) console.error("Data lỗi:", error.response.data);
    throw error;
  }
}

/**
 * Hàm hỗ trợ lấy ID file từ URL
 */
const getFileIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

/**
 * Hàm xóa file trên Google Drive
 */
const deleteFile = async (fileUrl) => {
  try {
    const fileId = getFileIdFromUrl(fileUrl);
    if (!fileId) return false;

    await drive.files.delete({ fileId: fileId });
    console.log(`Đã xóa thành công file ID: ${fileId}`);
    return true;
  } catch (error) {
    if (error.code === 404) return true;
    console.error("Lỗi khi xóa file:", error.message);
    return false;
  }
};

module.exports = { uploadFile, deleteFile };