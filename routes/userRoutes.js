const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");

// Public routes
router.post("/register", userController.register);
router.post("/verify-registration", userController.verifyRegistration);
router.post("/login", userController.login);
router.post("/reset-password", userController.resetPassword);
router.post("/token", userController.token);

// Protected routes
router.get("/me", auth, userController.getUserProfile);
router.put("/me", auth, userController.updateUserProfile);

// Referral and wallet routes
router.get("/referrals", auth, userController.getReferralInfo);
router.get("/referrals/share", auth, userController.getReferralShareContent);
router.get("/referrals/network", auth, userController.getReferralNetwork);
router.get("/wallet/transactions", auth, userController.getWalletTransactions);
router.post("/wallet/withdraw", auth, userController.withdrawFromWallet);

// Upload routes
router.post(
  "/upload/avatar",
  auth,
  upload.single("avatar"),
  userController.uploadAvatar
);

// Admin routes
router.put(
  "/admin/referrals/rates",
  adminAuth,
  userController.updateCommissionRates
);

// userController.js
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, phoneNumber, referralCode } =
      req.body;

    // Basic validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        statusCode: 400,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Email không hợp lệ",
      });
    }

    // Validate password strength (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        statusCode: 400,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    // Check if username or email already exists
    const existingUserQuery = `
      SELECT 1 FROM users 
      WHERE username = $1 OR email = $2
    `;
    const existingUserResult = await pool.query(existingUserQuery, [
      username,
      email,
    ]);

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Email hoặc tên đăng nhập đã được sử dụng",
      });
    }

    // Generate verification code (6 digits)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store temporary user data
    const userData = {
      username,
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      referralCode,
    };

    console.log("Storing registration data for verification:", {
      ...userData,
      password: "[HASHED]",
    });

    // Create expiration time (10 minutes from now)
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    // First delete any existing record with this email
    await pool.query(`DELETE FROM verification_codes WHERE email = $1`, [
      email,
    ]);

    // Insert the new verification record
    await pool.query(
      `INSERT INTO verification_codes (email, code, expiration_time, user_data, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [email, code, expirationTime, JSON.stringify(userData)]
    );

    // Log the code being sent (for development only, remove in production)
    console.log(`Verification code ${code} for ${email}`);

    // Send verification email
    try {
      await sendRandomCodeEmail(email, code);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      return res.status(500).json({
        statusCode: 500,
        message: "Không thể gửi email xác thực. Vui lòng thử lại sau.",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Vui lòng kiểm tra email để lấy mã xác nhận",
      data: { email },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Đã xảy ra lỗi trong quá trình đăng ký",
      error: error.message,
    });
  }
};

exports.verifyRegistration = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, code } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        statusCode: 400,
        message: "Email là bắt buộc",
      });
    }

    if (!code) {
      return res.status(400).json({
        statusCode: 400,
        message: "Mã xác nhận là bắt buộc",
      });
    }

    console.log(`Verifying registration for ${email} with code ${code}`);

    // Get the verification record
    const verificationResult = await client.query(
      `SELECT * FROM verification_codes 
       WHERE email = $1 AND code = $2 AND expiration_time > NOW()`, // Sửa từ expires_at thành expiration_time
      [email, code]
    );

    // Kiểm tra kết quả query cho debugging
    console.log("Verification result:", {
      found: verificationResult.rows.length > 0,
      email: email,
      code: code,
      currentTime: new Date(),
    });

    // Check if verification code exists and is valid
    if (verificationResult.rows.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Mã xác nhận không chính xác hoặc đã hết hạn",
      });
    }

    // Parse user data from verification record
    let userData;
    try {
      const userDataRaw = verificationResult.rows[0].user_data;

      // Handle different data types based on how PostgreSQL returns JSONB
      if (typeof userDataRaw === "string") {
        userData = JSON.parse(userDataRaw);
      } else {
        userData = userDataRaw;
      }

      console.log("User data retrieved successfully:", {
        ...userData,
        password: "[HASHED]",
      });
    } catch (parseError) {
      console.error("Error parsing user data:", parseError);
      return res.status(500).json({
        statusCode: 500,
        message: "Lỗi xử lý dữ liệu đăng ký",
      });
    }

    // Begin transaction for user creation
    await client.query("BEGIN");

    try {
      // Extract user data for registration
      const { username, email, password, fullName, phoneNumber, referralCode } =
        userData;

      // THÊM KIỂM TRA NÀY: Kiểm tra lại xem username/email đã tồn tại chưa
      const checkExistingQuery = `
        SELECT 1 FROM users 
        WHERE username = $1 OR email = $2
      `;
      const checkExistingResult = await client.query(checkExistingQuery, [
        username,
        email,
      ]);

      if (checkExistingResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          statusCode: 400,
          message: "Email hoặc tên đăng nhập đã được sử dụng trong hệ thống",
        });
      }

      // Generate UUID for user and referral code
      const userId = uuidv4();
      const userReferralCode = generateReferralCode();

      let referrerId = null;

      // If referral code provided, find the referrer
      if (referralCode) {
        console.log("Looking up referrer with code:", referralCode);
        const referrerResult = await client.query(
          `SELECT user_id FROM users WHERE referral_code = $1`,
          [referralCode]
        );

        if (referrerResult.rows.length > 0) {
          referrerId = referrerResult.rows[0].user_id;
          console.log("Found referrer with ID:", referrerId);
        } else {
          console.log("No referrer found with code:", referralCode);
        }
      }

      // Insert the new user into database
      const insertUserQuery = `
        INSERT INTO users (
          user_id, username, email, password, 
          full_name, phone_number, referral_code,
          referred_by, role, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        RETURNING user_id, username, email, full_name, referral_code
      `;

      const insertedUser = await client.query(insertUserQuery, [
        userId,
        username,
        email,
        password,
        fullName,
        phoneNumber,
        userReferralCode,
        referrerId,
        "customer",
      ]);

      console.log("User created successfully with ID:", userId);

      // If referred by someone, build the referral tree
      if (referrerId) {
        // First, insert direct referral (level 1)
        await client.query(
          `INSERT INTO referral_tree (user_id, ancestor_id, level)
           VALUES ($1, $2, 1)`,
          [userId, referrerId]
        );

        // Then get all ancestors of the referrer up to level 4
        const ancestorsResult = await client.query(
          `SELECT ancestor_id, level 
           FROM referral_tree 
           WHERE user_id = $1 AND level <= 4`,
          [referrerId]
        );

        // Insert these ancestors with incremented levels
        for (const ancestor of ancestorsResult.rows) {
          await client.query(
            `INSERT INTO referral_tree (user_id, ancestor_id, level)
             VALUES ($1, $2, $3)`,
            [userId, ancestor.ancestor_id, ancestor.level + 1]
          );
        }

        // Give signup bonus to direct referrer
        const signupBonus = 50000;

        await client.query(
          `UPDATE users 
           SET wallet_balance = wallet_balance + $1 
           WHERE user_id = $2`,
          [signupBonus, referrerId]
        );

        // Record the transaction
        await client.query(
          `INSERT INTO wallet_transactions (
            user_id, amount, transaction_type, reference_id, description, created_at
          ) VALUES (
            $1, $2, 'signup_bonus', $3, 'Thưởng giới thiệu đăng ký thành công', NOW()
          )`,
          [referrerId, signupBonus, userId]
        );

        // Record the referral
        await client.query(
          `INSERT INTO referrals (
            referrer_id, referred_id, commission, status, level, created_at, updated_at
          ) VALUES (
            $1, $2, $3, 'completed', 1, NOW(), NOW()
          )`,
          [referrerId, userId, signupBonus]
        );

        console.log(
          `Signup bonus of ${signupBonus} given to referrer ${referrerId}`
        );
      }

      // Delete the verification code after successful registration
      await client.query(`DELETE FROM verification_codes WHERE email = $1`, [
        email,
      ]);

      // Commit transaction
      await client.query("COMMIT");

      // Return success response
      return res.status(201).json({
        statusCode: 201,
        message: "Đăng ký thành công",
        data: {
          userId,
          username: insertedUser.rows[0].username,
          email: insertedUser.rows[0].email,
          fullName: insertedUser.rows[0].full_name,
          referralCode: userReferralCode,
        },
      });
    } catch (dbError) {
      // Rollback transaction on error
      await client.query("ROLLBACK");
      console.error("Error creating user:", dbError);

      // Specific error messages for common issues
      if (dbError.code === "23505") {
        if (dbError.constraint.includes("username")) {
          return res.status(400).json({
            statusCode: 400,
            message: "Tên đăng nhập đã tồn tại",
          });
        } else if (dbError.constraint.includes("email")) {
          return res.status(400).json({
            statusCode: 400,
            message: "Email đã tồn tại",
          });
        }
      }

      return res.status(500).json({
        statusCode: 500,
        message: "Đăng ký thất bại",
        error: dbError.message,
      });
    }
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError);
    }

    console.error("Lỗi xác nhận đăng ký:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = router;
