const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    console.log(token);

    req.user = { userId: decodedToken.UserID };
    next();
  } catch (error) {
    res.status(401).json({ error: "Xác thực không hợp lệ" });
  }
};
