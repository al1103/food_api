const cloudinary = require("../config/cloudinary");
const fs = require("fs");

exports.uploadImage = async (req, res) => {
  try {
    // Kiểm tra nếu không có file được gửi lên
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn file hình ảnh để upload"
      });
    }

    // Lấy đường dẫn của file từ multer
    const filePath = req.file.path;

    // Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "food_api/images", // Thư mục lưu ảnh trên Cloudinary
    });

    // Xóa file tạm sau khi đã upload lên Cloudinary
    fs.unlinkSync(filePath);

    // Trả về thông tin ảnh đã upload
    return res.status(200).json({
      status: "success",
      message: "Upload ảnh thành công",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        created_at: result.created_at
      }
    });

  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    
    // Xóa file tạm nếu có lỗi xảy ra
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Không thể xóa file tạm:", err);
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Đã xảy ra lỗi khi upload ảnh",
      error: error.message
    });
  }
};
