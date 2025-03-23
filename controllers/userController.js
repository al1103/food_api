require("dotenv").config();
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user_model");
const { pool } = require("../config/database"); // Add this line
const { sendRandomCodeEmail } = require("../server/server");
const { getPaginationParams } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

const refreshTokens = [];

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phoneNumber, referralCode } =
      req.body;

    // Basic validation
    if (!username || !email || !password || !fullName) {
      return res
        .statusCode(400)
        .json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.statusCode(400).json({ error: "Email không hợp lệ" });
    }

    // Password validation
    if (password.length < 6) {
      return res
        .statusCode(400)
        .json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    // Check if email already exists
    const existingUser = await UserModel.getUserByEmail(email);
    if (existingUser) {
      return res.statusCode(400).json({ error: "Email đã được sử dụng" });
    }

    // Generate verification code (6 digits)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store temporary user data
    const userData = {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      referralCode,
    };

    // Create expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // First delete any existing record with this email
    await pool.query(`DELETE FROM verification_codes WHERE email = $1`, [
      email,
    ]);

    // Then insert the new record
    await pool.query(
      `INSERT INTO verification_codes (email, code, expires_at, user_data)
       VALUES ($1, $2, $3, $4)`,
      [email, code, expiresAt, JSON.stringify(userData)]
    );

    // Send verification code via email
    const sentCode = await sendRandomCodeEmail(email, code);

    return res.statusCode(200).json({
      statusCode: 200,
      code: sentCode,
      message: "Vui lòng kiểm tra email để lấy mã xác nhận",
      email,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return res.statusCode(500).json({
      statusCode: "error",
      message: "Đã xảy ra lỗi trong quá trình đăng ký",
      error: error.message,
    });
  }
};

exports.verifyRegistration = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email)
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Email là bắt buộc",
      });

    if (!code)
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Mã xác nhận là bắt buộc",
      });

    // Get the verification record
    const verificationResult = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE email = $1 AND code = $2 AND expires_at > NOW()`,
      [email, code]
    );

    // Check if verification code exists and is valid
    if (verificationResult.rows.length === 0) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Mã xác nhận không chính xác hoặc đã hết hạn",
      });
    }

    const userData = verificationResult.rows[0].user_data;

    // If no user data found
    if (!userData) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Không tìm thấy thông tin đăng ký",
      });
    }

    // Register the user with the stored data
    const result = await UserModel.register(
      userData.username,
      userData.email,
      userData.password,
      userData.fullName,
      userData.phoneNumber,
      userData.referralCode
    );

    // Delete the verification code after successful registration
    await pool.query(`DELETE FROM verification_codes WHERE email = $1`, [
      email,
    ]);

    // Return success response
    return res.statusCode(201).json({
      statusCode: 200,
      message: "Đăng ký thành công",
      data: {
        userId: result.userId,
        referralCode: result.referralCode,
      },
    });
  } catch (error) {
    console.error("Lỗi xác nhận đăng ký:", error);
    return res.statusCode(500).json({
      statusCode: "error",
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

// Update login method to include role
exports.login = async (req, res) => {
  try {
    console.log("123");
    const { email, password } = req.body;
    const user = await UserModel.login(email, password);

    if (!user) {
      return res.statusCode(401).json({
        statusCode: "error",
        message: "Thông tin đăng nhập không chính xác",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(
      { userId: user.userId, username: user.username },
      process.env.REFRESH_SECRET_KEY
    );

    // Save refresh token
    await UserModel.saveRefreshToken(user.userId, refreshToken);

    return res.statusCode(200).json({
      statusCode: 200,
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res.statusCode(500).json({
      statusCode: "error",
      message: "Đã xảy ra lỗi trong quá trình đăng nhập",
    });
  }
};

exports.token = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.sendStatus(401);
  if (!refreshTokens.includes(token)) return res.sendStatus(403);

  jwt.verify(token, process.env.REFRESH_SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ username: user.username });
    res.json({ accessToken });
  });
};

// Update the function to include role in token
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role || "customer",
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "2000h" }
  );
}

exports.getReferralInfo = async (req, res) => {
  try {
    const userId = req.user.userId; // Fixed from req.useruserid
    const referralInfo = await UserModel.getReferralInfo(userId);

    res.json({
      statusCode: 200,
      data: referralInfo,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể lấy thông tin giới thiệu",
      error: error.message,
    });
  }
};

// Add an endpoint to update commission rates (admin only)
exports.updateCommissionRates = async (req, res) => {
  try {
    const { rates } = req.body;

    if (!rates || !Array.isArray(rates)) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Cần cung cấp dữ liệu tỷ lệ hoa hồng hợp lệ",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const rate of rates) {
        if (
          !rate.level ||
          rate.level < 1 ||
          rate.level > 5 ||
          !rate.rate ||
          rate.rate < 0
        ) {
          throw new Error(`Dữ liệu không hợp lệ cho cấp ${rate.level}`);
        }

        await client.query(
          `UPDATE referral_commission_rates 
           SET rate = $1, updated_at = NOW()
           WHERE level = $2`,
          [rate.rate, rate.level]
        );
      }

      await client.query("COMMIT");

      res.json({
        statusCode: 200,
        message: "Cập nhật tỷ lệ hoa hồng thành công",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating commission rates:", error);
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể cập nhật tỷ lệ hoa hồng",
      error: error.message,
    });
  }
};

// Add endpoint to get detailed network structure
exports.getReferralNetwork = async (req, res) => {
  try {
    const userId = req.user.userId; // Fixed from req.useruserid
    const { level = 1 } = req.query;

    // Validate level
    const parsedLevel = parseInt(level);
    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 5) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Cấp độ phải từ 1 đến 5",
      });
    }

    const query = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.created_at,
        rt.level,
        (SELECT COUNT(*) FROM referral_tree WHERE ancestor_id = u.user_id AND level = 1) as direct_referrals,
        (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions 
         WHERE user_id = $1 AND reference_id = u.user_id AND transaction_type = 'referral_commission') as commission_earned
      FROM referral_tree rt
      JOIN users u ON rt.user_id = u.user_id
      WHERE rt.ancestor_id = $1 AND rt.level = $2
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(query, [userId, parsedLevel]);

    res.json({
      statusCode: 200,
      data: {
        level: parsedLevel,
        members: result.rows,
      },
    });
  } catch (error) {
    console.error("Error getting referral network:", error);
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể lấy thông tin mạng lưới giới thiệu",
      error: error.message,
    });
  }
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit } = getPaginationParams(req);

    const result = await UserModel.getWalletTransactions(userId, page, limit);

    res.json({
      statusCode: 200,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể lấy lịch sử giao dịch",
      error: error.message,
    });
  }
};

exports.withdrawFromWallet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, bankName, accountNumber, accountHolder } = req.body;

    if (
      !amount ||
      amount <= 0 ||
      !bankName ||
      !accountNumber ||
      !accountHolder
    ) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Vui lòng nhập đầy đủ thông tin rút tiền",
      });
    }

    const result = await UserModel.withdrawFromWallet(userId, amount, {
      bankName,
      accountNumber,
      accountHolder,
    });

    res.json({
      statusCode: 200,
      message: result.message,
      data: {
        transactionId: result.transactionId,
        amount: result.amount,
      },
    });
  } catch (error) {
    res.statusCode(400).json({
      statusCode: "error",
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Email là bắt buộc",
      });
    }

    // Check if user exists
    const user = await UserModel.getUserByEmail(email);
    if (!user) {
      return res.statusCode(404).json({
        statusCode: "error",
        message: "Không tìm thấy tài khoản với email này",
      });
    }

    // Generate random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send email with code
    await sendRandomCodeEmail(email, code);

    // Save code to database
    await UserModel.sendCode(email, code);

    // Create a reset token
    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    return res.statusCode(200).json({
      statusCode: 200,
      message: "Mã xác nhận đã được gửi đến email của bạn",
      resetToken,
    });
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    return res.statusCode(500).json({
      statusCode: "error",
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !code || !newPassword) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Thiếu thông tin cần thiết",
      });
    }

    if (newPassword.length < 6) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Verify code
    const isCodeValid = await UserModel.verifyCode(decoded.email, code);
    if (!isCodeValid) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Mã xác nhận không hợp lệ hoặc đã hết hạn",
      });
    }

    // Delete verification code
    await UserModel.deleteVerificationCode(decoded.email, code);

    // Update password in database
    await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2`,
      [newPassword, decoded.email]
    );

    return res.statusCode(200).json({
      statusCode: 200,
      message: "Mật khẩu đã được cập nhật thành công",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    return res.statusCode(500).json({
      statusCode: "error",
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    });
  }
};

