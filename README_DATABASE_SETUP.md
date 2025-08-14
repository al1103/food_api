# Hướng dẫn Setup Database cho ZaloPay

## Vấn đề hiện tại

Ứng dụng đang gặp lỗi vì thiếu các bảng cần thiết cho tích hợp ZaloPay:
- `payments` - lưu thông tin thanh toán
- `payment_transactions` - log các giao dịch thanh toán

## Giải pháp

### 1. **Tạo bảng payments**

Chạy SQL script: `sql/create_payment_tables.sql`

```sql
-- Tạo bảng payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'zalopay',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  app_trans_id VARCHAR(100) UNIQUE,
  zp_trans_id VARCHAR(100),
  redirect_url VARCHAR(255),
  callback_data JSONB,
  admin_confirmed BOOLEAN DEFAULT FALSE,
  admin_confirmed_at TIMESTAMP,
  admin_confirmed_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **Tạo bảng payment_transactions**

```sql
-- Tạo bảng payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(payment_id) ON DELETE CASCADE,
  app_trans_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  return_code INTEGER,
  return_message TEXT,
  status VARCHAR(20) NOT NULL,
  transaction_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Tạo indexes cho performance**

```sql
-- Indexes cho bảng payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_app_trans_id ON payments(app_trans_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Indexes cho bảng payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_app_trans_id ON payment_transactions(app_trans_id);
```

## Cách thực hiện

### **Option 1: Chạy SQL script trực tiếp**

```bash
# Connect vào database
psql -h localhost -U postgres -d food_db

# Chạy script
\i sql/create_payment_tables.sql
```

### **Option 2: Copy và paste từng câu lệnh**

1. Mở pgAdmin hoặc psql
2. Copy từng câu lệnh CREATE TABLE
3. Paste và execute

### **Option 3: Sử dụng migration tool**

Nếu project có migration tool, tạo migration file:

```javascript
// migrations/create_payment_tables.js
exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    // ... table definition
  });
};
```

## Kiểm tra sau khi tạo

### **1. Verify tables exist**

```sql
-- Kiểm tra bảng payments
\d payments

-- Kiểm tra bảng payment_transactions  
\d payment_transactions
```

### **2. Test insert**

```sql
-- Test insert vào bảng payments
INSERT INTO payments (order_id, user_id, amount, payment_method, status)
VALUES (1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 100000, 'zalopay', 'pending');

-- Test insert vào bảng payment_transactions
INSERT INTO payment_transactions (payment_id, app_trans_id, amount, status)
VALUES (1, 'TEST_001', 100000, 'pending');
```

## Cấu trúc bảng

### **Bảng payments**
- `payment_id`: ID duy nhất của payment
- `order_id`: Tham chiếu đến đơn hàng
- `user_id`: Tham chiếu đến user
- `amount`: Số tiền thanh toán
- `payment_method`: Phương thức thanh toán (zalopay, direct, etc.)
- `status`: Trạng thái thanh toán (pending, completed, failed)
- `app_trans_id`: ID giao dịch từ ZaloPay
- `zp_trans_id`: ID giao dịch ZaloPay (từ callback)
- `callback_data`: Dữ liệu callback từ ZaloPay (JSON)

### **Bảng payment_transactions**
- `id`: ID duy nhất của transaction log
- `payment_id`: Tham chiếu đến payment
- `app_trans_id`: ID giao dịch từ ZaloPay
- `amount`: Số tiền giao dịch
- `return_code`: Mã trả về từ ZaloPay
- `return_message`: Thông báo trả về từ ZaloPay
- `status`: Trạng thái giao dịch
- `transaction_data`: Dữ liệu giao dịch chi tiết (JSON)

## Lưu ý quan trọng

1. **Backup database** trước khi thay đổi schema
2. **Test trên development** trước khi deploy production
3. **Kiểm tra foreign key constraints** có đúng không
4. **Verify indexes** được tạo thành công

## Troubleshooting

### **Lỗi "relation does not exist"**
- Kiểm tra tên bảng có đúng không
- Kiểm tra schema có đúng không
- Kiểm tra user có quyền tạo bảng không

### **Lỗi "foreign key constraint"**
- Kiểm tra bảng tham chiếu có tồn tại không
- Kiểm tra kiểu dữ liệu có khớp không
- Kiểm tra dữ liệu có vi phạm constraint không

### **Lỗi "permission denied"**
- Kiểm tra user có quyền CREATE TABLE không
- Kiểm tra user có quyền INSERT không
- Kiểm tra user có quyền CREATE INDEX không 