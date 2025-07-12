const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { auth } = require('../middleware/roleAuth');

// Tạo order tại bàn
router.post('/orders', auth, posController.createOrderAtTable);
// Xác nhận thanh toán tại bàn
router.post('/orders/:orderId/pay', auth, posController.payOrderAtTable);

module.exports = router; 