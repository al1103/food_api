# 🔧 Fix ZaloPay API Failed Issue

## ❌ Vấn đề hiện tại

```
⚠️ ZaloPay API failed, using mock response for testing
```

## 🔍 Nguyên nhân

ZaloPay API trả về `return_code !== 1`, khiến hệ thống fallback sang mock response. Có thể do:

1. **Callback URL không accessible** từ ZaloPay servers
2. **Cấu hình ZaloPay không đúng** (App ID, Keys)
3. **Network/Firewall issues**
4. **ZaloPay sandbox có vấn đề tạm thời**

## 🧪 Debug vấn đề

### 1. Chạy script debug

```bash
node debug_zalopay_api.js
```

Script này sẽ:

- ✅ Kiểm tra cấu hình ZaloPay
- ✅ Test API call thực tế
- ✅ Phân tích response và error codes
- ✅ Kiểm tra callback URL accessibility

### 2. Kiểm tra logs chi tiết

Trong `paymentRoutes.js`, debug logs sẽ hiển thị:

```
🔍 ZaloPay Request Debug:
Config: { app_id: '2554', key1: 'PcY4iZIKFC...' }
Order data: { ... }
MAC data string: 2554|231207_123456|test_user|50000|...
Generated MAC: abc123def456...
```

## ✅ Các giải pháp

### 1. Fix Callback URL (Nguyên nhân phổ biến nhất)

**Vấn đề:** ZaloPay không thể access `http://localhost:3000/api/payments/callback`

**Giải pháp A: Sử dụng ngrok**

```bash
# Cài ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Cập nhật callback_url trong config/zalopay.js
callback_url: "https://abc123.ngrok.io/api/payment/callback"
```

**Giải pháp B: Sử dụng webhook.site (temporary)**

```javascript
// Trong config/zalopay.js
callback_url: "https://webhook.site/your-unique-url";
```

**Giải pháp C: Deploy lên server public**

```javascript
// Trong config/zalopay.js
callback_url: "https://your-domain.com/api/payment/callback";
```

### 2. Kiểm tra cấu hình ZaloPay

**Verify App ID và Keys:**

```javascript
// config/zalopay.js
sandbox: {
  app_id: "2554", // ✅ Đúng cho sandbox
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL", // ✅ Đúng cho sandbox
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz", // ✅ Đúng cho sandbox
}
```

### 3. Fix MAC signature generation

**Kiểm tra thứ tự MAC data:**

```javascript
// Đúng theo ZaloPay docs
const mac_data = `${app_id}|${app_trans_id}|${app_user}|${amount}|${app_time}|${embed_data}|${item}`;
const mac = CryptoJS.HmacSHA256(mac_data, key1).toString();
```

### 4. Network troubleshooting

**Test connectivity:**

```bash
# Test ZaloPay endpoint
curl -I https://sb-openapi.zalopay.vn/v2/create

# Check firewall/proxy
ping sb-openapi.zalopay.vn
```

## ✅ Mock Response đã được xóa

Logic mock response đã được xóa khỏi code. Bây giờ API sẽ:

- ✅ Trả về lỗi thật khi ZaloPay API fail
- ✅ Hiển thị error code và message từ ZaloPay
- ✅ Không tạo payment record nếu ZaloPay fail
- ✅ Buộc phải fix callback URL để hoạt động

## 📋 Checklist khắc phục

### Immediate fixes:

- [ ] Chạy `node debug_zalopay_api.js` để identify exact error
- [ ] Setup ngrok hoặc public callback URL
- [ ] Cập nhật `callback_url` trong config
- [ ] Test lại API

### Long-term fixes:

- [ ] Deploy app lên server có public IP
- [ ] Cấu hình domain và SSL cho callback URL
- [ ] Đăng ký production ZaloPay credentials
- [ ] Setup monitoring cho ZaloPay API calls

## 🔄 Test sau khi fix

### 1. Test API trực tiếp

```bash
node debug_zalopay_api.js
```

### 2. Test qua Postman

```
POST /api/payment/create-payment
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "order_id": 1,
  "amount": 50000,
  "payment_method": "zalopay"
}
```

### 3. Kiểm tra response

Response thành công sẽ có:

```json
{
  "status": "success",
  "order_url": "https://sb-openapi.zalopay.vn/v2/pay?...",
  "qr_code": "data:image/png;base64,...",
  "payment_id": 123,
  "app_trans_id": "231207_123456"
}
```

**Nếu ZaloPay API fail, sẽ trả về lỗi:**

```json
{
  "status": "error",
  "message": "ZaloPay payment creation failed",
  "error_code": -7,
  "error_message": "Callback URL không hợp lệ",
  "zalopay_response": { ... }
}
```

## 📝 Common Error Codes

| Code | Meaning                   | Solution                        |
| ---- | ------------------------- | ------------------------------- |
| -1   | Lỗi hệ thống              | Retry sau vài phút              |
| -2   | Merchant không tồn tại    | Kiểm tra App ID                 |
| -3   | Token không hợp lệ        | Kiểm tra MAC signature          |
| -4   | Số tiền không hợp lệ      | Kiểm tra amount > 0             |
| -5   | MAC không hợp lệ          | Kiểm tra Key1 và MAC generation |
| -6   | App Trans ID đã tồn tại   | Tạo app_trans_id mới            |
| -7   | Callback URL không hợp lệ | Fix callback URL accessibility  |
| -8   | Thông tin không đầy đủ    | Kiểm tra required fields        |

## 💡 Pro Tips

1. **Development:** Dùng ngrok cho callback URL
2. **Testing:** Dùng webhook.site để debug callbacks
3. **Production:** Dùng domain có SSL certificate
4. **Monitoring:** Log tất cả ZaloPay API responses
5. **Fallback:** Giữ mock response logic cho emergency cases