exports.getReferralShareContent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const appUrl = process.env.APP_URL || "https://yourapp.com";

    // Get user's referral code
    const user = await UserModel.getUserById(userId);

    if (!user) {
      return res.statusCode(404).json({
        statusCode: "error",
        message: "Người dùng không tồn tại",
      });
    }

    // Generate sharing content
    const referralCode = user.referralcode;
    const referralLink = `${appUrl}/register?ref=${referralCode}`;

    const sharingContent = {
      referralCode,
      referralLink,
      whatsappMessage: `Đăng ký ngay tại ${referralLink} để nhận ưu đãi đặt món ăn! Nhập mã ${referralCode} khi đăng ký.`,
      smsMessage: `Dùng mã ${referralCode} để nhận ưu đãi khi đăng ký tại nhà hàng chúng tôi!`,
      emailSubject: "Lời mời đăng ký từ nhà hàng ABC",
      emailBody: `Xin chào,\n\nTôi xin mời bạn đăng ký tài khoản tại nhà hàng ABC. Sử dụng mã giới thiệu ${referralCode} để nhận ưu đãi đặc biệt.\n\nĐăng ký tại: ${referralLink}\n\nCảm ơn bạn!`,
    };

    res.json({
      statusCode: 200,
      data: sharingContent,
    });
  } catch (error) {
    console.error("Lỗi lấy nội dung chia sẻ:", error);
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể tạo nội dung chia sẻ",
      error: error.message,
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(req.user);

    const user = await UserModel.getUserById(userId);

    if (!user) {
      return res.statusCode(404).json({
        statusCode: "error",
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Remove sensitive information
    const { Password, ...userProfile } = user;

    res.json({
      statusCode: 200,
      data: userProfile,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể lấy thông tin người dùng",
      error: error.message,
    });
  }
};
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phoneNumber, avatar } = req.body;

    const updatedUserData = await UserModel.updateUser(userId, {
      fullName,
      phoneNumber,
      avatar,
    });

    if (!updatedUserData) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Không có thông tin nào được cập nhật",
      });
    }

    res.json({
      statusCode: 200,
      message: "Cập nhật thông tin thành công",
      data: updatedUserData,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người dùng:", error);
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể cập nhật thông tin người dùng",
      error: error.message,
    });
  }
};
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.statusCode(400).json({
        statusCode: "error",
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
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Không thể cập nhật avatar",
      });
    }

    return res.statusCode(200).json({
      statusCode: 200,
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

    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi upload avatar",
      error: error.message,
    });
  }
};

// Hàm hỗ trợ để trích xuất public_id từ URL Cloudinary
function extractPublicIdFromUrl(url) {
  // Cloudinary URL có dạng: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/<folder>/<public_id>.<ext>
  try {
    if (!url) return null;
    // Lấy phần sau "/upload/"
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // Lấy phần sau version number (v1234567890/)
    const pathPart = parts[1].replace(/^v\d+\//, "");

    // Loại bỏ phần mở rộng file
    return pathPart.replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Lỗi khi trích xuất public_id:", error);
    return null;
  }
}
