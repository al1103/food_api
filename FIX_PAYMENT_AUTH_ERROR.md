# 🔧 Fix Lỗi Authentication trong Payment API

## ❌ Lỗi gặp phải

```
Payment creation error: TypeError: Cannot read properties of undefined (reading 'userId')
    at C:\Users\phamt\food_api\routes\paymentRoutes.js:39:30
```

## 🔍 Nguyên nhân

Route `/create-payment` trong `paymentRoutes.js` thiếu middleware `auth`, dẫn đến `req.user` là `undefined`.

## ✅ Giải pháp đã áp dụng

### 1. Thêm middleware `auth` vào route

**Trước:**

```javascript
router.post("/create-payment", async (req, res) => {
```

**Sau:**

```javascript
router.post("/create-payment", auth, async (req, res) => {
```

### 2. Kiểm tra các routes khác

Tất cả routes trong `paymentRoutes.js` hiện tại:

- ✅ `POST /create-payment` - có `auth` middleware
- ✅ `GET /check-status/:app_trans_id` - có `auth` middleware
- ✅ `POST /callback` - KHÔNG có `auth` (đúng, vì là webhook từ ZaloPay)
- ✅ `POST /admin/confirm-payment/:order_id` - có `auth` middleware

## 🧪 Test để verify fix

Chạy script test:

```bash
node test_payment_api.js
```

Hoặc test manual với Postman:

### Test 1: Không có token (should return 401)

```
POST /api/payment/create-payment
Body: {
  "order_id": 1,
  "amount": 50000,
  "payment_method": "zalopay"
}
```

### Test 2: Có token hợp lệ (should work)

```
POST /api/payment/create-payment
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
Body: {
  "order_id": 1,
  "amount": 50000,
  "payment_method": "zalopay"
}
```

## 📋 Checklist sau khi fix

- [x] Thêm `auth` middleware vào route `/create-payment`
- [x] Kiểm tra các routes khác có middleware phù hợp
- [x] Verify route `/callback` KHÔNG có auth (đúng cho webhook)
- [x] Test API với và không có token
- [x] Cập nhật Postman collection nếu cần

## 🚨 Lưu ý quan trọng

1. **Route `/callback`** KHÔNG được thêm middleware `auth` vì đây là webhook từ ZaloPay
2. **JWT Token** cần được gửi trong header `Authorization: Bearer <token>`
3. **Database connection** cần hoạt động để middleware `auth` có thể query user info
4. **Environment variable** `JWT_SECRET_KEY` cần được set đúng

## 🔄 Nếu vẫn gặp lỗi

### Kiểm tra JWT Secret

```bash
echo $JWT_SECRET_KEY
# hoặc trong .env file
cat .env | grep JWT_SECRET_KEY
```

### Kiểm tra database connection

```javascript
// Test trong node console
const { pool } = require("./config/database");
pool.query("SELECT NOW()", (err, res) => {
  console.log(err ? err : res.rows[0]);
});
```

### Kiểm tra user tồn tại

```sql
SELECT user_id, username, email, role FROM users LIMIT 5;
```

## 📝 Files đã thay đổi

1. `routes/paymentRoutes.js` - Thêm `auth` middleware
2. `test_payment_api.js` - Script test mới
3. `FIX_PAYMENT_AUTH_ERROR.md` - File hướng dẫn này
