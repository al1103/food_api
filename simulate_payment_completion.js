const { pool } = require('./config/database');

// Script để simulate việc user đã thanh toán xong (cho testing)
async function simulatePaymentCompletion() {
  console.log('🎯 Simulate Payment Completion Tool\n');

  const app_trans_id = process.argv[2];

  if (!app_trans_id) {
    console.log('❌ Cần provide app_trans_id:');
    console.log('node simulate_payment_completion.js 231207_123456');
    console.log('\nHoặc:');
    console.log('node simulate_payment_completion.js latest  # Simulate payment mới nhất');
    return;
  }

  try {
    let targetAppTransId = app_trans_id;

    // Nếu user nhập "latest", lấy payment mới nhất
    if (app_trans_id === 'latest') {
      const latestResult = await pool.query(
        'SELECT app_trans_id FROM payments ORDER BY created_at DESC LIMIT 1'
      );

      if (latestResult.rows.length === 0) {
        console.log('❌ Không tìm thấy payment nào trong database');
        return;
      }

      targetAppTransId = latestResult.rows[0].app_trans_id;
      console.log(`🔍 Tìm thấy payment mới nhất: ${targetAppTransId}`);
    }

    // Kiểm tra payment có tồn tại không
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE app_trans_id = $1',
      [targetAppTransId]
    );

    if (paymentResult.rows.length === 0) {
      console.log(`❌ Không tìm thấy payment với app_trans_id: ${targetAppTransId}`);
      return;
    }

    const payment = paymentResult.rows[0];
    console.log('📋 Payment hiện tại:');
    console.log(`- Payment ID: ${payment.payment_id}`);
    console.log(`- Order ID: ${payment.order_id}`);
    console.log(`- Amount: ${payment.amount}`);
    console.log(`- Status: ${payment.status}`);
    console.log(`- Created: ${payment.created_at}`);

    if (payment.status === 'completed') {
      console.log('\n⚠️ Payment này đã completed rồi!');
      return;
    }

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // 1. Update payment status
      await pool.query(
        'UPDATE payments SET status = $1, updated_at = NOW() WHERE app_trans_id = $2',
        ['completed', targetAppTransId]
      );

      // 2. Create transaction log
      await pool.query(
        `INSERT INTO payment_transactions
         (payment_id, app_trans_id, amount, return_code, return_message, status, transaction_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          payment.payment_id,
          targetAppTransId,
          payment.amount,
          1,
          'Payment completed via simulation',
          'completed',
          JSON.stringify({
            simulation: true,
            completed_at: new Date().toISOString(),
            method: 'manual_simulation'
          })
        ]
      );

      // 3. Update order status
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2',
        ['processing', payment.order_id]
      );

      await pool.query('COMMIT');

      console.log('\n✅ Payment simulation completed successfully!');
      console.log(`- Payment status: pending → completed`);
      console.log(`- Order status: → processing`);
      console.log(`- Transaction logged`);

      console.log('\n🧪 Bây giờ có thể test:');
      console.log(`1. Check payment status: GET /api/payment/check-status/${targetAppTransId}`);
      console.log(`2. Hoặc dùng polling mechanism trong frontend`);

    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error('❌ Lỗi khi simulate payment:', error.message);
  }
}

// List pending payments
async function listPendingPayments() {
  console.log('📋 Danh sách payments đang pending:\n');

  try {
    const result = await pool.query(
      `SELECT p.payment_id, p.app_trans_id, p.order_id, p.amount, p.status, p.created_at,
              o.status as order_status
       FROM payments p
       LEFT JOIN orders o ON p.order_id = o.order_id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC
       LIMIT 10`
    );

    if (result.rows.length === 0) {
      console.log('✅ Không có payment nào đang pending');
      return;
    }

    result.rows.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment.payment_id}`);
      console.log(`   App Trans ID: ${payment.app_trans_id}`);
      console.log(`   Order ID: ${payment.order_id}`);
      console.log(`   Amount: ${payment.amount} VND`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Order Status: ${payment.order_status || 'N/A'}`);
      console.log(`   Created: ${payment.created_at}`);
      console.log('');
    });

    console.log('💡 Để simulate completion:');
    console.log(`node simulate_payment_completion.js ${result.rows[0].app_trans_id}`);

  } catch (error) {
    console.error('❌ Lỗi khi list payments:', error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2];

  if (command === 'list') {
    await listPendingPayments();
  } else if (command) {
    await simulatePaymentCompletion();
  } else {
    console.log('🎯 Payment Completion Simulation Tool\n');
    console.log('Cách sử dụng:');
    console.log('');
    console.log('1. Simulate payment completion:');
    console.log('   node simulate_payment_completion.js 231207_123456');
    console.log('   node simulate_payment_completion.js latest');
    console.log('');
    console.log('2. List pending payments:');
    console.log('   node simulate_payment_completion.js list');
    console.log('');
    console.log('💡 Workflow:');
    console.log('1. Tạo payment qua API');
    console.log('2. User quét QR code (simulate)');
    console.log('3. Chạy script này để simulate completion');
    console.log('4. Frontend polling sẽ detect payment completed');
  }
}

main().catch(console.error);

module.exports = {
  simulatePaymentCompletion,
  listPendingPayments
};
