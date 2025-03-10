const { pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class UserModel {
  static async register(username, email, password, fullName, phoneNumber) {
    try {
      const userId = uuidv4();

      // Check if user exists
      const existingUserResult = await pool.query(
        `SELECT 1 FROM users 
         WHERE username = $1 OR email = $2`,
        [username, email]
      );

      if (existingUserResult.rows.length > 0) {
        throw new Error("Email hoặc tên người dùng đã tồn tại");
      }

      // Insert new user
      await pool.query(
        `INSERT INTO users (
          userid, username, email, password, 
          fullname, phone_number, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )`,
        [userId, username, email, password, fullName, phoneNumber]
      );

      return { userId, message: "Đăng ký thành công!" };
    } catch (error) {
      console.error("Lỗi trong quá trình đăng ký:", error.message);
      throw new Error("Đăng ký thất bại. Vui lòng thử lại.");
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
          phone_number AS "PhoneNumber"
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
