// Frontend JavaScript để polling payment status sau khi user quét QR
class PaymentStatusPoller {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3000/api';
    this.pollInterval = options.pollInterval || 3000; // 3 seconds
    this.maxAttempts = options.maxAttempts || 60; // 3 minutes total
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.onTimeout = options.onTimeout || (() => {});

    this.currentAttempt = 0;
    this.pollTimer = null;
    this.isPolling = false;
  }

  // Bắt đầu polling payment status
  startPolling(appTransId, jwtToken) {
    if (this.isPolling) {
      console.log('⚠️ Polling already in progress');
      return;
    }

    console.log(`🔄 Starting payment status polling for: ${appTransId}`);
    this.appTransId = appTransId;
    this.jwtToken = jwtToken;
    this.currentAttempt = 0;
    this.isPolling = true;

    // Start immediate check
    this.checkPaymentStatus();
  }

  // Dừng polling
  stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.isPolling = false;
    console.log('⏹️ Payment polling stopped');
  }

  // Check payment status một lần
  async checkPaymentStatus() {
    if (!this.isPolling) return;

    this.currentAttempt++;
    console.log(`🔍 Checking payment status (attempt ${this.currentAttempt}/${this.maxAttempts})`);

    try {
      const response = await fetch(`${this.baseURL}/payment/check-status/${this.appTransId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('📊 Payment status response:', data);

        // Call status change callback
        this.onStatusChange(data);

        // Check if payment is completed
        if (this.isPaymentCompleted(data)) {
          console.log('✅ Payment completed!');
          this.stopPolling();
          this.onSuccess(data);
          return;
        }

        // Continue polling if not completed
        this.scheduleNextCheck();

      } else {
        console.error('❌ Payment status check failed:', data);
        this.onError(data);
        this.scheduleNextCheck();
      }

    } catch (error) {
      console.error('❌ Network error checking payment status:', error);
      this.onError({ error: error.message });
      this.scheduleNextCheck();
    }
  }

  // Kiểm tra xem payment đã completed chưa
  isPaymentCompleted(data) {
    // Với simplified API, check database status
    if (data.status === 'success' && data.data) {
      // Nếu API trả về payment data với status completed
      return data.data.return_code === 1;
    }
    return false;
  }

  // Schedule next check
  scheduleNextCheck() {
    if (!this.isPolling) return;

    if (this.currentAttempt >= this.maxAttempts) {
      console.log('⏰ Payment polling timeout');
      this.stopPolling();
      this.onTimeout();
      return;
    }

    this.pollTimer = setTimeout(() => {
      this.checkPaymentStatus();
    }, this.pollInterval);
  }
}

// Usage example và demo
function createPaymentPollingDemo() {
  console.log('🎯 Payment Status Polling Demo\n');

  // Example usage
  const poller = new PaymentStatusPoller({
    baseURL: 'http://localhost:3000/api',
    pollInterval: 3000, // Check every 3 seconds
    maxAttempts: 20,    // Max 1 minute

    onStatusChange: (data) => {
      console.log('📊 Status update:', data);
      // Update UI here
      updatePaymentUI('checking', 'Đang kiểm tra thanh toán...');
    },

    onSuccess: (data) => {
      console.log('🎉 Payment successful!', data);
      // Update UI to success state
      updatePaymentUI('success', 'Thanh toán thành công!');
      // Redirect or update order status
      handlePaymentSuccess(data);
    },

    onError: (error) => {
      console.log('❌ Payment check error:', error);
      // Show error but continue polling
      updatePaymentUI('error', 'Lỗi kiểm tra thanh toán, đang thử lại...');
    },

    onTimeout: () => {
      console.log('⏰ Payment check timeout');
      // Show timeout message
      updatePaymentUI('timeout', 'Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.');
    }
  });

  // Mock functions for demo
  function updatePaymentUI(status, message) {
    console.log(`🎨 UI Update: [${status.toUpperCase()}] ${message}`);

    // In real app, update DOM elements:
    // document.getElementById('payment-status').textContent = message;
    // document.getElementById('payment-spinner').style.display = status === 'checking' ? 'block' : 'none';
  }

  function handlePaymentSuccess(data) {
    console.log('🚀 Handling payment success...');

    // In real app:
    // - Update order status in UI
    // - Redirect to success page
    // - Send analytics event
    // - Show success animation

    setTimeout(() => {
      console.log('➡️ Redirecting to success page...');
      // window.location.href = '/payment-success';
    }, 2000);
  }

  return poller;
}

// Complete workflow example
function demonstratePaymentWorkflow() {
  console.log('🔄 Complete Payment Workflow Demo\n');

  console.log('📋 Workflow steps:');
  console.log('1. User clicks "Thanh toán"');
  console.log('2. Call API tạo payment → get QR code');
  console.log('3. Show QR code cho user quét');
  console.log('4. Start polling payment status');
  console.log('5. User quét QR và thanh toán');
  console.log('6. Polling detect payment completed');
  console.log('7. Update UI và redirect');
  console.log('');

  // Step 1-2: Create payment (mock)
  const mockPaymentResponse = {
    status: "success",
    payment_id: 123,
    app_trans_id: "231207_123456",
    order_url: "https://sb-openapi.zalopay.vn/v2/pay?...",
    qr_code: "data:image/png;base64,...",
    amount: 50000
  };

  console.log('✅ Step 1-2: Payment created');
  console.log('App Trans ID:', mockPaymentResponse.app_trans_id);

  // Step 3: Show QR code (mock)
  console.log('✅ Step 3: QR code displayed to user');

  // Step 4: Start polling
  console.log('✅ Step 4: Starting payment status polling...');

  const poller = createPaymentPollingDemo();

  // Mock JWT token (in real app, get from login)
  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  // Start polling (commented out for demo)
  // poller.startPolling(mockPaymentResponse.app_trans_id, mockJwtToken);

  console.log('💡 To test real polling:');
  console.log('1. Tạo payment qua API');
  console.log('2. Lấy app_trans_id từ response');
  console.log('3. Uncomment poller.startPolling() above');
  console.log('4. Chạy: node simulate_payment_completion.js <app_trans_id>');
  console.log('5. Watch polling detect the completion');
}

// HTML example for integration
function generateHTMLExample() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Status Polling Example</title>
    <style>
        .payment-container { max-width: 400px; margin: 50px auto; padding: 20px; }
        .qr-code { text-align: center; margin: 20px 0; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .status.checking { background: #fff3cd; color: #856404; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .spinner { display: none; }
    </style>
</head>
<body>
    <div class="payment-container">
        <h2>Thanh toán ZaloPay</h2>

        <div class="qr-code">
            <img id="qr-image" src="" alt="QR Code" style="max-width: 200px;">
            <p>Quét mã QR để thanh toán</p>
        </div>

        <div id="payment-status" class="status checking">
            <span id="status-text">Đang chờ thanh toán...</span>
            <div id="spinner" class="spinner">⏳</div>
        </div>

        <button onclick="cancelPayment()">Hủy thanh toán</button>
    </div>

    <script>
        // Include PaymentStatusPoller class here
        ${PaymentStatusPoller.toString()}

        // Initialize polling
        const poller = new PaymentStatusPoller({
            onStatusChange: (data) => {
                document.getElementById('status-text').textContent = 'Đang kiểm tra thanh toán...';
            },
            onSuccess: (data) => {
                const statusDiv = document.getElementById('payment-status');
                statusDiv.className = 'status success';
                document.getElementById('status-text').textContent = 'Thanh toán thành công!';
                setTimeout(() => {
                    window.location.href = '/payment-success';
                }, 2000);
            },
            onTimeout: () => {
                const statusDiv = document.getElementById('payment-status');
                statusDiv.className = 'status error';
                document.getElementById('status-text').textContent = 'Timeout. Vui lòng thử lại.';
            }
        });

        function startPaymentPolling(appTransId, jwtToken) {
            poller.startPolling(appTransId, jwtToken);
        }

        function cancelPayment() {
            poller.stopPolling();
            // Handle cancellation
        }
    </script>
</body>
</html>`;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PaymentStatusPoller,
    createPaymentPollingDemo,
    demonstratePaymentWorkflow,
    generateHTMLExample
  };
}

// Run demo if called directly
if (typeof require !== 'undefined' && require.main === module) {
  demonstratePaymentWorkflow();
}
