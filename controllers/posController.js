const OrderModel = require('../models/order_model');
const TableModel = require('../models/table_model');

exports.createOrderAtTable = async (req, res) => {
  try {
    const { table_id, items, note } = req.body;
    // Kiểm tra bàn có tồn tại không
    const table = await TableModel.getTableById(table_id);
    if (!table) return res.status(404).json({ message: 'Bàn không tồn tại' });

    // Chuẩn hóa items cho đúng model
    const formattedItems = items.map(item => ({
      dishId: item.dish_id,
      quantity: item.quantity,
      specialRequests: item.note || item.specialRequests || null
    }));

    // Tạo order mới (không cần userId, chỉ cần tableId)
    const orderData = {
      tableId: table_id,
      items: formattedItems,
      note: note || null
    };
    const orderId = await OrderModel.createOrder(orderData);
    res.status(201).json({ message: 'Tạo order thành công', order_id: orderId });
  } catch (error) {
    console.error('Error createOrderAtTable:', error);
    res.status(500).json({ message: 'Lỗi tạo order tại bàn' });
  }
};

exports.payOrderAtTable = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_method, amount } = req.body;
    // Kiểm tra order tồn tại
    const order = await OrderModel.getOrderById(orderId);
    if (!order) return res.status(404).json({ message: 'Order không tồn tại' });
    if (order.status === 'paid' || order.status === 'completed')
      return res.status(400).json({ message: 'Order đã thanh toán' });

    // Cập nhật trạng thái thanh toán
    await OrderModel.updateOrderPayment(orderId, {
      payment_method,
      paid_amount: amount
    });
    res.json({ message: 'Thanh toán thành công' });
  } catch (error) {
    console.error('Error payOrderAtTable:', error);
    res.status(500).json({ message: 'Lỗi xác nhận thanh toán' });
  }
}; 