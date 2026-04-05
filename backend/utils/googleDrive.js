const { google } = require("googleapis");
const stream = require("stream");
require("dotenv").config(); // Bắt buộc phải có để đọc file .env

// 1. Khởi tạo xác thực bằng OAuth2 — redirect URI khớp .env (Playground hoặc URI bạn đăng ký)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground",
);

// 2. Cấp quyền bằng Refresh Token lấy từ Playground
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// 3. Khởi tạo Google Drive API
const drive = google.drive({ version: "v3", auth: oauth2Client });

async function uploadFile(file) {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: "id",
      supportsAllDrives: true,
    });

    const fileId = response.data.id;

    // Cho phép mọi người có link xem — tránh 403 khi học viên nhúng iframe (không đăng nhập Gmail của GV)
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      });
    } catch (permErr) {
      console.warn("Drive: không gắn quyền công khai (kiểm tra scope OAuth):", permErr.message);
    }

    // /preview nhúng iframe ổn định hơn /view (tránh 403 trong LMS)
    return `https://drive.google.com/file/d/${fileId}/preview`;
    
  } catch (error) {
    console.error("Lỗi khi upload lên Drive:", error.message);
    throw error;
  }
}

/**
 * Hàm hỗ trợ lấy ID file từ URL của Google Drive
 */
const getFileIdFromUrl = (url) => {
  if (!url) return null;
  // Regex này sẽ tìm chuỗi ký tự dài khoảng 25-33 ký tự (chính là ID của Google Drive)
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

/**
 * Hàm xóa file trên Google Drive
 */
const deleteFile = async (fileUrl) => {
  try {
    const fileId = getFileIdFromUrl(fileUrl);
    
    if (!fileId) {
      console.log("Không tìm thấy ID hợp lệ trong URL:", fileUrl);
      return false;
    }

    // Khởi tạo drive với auth của bạn (nhớ thay đổi auth bằng biến auth bạn đang dùng)
    const drive = google.drive({ version: "v3", auth: oauth2Client }); 

    await drive.files.delete({
      fileId: fileId,
    });

    console.log(`Đã xóa thành công file có ID: ${fileId} trên Google Drive`);
    return true;
  } catch (error) {
    // Nếu file đã bị xóa thủ công trước đó, API sẽ trả về lỗi 404
    if (error.code === 404) {
      console.log("File không còn tồn tại trên Google Drive (có thể đã bị xóa).");
      return true; // Vẫn coi như thành công để tiếp tục flow xóa DB
    }
    console.error("Lỗi khi xóa file trên Google Drive:", error.message);
    return false;
  }
};

module.exports = { uploadFile, deleteFile };