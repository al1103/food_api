-- Create database if not exists
CREATE DATABASE food_db;
\c food_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS order_details CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone_number VARCHAR(20),
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(user_id),
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification_codes table
CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expiration_time TIMESTAMP NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES users(user_id),
  referred_id UUID REFERENCES users(user_id),
  commission DECIMAL(10,2) NOT NULL,
  statusCode VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  reference_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tables table
CREATE TABLE tables (
  table_id SERIAL PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  capacity INTEGER NOT NULL,
  statusCode VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create dishes table
CREATE TABLE dishes (
  dish_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0.00,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  statusCode VARCHAR(20) DEFAULT 'pending',
  table_id INTEGER REFERENCES tables(table_id),
  order_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order_details table
CREATE TABLE order_details (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
  dish_id INTEGER REFERENCES dishes(dish_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  special_requests VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE reservations (
  reservation_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  table_id INTEGER REFERENCES tables(table_id),
  reservation_time TIMESTAMP NOT NULL,
  party_size INTEGER NOT NULL,
  statusCode VARCHAR(20) DEFAULT 'pending',
  customer_name VARCHAR(100),
  phone_number VARCHAR(20),
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data

-- Insert users
INSERT INTO users (user_id, username, email, password, full_name, phone_number, referral_code, wallet_balance, created_at, updated_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'admin@example.com', 'Admin123', 'Admin User', '0123456789', 'ADMIN123', 100000.00, NOW(), NOW()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'customer1', 'customer1@example.com', 'Customer1', 'Customer One', '0987654321', 'CUST0001', 50000.00, NOW(), NOW()),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'customer2', 'customer2@example.com', 'Customer2', 'Customer Two', '0987123456', 'CUST0002', 25000.00, NOW(), NOW()),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'staff1', 'staff1@example.com', 'Staff123', 'Staff One', '0123789456', 'STAFF001', 0.00, NOW(), NOW());

-- Insert tables
INSERT INTO tables (table_number, capacity, statusCode, created_at, updated_at)
VALUES
  (1, 2, 'available', NOW(), NOW()),
  (2, 4, 'available', NOW(), NOW()),
  (3, 6, 'available', NOW(), NOW()),
  (4, 8, 'available', NOW(), NOW()),
  (5, 2, 'available', NOW(), NOW()),
  (6, 4, 'available', NOW(), NOW()),
  (7, 6, 'available', NOW(), NOW()),
  (8, 8, 'reserved', NOW(), NOW()),
  (9, 10, 'available', NOW(), NOW()),
  (10, 12, 'available', NOW(), NOW());

-- Insert dishes
INSERT INTO dishes (name, description, price, image_url, rating, category, created_at, updated_at)
VALUES
  ('Phở Bò', 'Soup with rice noodles and beef', 75000.00, 'https://example.com/images/pho.jpg', 4.8, 'Noodles', NOW(), NOW()),
  ('Bún Chả', 'Grilled pork with rice noodles', 65000.00, 'https://example.com/images/buncha.jpg', 4.7, 'Noodles', NOW(), NOW()),
  ('Bún Bò Huế', 'Spicy beef noodle soup from Hue', 70000.00, 'https://example.com/images/bunbo.jpg', 4.6, 'Noodles', NOW(), NOW()),
  ('Cơm Tấm', 'Broken rice with grilled pork', 60000.00, 'https://example.com/images/comtam.jpg', 4.5, 'Rice', NOW(), NOW()),
  ('Gỏi Cuốn', 'Fresh spring rolls with shrimp', 45000.00, 'https://example.com/images/goicuon.jpg', 4.4, 'Appetizers', NOW(), NOW()),
  ('Chả Giò', 'Fried spring rolls', 50000.00, 'https://example.com/images/chagio.jpg', 4.3, 'Appetizers', NOW(), NOW()),
  ('Cá Kho Tộ', 'Caramelized fish in clay pot', 85000.00, 'https://example.com/images/cakho.jpg', 4.7, 'Main Course', NOW(), NOW()),
  ('Thịt Kho Tàu', 'Caramelized pork with eggs', 80000.00, 'https://example.com/images/thitkho.jpg', 4.6, 'Main Course', NOW(), NOW()),
  ('Gà Nướng', 'Grilled chicken with lemongrass', 90000.00, 'https://example.com/images/ganuong.jpg', 4.8, 'Main Course', NOW(), NOW()),
  ('Cơm Chiên Dương Châu', 'Yangzhou fried rice', 65000.00, 'https://example.com/images/comchien.jpg', 4.4, 'Rice', NOW(), NOW()),
  ('Chè Ba Màu', 'Three color dessert', 35000.00, 'https://example.com/images/chebamau.jpg', 4.2, 'Desserts', NOW(), NOW()),
  ('Trà Đá', 'Iced tea', 10000.00, 'https://example.com/images/trada.jpg', 4.0, 'Beverages', NOW(), NOW()),
  ('Cà Phê Sữa Đá', 'Vietnamese iced coffee with condensed milk', 25000.00, 'https://example.com/images/cafe.jpg', 4.9, 'Beverages', NOW(), NOW()),
  ('Sinh Tố Bơ', 'Avocado smoothie', 30000.00, 'https://example.com/images/sinhto.jpg', 4.7, 'Beverages', NOW(), NOW()),
  ('Bánh Flan', 'Vietnamese caramel custard', 30000.00, 'https://example.com/images/banhflan.jpg', 4.5, 'Desserts', NOW(), NOW());

-- Insert orders
INSERT INTO orders (user_id, total_price, statusCode, table_id, order_date, created_at, updated_at)
VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 210000.00, 'completed', 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 175000.00, 'completed', 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 300000.00, 'completed', 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 155000.00, 'in-progress', 4, NOW(), NOW(), NOW()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 140000.00, 'pending', 5, NOW(), NOW(), NOW());

-- Insert order details
INSERT INTO order_details (order_id, dish_id, quantity, price, special_requests, created_at)
VALUES
  (1, 1, 2, 75000.00, 'Extra noodles', NOW() - INTERVAL '3 days'),
  (1, 5, 1, 45000.00, NULL, NOW() - INTERVAL '3 days'),
  (1, 13, 1, 25000.00, 'Less sugar', NOW() - INTERVAL '3 days'),
  (2, 2, 1, 65000.00, NULL, NOW() - INTERVAL '2 days'),
  (2, 4, 1, 60000.00, 'Extra fish sauce', NOW() - INTERVAL '2 days'),
  (2, 14, 1, 30000.00, NULL, NOW() - INTERVAL '2 days'),
  (2, 11, 1, 35000.00, NULL, NOW() - INTERVAL '2 days'),
  (3, 7, 2, 85000.00, 'Spicy', NOW() - INTERVAL '1 day'),
  (3, 10, 1, 65000.00, NULL, NOW() - INTERVAL '1 day'),
  (3, 13, 2, 25000.00, NULL, NOW() - INTERVAL '1 day'),
  (4, 3, 1, 70000.00, 'Less spicy', NOW()),
  (4, 6, 1, 50000.00, NULL, NOW()),
  (4, 12, 2, 10000.00, NULL, NOW()),
  (4, 15, 1, 30000.00, NULL, NOW()),
  (5, 9, 1, 90000.00, 'Well done', NOW()),
  (5, 14, 1, 30000.00, 'Extra sweet', NOW()),
  (5, 12, 2, 10000.00, NULL, NOW());

-- Insert reservations
INSERT INTO reservations (user_id, table_id, reservation_time, party_size, statusCode, customer_name, phone_number, special_requests, created_at, updated_at)
VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 8, NOW() + INTERVAL '1 day', 8, 'confirmed', 'Customer One', '0987654321', 'Birthday celebration', NOW(), NOW()),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 3, NOW() + INTERVAL '2 days', 6, 'pending', 'Customer Two', '0987123456', 'Window seat preferred', NOW(), NOW()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 5, NOW() + INTERVAL '3 days', 2, 'pending', 'Customer One', '0987654321', NULL, NOW(), NOW()),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 10, NOW() + INTERVAL '5 days', 10, 'confirmed', 'Customer Two', '0987123456', 'Business dinner', NOW(), NOW());

