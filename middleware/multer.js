const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Cấu hình storage tạm thời trên disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/temp"));
  },
  filename: function (req, file, cb) {
    const userId = req.user ? req.user.userId : "anonymous";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `user_${userId}_${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Một lựa chọn khác: lưu vào memory buffer thay vì disk
// const storage = multer.memoryStorage();

// Hàm kiểm tra loại file
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận các loại file hình ảnh
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file hình ảnh!"), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn dung lượng: 5MB
  },
});

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Không có file được upload",
      });
    }

    // Đối với storage là diskStorage
    const filePath = req.file.path;

    // Upload lên Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
      folder: "food_api/avatars",
      transformation: [{ width: 500, height: 500, crop: "limit" }],
    });

    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);

    // Cập nhật avatar của người dùng trong database
    const updatedUser = await UserModel.updateUser(req.user.userId, {
      avatar: cloudinaryResult.secure_url,
    });

    if (!updatedUser) {
      return res.status(400).json({
        status: "error",
        message: "Không thể cập nhật avatar",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Upload avatar thành công",
      data: {
        avatar: cloudinaryResult.secure_url,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Lỗi upload avatar:", error);

    // Xóa file tạm nếu có lỗi xảy ra
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Không thể xóa file tạm:", err);
      });
    }

    res.status(500).json({
      status: "error",
      message: "Lỗi khi upload avatar",
      error: error.message,
    });
  }
};

module.exports = upload;
