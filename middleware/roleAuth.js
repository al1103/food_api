const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

// Middleware to check if user is authenticated
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "Xác thực không hợp lệ" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Xác thực không hợp lệ" });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      // Check if user exists in database
      const result = await pool.query(
        `SELECT 
          user_id AS "userId",  
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
          .status(401)
          .json({ status: "error", message: "Người dùng không tồn tại" });
      }

      // Set the user in the request
      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error("JWT verification error:", error);
      return res
        .status(401)
        .json({ status: "error", message: "Token không hợp lệ" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ status: "error", message: "Lỗi xác thực" });
  }
};

// Middleware to check if user is an admin
const adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    auth(req, res, () => {
      // Check if the user has admin role
      if (req.user && req.user.role === "admin") {
        next();
      } else {
        return res.status(403).json({
          status: "error",
          message: "Không có quyền truy cập. Yêu cầu quyền quản trị viên.",
        });
      }
    });
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({ status: "error", message: "Lỗi xác thực" });
  }
};

module.exports = { auth, adminAuth };