-- Insert referrals
INSERT INTO referrals (referrer_id, referred_id, commission, statusCode, created_at, updated_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 50000.00, 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 50000.00, 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 50000.00, 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');

-- Insert wallet transactions
INSERT INTO wallet_transactions (user_id, amount, transaction_type, reference_id, description, created_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 50000.00, 'credit', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Hoa hồng giới thiệu người dùng Customer One', NOW() - INTERVAL '30 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 50000.00, 'credit', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Hoa hồng giới thiệu người dùng Staff One', NOW() - INTERVAL '7 days'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 50000.00, 'credit', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Hoa hồng giới thiệu người dùng Customer Two', NOW() - INTERVAL '15 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 50000.00, 'withdrawal', NULL, 'Rút tiền đến tài khoản: Vietcombank - 123456789', NOW() - INTERVAL '5 days');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_dishes_category ON dishes(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(statusCode);
CREATE INDEX idx_order_details_order_id ON order_details(order_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_reservation_time ON reservations(reservation_time);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tables_timestamp BEFORE UPDATE ON tables
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_dishes_timestamp BEFORE UPDATE ON dishes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_reservations_timestamp BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_referrals_timestamp BEFORE UPDATE ON referrals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create view for order details with dish information
CREATE VIEW order_items_view AS
SELECT 
  od.id,
  od.order_id,
  o.user_id,
  od.id,
  d.name AS dish_name,
  d.category AS dish_category,
  od.quantity,
  od.price,
  od.price * od.quantity AS subtotal,
  od.special_requests,
  od.created_at
FROM order_details od
JOIN orders o ON od.order_id = o.order_id
JOIN dishes d ON od.id = d.id;

