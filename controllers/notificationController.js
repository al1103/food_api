const { sendFCM } = require('../utils/fcm');

exports.notifyUser = async (req, res) => {
  const { token, title, body, data } = req.body;
  if (!token || !title || !body) {
    return res.status(400).json({ success: false, message: 'Missing token, title, or body' });
  }
  try {
    const result = await sendFCM(token, title, body, data || {});
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
