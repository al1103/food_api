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

// Method to integrate with order creation
exports.integrateWithOrderCreate = async (order, userId) => {
  try {
    // Send FCM notification to user about new order
    // You can implement the logic to get user's FCM token and send notification
    console.log(`Order created successfully for user ${userId}: ${order.orderId}`);
    
    // TODO: Implement actual FCM notification logic
    // const userToken = await getUserFCMToken(userId);
    // if (userToken) {
    //   await sendFCM(userToken, 'Đơn hàng mới', 'Đơn hàng của bạn đã được tạo thành công', {
    //     orderId: order.orderId,
    //     type: 'order_created'
    //   });
    // }
    
    return true;
  } catch (error) {
    console.error('Error in integrateWithOrderCreate:', error);
    // Don't throw error to prevent order creation from failing
    return false;
  }
};
