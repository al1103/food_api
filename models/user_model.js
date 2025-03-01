const { sql, poolPromise } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class UserModel {
  static async register(username, email, password, fullName, phoneNumber) {
    try {
      const pool = await poolPromise;
      const userId = uuidv4();

      const existingUser = await pool
        .request()
        .input("username", sql.NVarChar(50), username)
        .input("email", sql.NVarChar(100), email).query(`
          SELECT 1 FROM Users 
          WHERE Username = @username OR Email = @email;
        `);

      if (existingUser.recordset.length > 0) {
        throw new Error("Email hoặc tên người dùng đã tồn tại");
      }

      // Removed bcrypt, using plain password

      await pool
        .request()
        .input("userId", sql.VarChar(36), userId)
        .input("username", sql.NVarChar(50), username)
        .input("email", sql.NVarChar(100), email)
        .input("password", sql.NVarChar(255), password) // Changed from hashedPassword to password
        .input("fullName", sql.NVarChar(100), fullName)
        .input("phoneNumber", sql.VarChar(20), phoneNumber).query(`
          INSERT INTO Users (
            UserID, Username, Email, Password, 
            FullName, PhoneNumber, CreatedAt, UpdatedAt
          ) 
          VALUES (
            @userId, @username, @email, @password,
            @fullName, @phoneNumber, GETDATE(), GETDATE()
          );
        `);

      return { userId, message: "Đăng ký thành công!" };
    } catch (error) {
      console.error("Lỗi trong quá trình đăng ký:", error.message);
      throw new Error("Đăng ký thất bại. Vui lòng thử lại.");
    }
  }

  static async login(email, password) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("email", sql.NVarChar(100), email).query(`
          SELECT UserID, Email, Password, Username, FullName 
          FROM Users WHERE Email = @email;
        `);

      const user = result.recordset[0];

      if (user) {
        const isValidPassword = password == user.Password;
        // const isValidPassword = await bcrypt.compare(password, user.Password);
        // console.log(isValidPassword);

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
      const pool = await poolPromise;

      await pool.request().input("email", sql.NVarChar(255), email).query(`
          DELETE FROM VerificationCode WHERE Email = @email;
      `);

      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 10);

      await pool
        .request()
        .input("email", sql.NVarChar(255), email)
        .input("code", sql.NVarChar(10), code)
        .input("type", sql.VarChar(20), "register")
        .input("expirationTime", sql.DateTime, expirationTime) // Sửa lại dòng này
        .query(`
    INSERT INTO VerificationCode (
      Email, Code, Type, ExpirationTime, IsVerified, CreatedAt
    ) 
    VALUES (
      @email, @code, @type, @expirationTime, 0, GETDATE()
    );
  `);
    } catch (error) {
      console.error("Lỗi trong sendCode:", error);
      throw error;
    }
  }

  static async verifyCode(email, code) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("email", sql.NVarChar(255), email)
        .input("code", sql.NVarChar(10), code).query(`
    SELECT * FROM VerificationCode 
    WHERE Email = @email 
    AND Code = @code 
  `);
      console.log(result);
      return result.recordset.length > 0;
    } catch (error) {
      console.error("Lỗi trong verifyCode:", error);
      throw error;
    }
  }

  static async getUserByEmail(email) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("email", sql.NVarChar(255), email)
        .query("SELECT * FROM Users WHERE Email = @email");

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Lỗi trong getUserByEmail:", error);
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("userId", sql.VarChar(36), userId).query(`
          SELECT 
            UserID, Username, Email, FullName, PhoneNumber
          FROM Users 
          WHERE UserID = @userId;
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error("Lỗi trong getUserById:", error);
      throw error;
    }
  }
  static async deleteVerificationCode(email, code) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("email", sql.NVarChar(255), email)
        .input("code", sql.NVarChar(10), code)
        .query(
          `DELETE FROM VerificationCode WHERE Email = @email AND Code = @code`
        );
    } catch (error) {
      console.error("Lỗi trong deleteVerificationCode:", error);
      throw error;
    }
  }
  static async saveRefreshToken(userId, token) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("userId", sql.VarChar(36), userId)
        .input("token", sql.NVarChar(500), token).query(`
          INSERT INTO RefreshTokens (UserID, Token) VALUES (@userId, @token);
        `);
    } catch (error) {
      console.error("Lỗi trong saveRefreshToken:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
