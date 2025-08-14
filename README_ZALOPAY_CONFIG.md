# Hướng dẫn cấu hình ZaloPay

## Cấu hình hiện tại

Ứng dụng đã được cấu hình để sử dụng **Sandbox Environment** của ZaloPay để test.

## File cấu hình

Cấu hình ZaloPay được lưu trong file: `config/zalopay.js`

## Các thông số cần thiết

### 1. App ID
- **Sandbox**: `2554` (đã có sẵn)
- **Production**: Thay bằng App ID thật từ ZaloPay

### 2. Key1 và Key2
- **Sandbox**: Đã có sẵn (chỉ dùng để test)
- **Production**: Thay bằng Key thật từ ZaloPay

### 3. Endpoints
- **Sandbox**: `https://sb-openapi.zalopay.vn/v2/create`
- **Production**: `https://openapi.zalopay.vn/v2/create`

### 4. Callback URL
- Thay `https://your-domain.com/api/payments/callback` bằng URL thật của bạn
- URL này sẽ nhận kết quả thanh toán từ ZaloPay

### 5. Return URL
- Thay `https://your-domain.com/payment-success` bằng URL thật của bạn
- URL này sẽ chuyển hướng user sau khi thanh toán

## Cách thay đổi cấu hình

### 1. Chuyển sang Production
```javascript
// Trong config/zalopay.js
current: "production" // Thay đổi từ "sandbox" sang "production"
```

### 2. Cập nhật thông số Production
```javascript
production: {
  app_id: "YOUR_REAL_APP_ID",
  key1: "YOUR_REAL_KEY1", 
  key2: "YOUR_REAL_KEY2",
  // ... các thông số khác
}
```

### 3. Cập nhật URLs
```javascript
callback_url: "https://your-real-domain.com/api/payments/callback",
default_return_url: "https://your-real-domain.com/payment-success"
```

## Lưu ý quan trọng

1. **Không commit Key thật lên Git** - sử dụng environment variables
2. **Test kỹ trên Sandbox** trước khi chuyển Production
3. **Cập nhật Callback URL** trong ZaloPay Dashboard
4. **Kiểm tra SSL certificate** cho Production URLs

## Test

1. Đặt hàng từ mobile app
2. Chọn thanh toán ZaloPay
3. Kiểm tra QR code và deep link
4. Test callback từ ZaloPay

## Troubleshooting

### Lỗi "Failed to get payment settings"
- Kiểm tra file `config/zalopay.js` có tồn tại không
- Kiểm tra syntax JavaScript

### Lỗi "Invalid MAC signature"
- Kiểm tra Key1, Key2 có đúng không
- Kiểm tra thứ tự tạo MAC signature

### Lỗi "App ID not found"
- Kiểm tra App ID có đúng không
- Kiểm tra App có được kích hoạt trong ZaloPay Dashboard không 