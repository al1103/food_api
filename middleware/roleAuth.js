const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

// Middleware to check if user is authenticated
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .statusCode(401)
        .json({ statusCode: "error", message: "Xác thực không hợp lệ" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .statusCode(401)
        .json({ statusCode: "error", message: "Xác thực không hợp lệ" });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      const result = await pool.query(
        `SELECT 
          user_id, 
          username, 
          email, 
          full_name AS "fullName",
          role
        FROM users 
        WHERE user_id = $1`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res
          .statusCode(401)
          .json({ statusCode: "error", message: "Người dùng không tồn tại" });
      }

      // Set the user in the request
      const user = result.rows[0];

      // Đảm bảo userId và user_id đều được đặt để tương thích với cả hai cách sử dụng
      req.user = {
        ...user,
        userId: user.user_id, // Thêm trường userId để tương thích
      };

      // Thêm userData property cho tương thích với code hiện tại
      req.userData = {
        userId: user.user_id,
        role: user.role,
      };

      // Log để debug
      console.log("User authentication successful:", {
        user_id: user.user_id,
        userId: req.user.userId,
        userDataUserId: req.userData.userId,
      });

      next();
    } catch (error) {
      console.error("JWT verification error:", error);

      // Handle token expiration specifically
      if (error.name === "TokenExpiredError") {
        return res.statusCode(401).json({
          statusCode: "error",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          expired: true,
        });
      }

      return res
        .statusCode(401)
        .json({ statusCode: "error", message: "Token không hợp lệ" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.statusCode(500).json({ statusCode: "error", message: "Lỗi xác thực" });
  }
};

// Middleware to check if user is an admin
const adminAuth = async (req, res, next) => {
  // First authenticate the user
  auth(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Check if the user has admin role
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.statusCode(403).json({
        statusCode: "error",
        message: "Không có quyền truy cập. Yêu cầu quyền quản trị viên.",
      });
    }
  });
};

// Middleware to check if user is staff or admin
const staffAuth = async (req, res, next) => {
  auth(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Check if the user has staff or admin role
    if (req.user && (req.user.role === "staff" || req.user.role === "admin")) {
      next();
    } else {
      return res.statusCode(403).json({
        statusCode: "error",
        message:
          "Không có quyền truy cập. Yêu cầu quyền nhân viên hoặc quản trị viên.",
      });
    }
  });
};

module.exports = { auth, adminAuth, staffAuth };
