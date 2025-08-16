# Hướng dẫn Test Payment APIs với Postman

## 📋 Mô tả

Collection này chứa các test case để kiểm tra tất cả API endpoints trong `paymentRoutes.js` của Food API system.

## 📁 Files

- `Payment_APIs_Test.postman_collection.json` - Postman collection chính
- `Payment_APIs_Environment.postman_environment.json` - Environment variables
- `PAYMENT_API_TESTING_GUIDE.md` - Hướng dẫn này

## 🚀 Cách sử dụng

### 1. Import vào Postman

1. Mở Postman
2. Click **Import** → **Upload Files**
3. Chọn file `Payment_APIs_Test.postman_collection.json`
4. Import tiếp file `Payment_APIs_Environment.postman_environment.json`
5. Chọn environment "Payment APIs Environment" ở góc phải trên

### 2. Chuẩn bị dữ liệu test

#### Cập nhật Environment Variables:

- `base_url`: URL của API server (mặc định: `http://localhost:3000`)
- `test_order_id`: ID của order có sẵn trong database để test

#### Cần có sẵn trong database:

1. **User account** để login:

   ```sql
   -- Ví dụ user cho test
   INSERT INTO users (email, password, ...) VALUES ('user@example.com', 'hashed_password', ...);
   ```

2. **Admin account** để test admin functions:

   ```sql
   -- Ví dụ admin cho test
   INSERT INTO admins (email, password, role, ...) VALUES ('admin@example.com', 'hashed_password', 'admin', ...);
   ```

3. **Order** để test payment:
   ```sql
   -- Ví dụ order cho test
   INSERT INTO orders (order_id, user_id, total_price, status, ...) VALUES (1, 'user_uuid', 100000, 'pending', ...);
   ```

### 3. Chạy tests

#### Option 1: Chạy từng request

1. Bắt đầu với folder **Authentication** để lấy JWT tokens
2. Chạy các request trong các folder khác

#### Option 2: Chạy toàn bộ collection

1. Click vào collection name → **Run**
2. Chọn tất cả requests hoặc folders cần test
3. Click **Run Payment APIs Test Collection**

## 📊 Cấu trúc Collection

### 1. Authentication

- **Login để lấy JWT Token** - Login user và lưu token
- **Admin Login để lấy Admin Token** - Login admin và lưu token

### 2. Payment - ZaloPay

- **Tạo thanh toán ZaloPay** - Test tạo payment với ZaloPay
- **Tạo thanh toán ZaloPay - Số tiền vượt quá** - Test validation
- **Tạo thanh toán ZaloPay - Thiếu thông tin** - Test validation

### 3. Payment - Direct

- **Tạo thanh toán Direct** - Test thanh toán từ ví điện tử

### 4. Payment Status

- **Kiểm tra trạng thái thanh toán** - Check payment status
- **Kiểm tra trạng thái - App Trans ID không tồn tại** - Test edge case

### 5. ZaloPay Callback

- **ZaloPay Callback - Successful Payment** - Test webhook success
- **ZaloPay Callback - Invalid MAC** - Test webhook security

### 6. Admin Operations

- **Admin xác nhận thanh toán** - Test admin confirm payment
- **Admin xác nhận - Không có quyền** - Test authorization
- **Admin xác nhận - Order không tồn tại** - Test validation

### 7. Unauthorized Tests

- **Tạo thanh toán - Không có token** - Test authentication
- **Kiểm tra trạng thái - Token không hợp lệ** - Test authorization

## 🧪 Test Cases Coverage

### ✅ API Endpoints được test:

- `POST /api/payment/create-payment` (ZaloPay & Direct)
- `GET /api/payment/check-status/:app_trans_id`
- `POST /api/payment/callback`
- `POST /api/payment/admin/confirm-payment/:order_id`

### ✅ Scenarios được test:

- ✅ Happy path - tạo payment thành công
- ✅ Validation errors - thiếu thông tin, số tiền không hợp lệ
- ✅ Authentication & Authorization - missing/invalid tokens
- ✅ Business logic - thanh toán trực tiếp từ ví
- ✅ ZaloPay integration - callback handling
- ✅ Admin operations - confirm payment
- ✅ Edge cases - order không tồn tại, MAC signature validation

### ✅ Response validation:

- Status codes (200, 400, 401, 403, 404, 500)
- Response structure validation
- Required fields validation
- Business data validation

## 🔧 Customization

### Thêm test cases mới:

1. Duplicate existing request
2. Modify request body/params
3. Update test scripts trong **Tests** tab

### Environment cho môi trường khác:

```json
{
  "base_url": "https://api.production.com",
  "test_order_id": "real_order_id"
}
```

## 📝 Notes

### ZaloPay Testing:

- API có thể return mock response nếu ZaloPay API thất bại
- Callback test sử dụng mock data do không có real ZaloPay event

### Database Dependencies:

- Tests cần data có sẵn trong database
- Một số tests có thể modify data (tạo payments, update orders)

### Authentication:

- JWT tokens được auto-save vào environment sau login
- Tokens có thể expire, cần login lại nếu test fail với 401

## 🚨 Troubleshooting

### Common Issues:

1. **401 Unauthorized**

   - Chạy login requests trước
   - Check JWT token trong environment

2. **404 Order not found**

   - Update `test_order_id` với order ID có thật trong database

3. **Database errors**

   - Check database connection
   - Verify required data exists

4. **ZaloPay API errors**
   - Check ZaloPay configuration trong `config/zalopay.js`
   - API sẽ fallback to mock response nếu ZaloPay fail
