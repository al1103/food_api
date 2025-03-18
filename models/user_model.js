const { pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { generateReferralCode } = require("../utils/referral");

class UserModel {
  static async updateUser(userId, updates) {
    try {
      const { fullName, phoneNumber, avatar } = updates;
      const params = [userId];
      let paramCounter = 2;
      let updateString = "";

      // Build update string dynamically
      if (fullName !== undefined) {
        updateString += `fullname = $${paramCounter++}, `;
        params.push(fullName);
      }

      if (phoneNumber !== undefined) {
        updateString += `phone_number = $${paramCounter++}, `;
        params.push(phoneNumber);
      }

      if (avatar !== undefined) {
        updateString += `avatar = $${paramCounter++}, `;
        params.push(avatar);
      }

      // If no updates, return
      if (updateString === "") {
        return null;
      }

      // Remove trailing comma and add updated_at
      updateString = updateString.slice(0, -2);
      updateString += `, updated_at = NOW()`;

      // Execute query
      const query = `
        UPDATE users 
        SET ${updateString} 
        WHERE user_id = $1
        RETURNING user_id, username, email, fullname, phone_number, avatar, role, 
                 wallet_balance, referral_code, created_at, updated_at
      `;

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  // Modify the register method to include role
  static async register(
    username,
    email,
    password,
    fullName,
    phoneNumber,
    referralCode = null,
    role = "customer" // Default role is customer
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
            `SELECT user_id FROM users WHERE referral_code = $1`,
            [referralCode]
          );

          if (referrerResult.rows.length > 0) {
            referredByUserId = referrerResult.rows[0].user_id;
          }
        }

        // Insert new user with role
        await client.query(
          `INSERT INTO users (
            user_id, username, email, password, 
            full_name, phone_number, referral_code,
            referred_by, role, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
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
            role,
          ]
        );

        // If referred by someone, create a referral record and add commission
        if (referredByUserId) {
          const commissionAmount = 50000; // 50,000 VND or whatever currency

          // Create referral record
          await client.query(
            `INSERT INTO referrals (
              referrer_id, referred_id, commission, status, created_at, updated_at
            ) VALUES (
              $1, $2, $3, 'completed', NOW(), NOW()
            )`,
            [referredByUserId, userId, commissionAmount]
          );

          // Add commission to referrer's wallet
          await client.query(
            `UPDATE users 
             SET wallet_balance = wallet_balance + $1 
             WHERE user_id = $2`,
            [commissionAmount, referredByUserId]
          );

          // Record the transaction
          await client.query(
            `INSERT INTO wallet_transactions (
              user_id, amount, transaction_type, reference_id, description, created_at
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
        `SELECT referral_code, wallet_balance FROM users WHERE user_id = $1`,
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
         WHERE referrer_id = $1`,
        [userId]
      );

      // Get recent referrals
      const recentReferralsResult = await pool.query(
        `SELECT 
          r.id, 
          r.commission, 
          r.status, 
          r.created_at,
          u.username,
          u.full_name
         FROM referrals r
         JOIN users u ON r.referred_id = u.user_id
         WHERE r.referrer_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10`,
        [userId]
      );

      return {
        referralCode: userResult.rows[0].referral_code,
        walletBalance: userResult.rows[0].wallet_balance,
        totalReferrals: parseInt(statsResult.rows[0].total_referrals),
        totalCommission: parseFloat(statsResult.rows[0].total_commission) || 0,
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
        `SELECT COUNT(*) AS total_count FROM wallet_transactions WHERE user_id = $1`,
        [userId]
      );

      // Get transactions
      const transactionsResult = await pool.query(
        `SELECT 
          id,
          amount,
          transaction_type AS "transactionType",
          reference_id AS "referenceId",
          description,
          created_at AS "createdAt"
         FROM wallet_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
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
          `SELECT wallet_balance FROM users WHERE user_id = $1`,
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error("Người dùng không tồn tại");
        }

        const currentBalance = parseFloat(userResult.rows[0].wallet_balance);

        if (currentBalance < amount) {
          throw new Error("Số dư không đủ để rút tiền");
        }

        // Update user's wallet balance
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE user_id = $2`,
          [amount, userId]
        );

        // Insert withdrawal request
        const withdrawalResult = await client.query(
          `INSERT INTO wallet_transactions (
            user_id, amount, transaction_type, description, created_at
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
          transactionId: withdrawalResult.rows[0].id,
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

  // Update the login method to return role information
  static async login(email, password) {
    try {
      const result = await pool.query(
        `SELECT 
          user_id AS "userId", 
          email, 
          password, 
          username, 
          full_name AS "fullName",
          role
        FROM users 
        WHERE email = $1`,
        [email]
      );

      const user = result.rows[0];

      if (user) {
        const isValidPassword = password === user.password;

        if (isValidPassword) {
          const { password, ...userWithoutPassword } = user;
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
      await pool.query(`DELETE FROM verification_codes WHERE email = $1`, [
        email,
      ]);

      // Set expiration time
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 10);

      // Insert new code
      await pool.query(
        `INSERT INTO verification_codes (
          email, code, type, expiration_time, is_verified, created_at
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
        `SELECT * FROM verification_codes 
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
      const result = await pool.query(
        `SELECT 
          user_id AS "userId", 
          email, 
          password,
          username, 
          full_name AS "fullName", 
          phone_number AS "phoneNumber",
          referral_code AS "referralCode",
          wallet_balance AS "walletBalance",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users WHERE email = $1`,
        [email]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Lỗi trong getUserByEmail:", error);
      throw error;
    }
  }

  // Update the getUserById method to return role information
  static async getUserById(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          user_id AS "userId", 
          username, 
          email, 
          full_name AS "fullName", 
          phone_number AS "phoneNumber",
          referral_code AS "referralCode",
          wallet_balance AS "walletBalance",
          role
        FROM users 
        WHERE user_id = $1`,
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
        `DELETE FROM verification_codes 
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
        `INSERT INTO refresh_tokens (user_id, token, created_at) 
         VALUES ($1, $2, NOW())`,
        [userId, token]
      );
    } catch (error) {
      console.error("Lỗi trong saveRefreshToken:", error);
      throw error;
    }
  }

  // Add method to get all users (for admin)
  static async getAllUsers(page = 1, limit = 10) {
    try {
      page = Math.max(1, parseInt(page));
      limit = Math.max(1, Math.min(100, parseInt(limit)));
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const countResult = await pool.query(
        "SELECT COUNT(*) AS total FROM users"
      );
      const totalCount = parseInt(countResult.rows[0].total);

      // Get paginated users
      const result = await pool.query(
        `SELECT 
          user_id AS "userId",
          username,
          email,
          full_name AS "fullName",
          phone_number AS "phoneNumber",
          role,
          referral_code AS "referralCode",
          wallet_balance AS "walletBalance",
          created_at AS "createdAt"
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        users: result.rows,
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      throw error;
    }
  }

  // Add method to update user role (admin only)
  static async updateUserRole(userId, role) {
    try {
      if (!["admin", "customer", "staff"].includes(role)) {
        throw new Error(
          "Vai trò không hợp lệ. Phải là admin, customer hoặc staff."
        );
      }

      const result = await pool.query(
        `UPDATE users SET role = $1, updated_at = NOW() 
         WHERE user_id = $2 
         RETURNING user_id`,
        [role, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Không tìm thấy người dùng với ID đã cung cấp");
      }

      return await this.getUserById(userId);
    } catch (error) {
      console.error("Lỗi khi cập nhật vai trò người dùng:", error);
      throw error;
    }
  }

  // Add method to delete user (admin only)
  static async deleteUser(userId) {
    try {
      const result = await pool.query(
        "DELETE FROM users WHERE user_id = $1 RETURNING user_id",
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Không tìm thấy người dùng với ID đã cung cấp");
      }

      return { message: "Xóa người dùng thành công" };
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
