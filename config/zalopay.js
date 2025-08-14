// ZaloPay Configuration
module.exports = {
  // Sandbox Environment (for testing) - Using official ZaloPay test credentials
  sandbox: {
    app_id: "2554", // Official ZaloPay test App ID
    key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL", // Official ZaloPay test Key1
    key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz", // Official ZaloPay test Key2
    endpoint: "https://sb-openapi.zalopay.vn/v2/create",
    query_endpoint: "https://sb-openapi.zalopay.vn/v2/query",
    callback_url: "http://localhost:3000/api/payments/callback", // Local backend for testing
    default_return_url: "fooddelivery://payment-success" // Deep link for mobile app
  },
  
  // Production Environment (for live)
  production: {
    app_id: "YOUR_PRODUCTION_APP_ID", // Replace with your production App ID
    key1: "YOUR_PRODUCTION_KEY1", // Replace with your production Key1
    key2: "YOUR_PRODUCTION_KEY2", // Replace with your production Key2
    endpoint: "https://openapi.zalopay.vn/v2/create",
    query_endpoint: "https://openapi.zalopay.vn/v2/query",
    callback_url: "https://your-backend-domain.com/api/payments/callback", // Production backend
    default_return_url: "fooddelivery://payment-success" // Deep link for mobile app
  },
  
  // Current environment (change this to 'production' when deploying)
  current: "sandbox"
}; 