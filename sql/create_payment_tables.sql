-- Create payments table for ZaloPay integration
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

-- Create payment_transactions table for logging
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_app_trans_id ON payments(app_trans_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_app_trans_id ON payment_transactions(app_trans_id);

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores payment information for orders';
COMMENT ON TABLE payment_transactions IS 'Logs all payment transaction attempts and results';
COMMENT ON COLUMN payments.app_trans_id IS 'ZaloPay app transaction ID';
COMMENT ON COLUMN payments.zp_trans_id IS 'ZaloPay transaction ID from callback';
COMMENT ON COLUMN payments.callback_data IS 'Raw callback data from ZaloPay';
COMMENT ON COLUMN payments.admin_confirmed IS 'Whether payment was manually confirmed by admin'; 