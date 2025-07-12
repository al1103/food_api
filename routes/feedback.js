const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

router.post('/', async (req, res) => {
  const { message, contact } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Nội dung feedback không được để trống' });
  await transporter.sendMail({
    from: 'noreply@yourapp.com',
    to: 'admin@yourapp.com',
    subject: 'Feedback mới từ khách hàng',
    text: `Liên hệ: ${contact || 'Không cung cấp'}\nNội dung: ${message}`,
  });
  res.json({ success: true, message: 'Cảm ơn bạn đã góp ý!' });
});

module.exports = router; 