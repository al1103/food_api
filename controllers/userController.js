require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user_model");
const { sendRandomCodeEmail } = require("../server/server");

const refreshTokens = [];

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email không hợp lệ" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const existingUser = await UserModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    //TODO : Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await sendRandomCodeEmail(email, code);

    await UserModel.sendCode(email, code);

    const tempUserData = {
      username,
      email,
      password: password,
      fullName,
    };
    const token = jwt.sign(tempUserData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10m",
    });

    return res.status(200).json({
      message: "Vui lòng kiểm tra email để lấy mã xác nhận",
      token,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return res
      .status(500)
      .json({ error: "Đã xảy ra lỗi trong quá trình đăng ký" });
  }
};

exports.verifyRegistration = async (req, res) => {
  try {
    const { token, code } = req.body;

    if (!token) return res.status(400).json({ error: "Thiếu token" });
    if (!code)
      return res.status(400).json({ error: "Mã xác nhận là bắt buộc" });

    let tempUser;
    try {
      tempUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const isCodeValid = await UserModel.verifyCode(tempUser.email, code);
    if (!isCodeValid) {
      return res
        .status(400)
        .json({ error: "Mã xác nhận không hợp lệ hoặc đã hết hạn" });
    }
    await UserModel.deleteVerificationCode(tempUser.email, code);

    const result = await UserModel.register(
      tempUser.username,
      tempUser.email,
      tempUser.password,
      tempUser.fullName
    );

    return res.status(201).json({
      message: "Đăng ký thành công",
      userId: result.userId,
    });
  } catch (error) {
    console.error("Lỗi xác nhận đăng ký:", error);
    return res
      .status(500)
      .json({ error: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.login(email, password);

    if (!user) {
      return res
        .status(401)
        .json({ error: "Thông tin đăng nhập không chính xác" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_SECRET_KEY);
    refreshTokens.push(refreshToken);

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res
      .status(500)
      .json({ error: "Đã xảy ra lỗi trong quá trình đăng nhập" });
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

function generateAccessToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: "2h" });
}
