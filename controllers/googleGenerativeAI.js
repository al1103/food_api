const axios = require('axios');
const DishModel = require('../models/dishes_model');

const GEMINI_API_KEY = 'AIzaSyDTcUOSGHgq6sOYRCu4KJXediXtGc90Nhs';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

exports.chatSuggestDish = async (req, res) => {
  try {
    const { message } = req.body;
    // Lấy thực đơn từ DB (lấy tối đa 20 món, không phân trang)
    const dishResult = await DishModel.getAllDishes(1, 20, 0, null);
    let menuText = '';
    if (dishResult && Array.isArray(dishResult.rows)) {
      menuText = dishResult.rows.map(d => `- ${d.name}: ${d.description || ''}`).join('\n');
    }
    console.log('MenuText:', menuText);
    const prompt = `# DỮ LIỆU THỰC ĐƠN
    ${menuText}
    # HƯỚNG DẪN
    1. Trả lời câu hỏi của người dùng về các món ăn trong thực đơn trên.
    2. Nếu người dùng hỏi thông tin chi tiết (như calo, thành phần, cách chế biến...) của một món có trong thực đơn, bạn có thể sử dụng kiến thức của mình để trả lời, ngay cả khi dữ liệu trên không chứa thông tin đó.
    3. Nếu người dùng hỏi món không có trong danh sách thực đơn, hãy lịch sự trả lời rằng món đó hiện không có trong nhà hàng.
    4. Không bịa thêm món mới mà không nằm trong danh sách.
    # CÂU HỎI
    ${message}`;    
    console.log('Prompt:', prompt);

    const geminiRes = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    const aiReply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi chưa có câu trả lời phù hợp.';
    res.json({ reply: aiReply });
  } catch (error) {
    console.error('Gemini AI error:', error?.response?.data || error.message);
    res.status(500).json({ reply: 'Xin lỗi, đã có lỗi khi kết nối AI.' });
  }
};

// Stub: handleNewMessage
exports.handleNewMessage = (req, res) => {
  res.json({ reply: 'Stub: handleNewMessage chưa được triển khai.' });
};

// Stub: handleImageAndPrompt
exports.handleImageAndPrompt = (req, res) => {
  res.json({ reply: 'Stub: handleImageAndPrompt chưa được triển khai.' });
};

// Stub: promptAnswer
exports.promptAnswer = (req, res) => {
  res.json({ reply: 'Stub: promptAnswer chưa được triển khai.' });
};
