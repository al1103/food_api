const { pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { generateReferralCode } = require("../utils/referral");

class UserModel {
  // Update the register method to handle referrals
  static async register(
    username,
    email,
    password,
    fullName,
    phoneNumber,
    referralCode = null
  ) {
    try {
      const userId = uuidv4();
      // Generate a unique referral code for the new user
      const userReferralCode = generateReferralCode();

      // Begin transaction
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Check if user exists
        const existingUserResult = await client.query(
          `SELECT 1 FROM users 
           WHERE username = $1 OR email = $2`,
          [username, email]
        );

        if (existingUserResult.rows.length > 0) {
          throw new Error("Email hoặc tên người dùng đã tồn tại");
        }

        let referredByUserId = null;

        // If referral code provided, find the referrer
        if (referralCode) {
          const referrerResult = await client.query(
            `SELECT userid FROM users WHERE referralcode = $1`,
            [referralCode]
          );

          if (referrerResult.rows.length > 0) {
            referredByUserId = referrerResult.rows[0].userid;
          }
        }

        // Insert new user
        await client.query(
          `INSERT INTO users (
            userid, username, email, password, 
            fullname, phonenumber, referralcode,
            referralcodereferralcode, createdat, updatedat
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
          )`,
          [
            userId,
            username,
            email,
            password,
            fullName,
            phoneNumber,
            userReferralCode,
            referredByUserId,
          ]
        );

        // If referred by someone, create a referral record and add commission
        if (referredByUserId) {
          const commissionAmount = 50000; // 50,000 VND or whatever currency

          // Create referral record
          await client.query(
            `INSERT INTO referrals (
              referrerid, referredid, commission, status, createdat, updatedat
            ) VALUES (
              $1, $2, $3, 'completed', NOW(), NOW()
            )`,
            [referredByUserId, userId, commissionAmount]
          );

          // Add commission to referrer's wallet
          await client.query(
            `UPDATE users 
             SET walletbalance = walletbalance + $1 
             WHERE userid = $2`,
            [commissionAmount, referredByUserId]
          );

          // Record the transaction
          await client.query(
            `INSERT INTO wallet_transactions (
              userid, amount, transactiontype, referenceid, description, createdat
            ) VALUES (
              $1, $2, 'credit', $3, 'Hoa hồng giới thiệu người dùng mới', NOW()
            )`,
            [referredByUserId, commissionAmount, userId]
          );
        }

        await client.query("COMMIT");

        return {
          userId,
          referralCode: userReferralCode,
          message: "Đăng ký thành công!",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Lỗi trong quá trình đăng ký:", error.message);
      throw new Error("Đăng ký thất bại. Vui lòng thử lại.");
    }
  }

  // Add referral-related methods
  static async getReferralInfo(userId) {
    try {
      // Get user's referral code
      const userResult = await pool.query(
        `SELECT referralcode, walletbalance FROM users WHERE userid = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error("Người dùng không tồn tại");
      }

      // Get referral statistics
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) AS total_referrals,
          SUM(commission) AS total_commission
         FROM referrals 
         WHERE referrerid = $1`,
        [userId]
      );

      // Get recent referrals
      const recentReferralsResult = await pool.query(
        `SELECT 
          ruserid, 
          r.commission, 
          r.status, 
          r.createdat,
          u.username,
          u.fullname
         FROM referrals r
         JOIN users u ON r.referredid = u.userid
         WHERE r.referrerid = $1
         ORDER BY r.createdat DESC
         LIMIT 10`,
        [userId]
      );

      return {
        referralCode: userResult.rows[0].referralcode,
        walletBalance: userResult.rows[0].walletbalance,
        totalReferrals: statsResult.rows[0].total_referrals,
        totalCommission: statsResult.rows[0].total_commission,
        recentReferrals: recentReferralsResult.rows,
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin giới thiệu:", error);
      throw error;
    }
  }

  static async getWalletTransactions(userId, page = 1, limit = 10) {
    try {
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(100, parseInt(limit)));
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) AS total_count FROM wallet_transactions WHERE userid = $1`,
        [userId]
      );

      // Get transactions
      const transactionsResult = await pool.query(
        `SELECT 
          id,
          amount,
          transactiontype,
          referenceid,
          description,
          createdat
         FROM wallet_transactions
         WHERE userid = $1
         ORDER BY createdat DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const totalCount = parseInt(countResult.rows[0].total_count);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        transactions: transactionsResult.rows,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử giao dịch:", error);
      throw error;
    }
  }

  static async withdrawFromWallet(userId, amount, bankDetails) {
    try {
      // Begin transaction
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Check if user has enough balance
        const userResult = await client.query(
          `SELECT walletbalance FROM users WHERE userid = $1`,
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error("Người dùng không tồn tại");
        }

        const currentBalance = parseFloat(userResult.rows[0].walletbalance);

        if (currentBalance < amount) {
          throw new Error("Số dư không đủ để rút tiền");
        }

        // Update user's wallet balance
        await client.query(
          `UPDATE users SET walletbalance = walletbalance - $1 WHERE userid = $2`,
          [amount, userId]
        );

        // Insert withdrawal request
        const withdrawalResult = await client.query(
          `INSERT INTO wallet_transactions (
            userid, amount, transactiontype, description, createdat
          ) VALUES (
            $1, $2, 'withdrawal', $3, NOW()
          ) RETURNING id`,
          [
            userId,
            amount,
            `Rút tiền đến tài khoản: ${bankDetails.bankName} - ${bankDetails.accountNumber}`,
          ]
        );

        await client.query("COMMIT");

        return {
          transactionId: withdrawalResult.rows[0].userid,
          amount,
          message: "Yêu cầu rút tiền đã được gửi",
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Lỗi khi rút tiền:", error);
      throw error;
    }
  }

  static async login(email, password) {
    try {
      const result = await pool.query(
        `SELECT 
          userid AS "UserID", 
          email AS "Email", 
          password AS "Password", 
          username AS "Username", 
          fullname AS "FullName"
        FROM users 
        WHERE email = $1`,
        [email]
      );

      const user = result.rows[0];

      if (user) {
        const isValidPassword = password == user.Password;

        if (isValidPassword) {
          const { Password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
      }

      return null;
    } catch (error) {
      console.error("Lỗi trong quá trình đăng nhập:", error);
      throw new Error("Đăng nhập thất bại.");
    }
  }

  static async sendCode(email, code) {
    try {
      // Delete any existing verification codes
      await pool.query(`DELETE FROM verification_code WHERE email = $1`, [
        email,
      ]);

      // Set expiration time
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 10);

      // Insert new code
      await pool.query(
        `INSERT INTO verification_code (
          email, code, type, expiration_time, is_verified, createdat
        ) VALUES (
          $1, $2, $3, $4, $5, NOW()
        )`,
        [email, code, "register", expirationTime, false]
      );
    } catch (error) {
      console.error("Lỗi trong sendCode:", error);
      throw error;
    }
  }

  static async verifyCode(email, code) {
    try {
      const result = await pool.query(
        `SELECT * FROM verification_code 
         WHERE email = $1 AND code = $2`,
        [email, code]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error("Lỗi trong verifyCode:", error);
      throw error;
    }
  }

  static async getUserByEmail(email) {
    try {
      const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
        email,
      ]);

      return result.rows[0] || null;
    } catch (error) {
      console.error("Lỗi trong getUserByEmail:", error);
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          userid AS "UserID", 
          username AS "Username", 
          email AS "Email", 
          fullname AS "FullName", 
          phonenumber AS "PhoneNumber"
        FROM users 
        WHERE userid = $1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Lỗi trong getUserById:", error);
      throw error;
    }
  }

  static async deleteVerificationCode(email, code) {
    try {
      await pool.query(
        `DELETE FROM verification_code 
         WHERE email = $1 AND code = $2`,
        [email, code]
      );
    } catch (error) {
      console.error("Lỗi trong deleteVerificationCode:", error);
      throw error;
    }
  }

  static async saveRefreshToken(userId, token) {
    try {
      await pool.query(
        `INSERT INTO refresh_tokens (userid, token) 
         VALUES ($1, $2)`,
        [userId, token]
      );
    } catch (error) {
      console.error("Lỗi trong saveRefreshToken:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
