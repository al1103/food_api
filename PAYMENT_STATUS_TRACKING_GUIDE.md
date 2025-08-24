# 📱 Hướng dẫn theo dõi trạng thái thanh toán sau khi quét QR

## ❓ Vấn đề

**"Khi quét mã QR xong làm sao để biết đã thanh toán chưa?"**

Đây là vấn đề quan trọng trong payment flow. User quét QR code, thanh toán, nhưng app làm sao biết được?

## 🔄 Workflow hoàn chỉnh

```
1. User click "Thanh toán"
   ↓
2. App gọi API tạo payment → Nhận QR code
   ↓
3. App hiển thị QR code cho user
   ↓
4. App bắt đầu POLLING kiểm tra payment status
   ↓
5. User quét QR bằng ZaloPay app → Thanh toán
   ↓
6. ZaloPay cập nhật payment status trong database
   ↓
7. App polling phát hiện payment completed
   ↓
8. App cập nhật UI → Chuyển sang trang success
```

## 🛠️ Solution đã implement

### 1. **Payment Status API** (Đã có sẵn)

```javascript
GET /api/payment/check-status/:app_trans_id
Headers: { "Authorization": "Bearer JWT_TOKEN" }

// Response khi chưa thanh toán
{
  "status": "success",
  "data": { "return_code": 0 }  // 0 = pending
}

// Response khi đã thanh toán
{
  "status": "success",
  "data": { "return_code": 1 }  // 1 = completed
}
```

### 2. **Frontend Polling Mechanism**

```javascript
// Sử dụng PaymentStatusPoller class
const poller = new PaymentStatusPoller({
  pollInterval: 3000, // Check mỗi 3 giây
  maxAttempts: 60, // Tối đa 3 phút

  onSuccess: (data) => {
    // Payment thành công!
    showSuccessMessage();
    redirectToSuccessPage();
  },

  onTimeout: () => {
    // Quá thời gian chờ
    showTimeoutMessage();
  },
});

// Bắt đầu polling sau khi tạo payment
poller.startPolling(app_trans_id, jwt_token);
```

### 3. **Payment Completion Simulator** (Cho testing)

```bash
# Simulate user đã thanh toán xong
node simulate_payment_completion.js 231207_123456

# Hoặc simulate payment mới nhất
node simulate_payment_completion.js latest

# List các payment đang pending
node simulate_payment_completion.js list
```

## 🧪 Testing Workflow

### Step 1: Tạo payment

```bash
# Postman hoặc API call
POST /api/payment/create-payment
{
  "order_id": 1,
  "amount": 50000,
  "payment_method": "zalopay"
}

# Response sẽ có app_trans_id
{
  "app_trans_id": "231207_123456",
  "qr_code": "data:image/png;base64,...",
  ...
}
```

### Step 2: Start polling (Frontend)

```javascript
// Trong frontend JavaScript
const poller = new PaymentStatusPoller({
  onStatusChange: (data) => {
    console.log("Checking payment...", data);
  },
  onSuccess: (data) => {
    alert("Thanh toán thành công!");
    window.location.href = "/success";
  },
});

poller.startPolling("231207_123456", "your_jwt_token");
```

### Step 3: Simulate payment completion

```bash
# Trong terminal khác, simulate user đã thanh toán
node simulate_payment_completion.js 231207_123456
```

### Step 4: Observe polling

```
🔍 Checking payment status (attempt 1/60)
🔍 Checking payment status (attempt 2/60)
🔍 Checking payment status (attempt 3/60)
✅ Payment completed!
🎉 Payment successful!
```

## 📱 Frontend Integration

### HTML Example:

```html
<div class="payment-container">
  <div class="qr-code">
    <img id="qr-image" src="QR_CODE_DATA_URL" />
    <p>Quét mã QR để thanh toán</p>
  </div>

  <div id="payment-status" class="status checking">
    <span id="status-text">Đang chờ thanh toán...</span>
    <div class="spinner">⏳</div>
  </div>
</div>
```

### JavaScript Integration:

```javascript
// Sau khi tạo payment thành công
function handlePaymentCreated(paymentResponse) {
  // 1. Hiển thị QR code
  document.getElementById("qr-image").src = paymentResponse.qr_code;

  // 2. Bắt đầu polling
  const poller = new PaymentStatusPoller({
    onSuccess: (data) => {
      document.getElementById("status-text").textContent =
        "Thanh toán thành công!";
      setTimeout(() => {
        window.location.href = "/payment-success";
      }, 2000);
    },
    onTimeout: () => {
      document.getElementById("status-text").textContent =
        "Timeout. Vui lòng thử lại.";
    },
  });

  poller.startPolling(
    paymentResponse.app_trans_id,
    localStorage.getItem("jwt_token")
  );
}
```

## 🔧 Advanced Features

### 1. **Real-time với WebSocket** (Optional)

```javascript
// Thay vì polling, có thể dùng WebSocket
const socket = io();
socket.emit("watch_payment", app_trans_id);
socket.on("payment_completed", (data) => {
  handlePaymentSuccess(data);
});
```

### 2. **Background Polling** (Mobile App)

```javascript
// Cho mobile app, polling ngay cả khi app ở background
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/payment-worker.js");
}
```

### 3. **Retry Logic**

```javascript
const poller = new PaymentStatusPoller({
  pollInterval: 3000,
  maxAttempts: 60,
  retryOnError: true, // Retry khi có network error
  exponentialBackoff: true, // Tăng dần interval khi lỗi
});
```

## 📊 Database Schema

Payment tracking cần các bảng:

```sql
-- Bảng payments (đã có)
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  app_trans_id VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng payment_transactions (đã có)
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(payment_id),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚨 Production Considerations

### 1. **Rate Limiting**

```javascript
// Giới hạn polling frequency
const poller = new PaymentStatusPoller({
  pollInterval: Math.max(3000, userTier * 1000), // VIP user poll nhanh hơn
  maxAttempts: 100,
});
```

### 2. **Error Handling**

```javascript
const poller = new PaymentStatusPoller({
  onError: (error) => {
    // Log error cho monitoring
    analytics.track("payment_polling_error", error);

    // Show user-friendly message
    showErrorMessage("Đang kiểm tra thanh toán...");
  },
});
```

### 3. **Analytics**

```javascript
const poller = new PaymentStatusPoller({
  onStatusChange: (data) => {
    analytics.track("payment_status_check", {
      app_trans_id: data.app_trans_id,
      attempt: poller.currentAttempt,
    });
  },

  onSuccess: (data) => {
    analytics.track("payment_completed", {
      app_trans_id: data.app_trans_id,
      total_attempts: poller.currentAttempt,
      duration: Date.now() - poller.startTime,
    });
  },
});
```

## 📋 Files Created

1. **`simulate_payment_completion.js`**

   - Tool để simulate payment completion
   - List pending payments
   - Update database status

2. **`payment_status_polling.js`**

   - PaymentStatusPoller class
   - Frontend polling logic
   - HTML integration example

3. **`PAYMENT_STATUS_TRACKING_GUIDE.md`**
   - Complete documentation
   - Testing workflow
   - Production considerations

## 🎯 Quick Start

### 1. Test complete workflow:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Create payment via Postman
# Copy app_trans_id from response

# Terminal 3: Start polling (in browser console)
const poller = new PaymentStatusPoller({
  onSuccess: () => alert('Payment completed!')
});
poller.startPolling('YOUR_APP_TRANS_ID', 'YOUR_JWT_TOKEN');

# Terminal 4: Simulate completion
node simulate_payment_completion.js YOUR_APP_TRANS_ID
```

### 2. Integrate vào frontend:

```javascript
// Sau khi user click "Thanh toán"
async function handlePayment() {
  // 1. Tạo payment
  const payment = await createPayment(orderData);

  // 2. Hiển thị QR
  showQRCode(payment.qr_code);

  // 3. Bắt đầu polling
  startPaymentPolling(payment.app_trans_id);
}
```

## 💡 Pro Tips

1. **UX**: Hiển thị countdown timer cho user biết còn bao lâu timeout
2. **Performance**: Dùng exponential backoff khi có lỗi network
3. **Analytics**: Track polling metrics để optimize interval
4. **Fallback**: Có button "Kiểm tra lại" nếu polling fail
5. **Mobile**: Handle app đi vào background/foreground

Bây giờ bạn có complete solution để track payment status sau khi user quét QR! 🎉
