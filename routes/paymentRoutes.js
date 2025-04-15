const express = require("express");
const router = express.Router();
const axios = require("axios");
const CryptoJS = require("crypto-js");
const moment = require("moment");
const { pool } = require("../config/database");

const { auth } = require("../middleware/roleAuth"); // Assuming you have auth middleware

// Get payment settings from database
async function getPaymentSettings(provider = "zalopay") {
  try {
    const result = await pool.query(
      "SELECT * FROM payment_settings WHERE provider = $1 AND is_active = true",
      [provider]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error getting payment settings:", error);
    throw new Error("Failed to get payment settings");
  }
}

// Create ZaloPay payment
router.post("/create-payment", auth, async (req, res) => {
  try {
    const {
      order_id,
      amount,
      description = "Payment for order",
      redirect_url,
    } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!order_id || !amount) {
      return res.status(400).json({
        status: "error",
        message: "Order ID and amount are required",
      });
    }

    // Get order details to confirm it exists and belongs to user
    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE order_id = $1 AND user_id = $2",
      [order_id, user_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Order not found or does not belong to this user",
      });
    }

    // Get ZaloPay settings
    const config = await getPaymentSettings("zalopay");

    // Generate transaction ID
    const transID = Math.floor(Math.random() * 1000000);
    const appTransId = `${moment().format("YYMMDD")}_${transID}`;

    // Create embed data
    const embed_data = {
      redirecturl: redirect_url || "YOUR_DEFAULT_REDIRECT_URL",
      orderId: order_id,
      userId: user_id,
    };

    // Create items array for display
    const orderItems = await pool.query(
      "SELECT d.dish_name, od.quantity, od.price FROM order_details od JOIN dishes d ON od.dish_id = d.dish_id WHERE od.order_id = $1",
      [order_id]
    );

    const items = orderItems.rows.map((item) => ({
      name: item.dish_name,
      quantity: item.quantity,
      price: item.price,
    }));

    // Create ZaloPay order object
    const order = {
      app_id: config.app_id,
      app_trans_id: appTransId,
      app_user: `user_${user_id}`,
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: parseInt(amount),
      callback_url: "YOUR_CALLBACK_URL", // Replace with your actual callback URL
      description: description || `Payment for order #${order_id}`,
      bank_code: req.body.bank_code || "zalopayapp",
    };

    // Generate MAC
    const data =
      config.app_id +
      "|" +
      order.app_trans_id +
      "|" +
      order.app_user +
      "|" +
      order.amount +
      "|" +
      order.app_time +
      "|" +
      order.embed_data +
      "|" +
      order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    // Send request to ZaloPay
    const result = await axios.post(config.endpoint, null, { params: order });

    // Save payment record to database
    const paymentResult = await pool.query(
      `INSERT INTO payments 
       (order_id, user_id, amount, app_trans_id, payment_method, status, redirect_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING payment_id`,
      [
        order_id,
        user_id,
        amount,
        appTransId,
        "zalopay",
        "pending",
        redirect_url,
      ]
    );

    const payment_id = paymentResult.rows[0].payment_id;

    // Return payment info
    return res.status(200).json({
      status: "success",
      payment_id: payment_id,
      app_trans_id: appTransId,
      order_url: result.data.order_url,
      zp_trans_token: result.data.zp_trans_token,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create payment",
      error: error.message,
    });
  }
});

// Check payment status
router.get("/check-status/:app_trans_id", auth, async (req, res) => {
  try {
    const { app_trans_id } = req.params;
    const config = await getPaymentSettings("zalopay");

    // Create data to check payment status
    let postData = {
      app_id: config.app_id,
      app_trans_id: app_trans_id,
    };

    // Generate MAC
    let data =
      postData.app_id + "|" + postData.app_trans_id + "|" + config.key1;
    postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    // Send request to ZaloPay
    const result = await axios.post(
      "https://sb-openapi.zalopay.vn/v2/query",
      postData
    );

    // Update payment status in database
    if (result.data.return_code === 1) {
      await pool.query(
        "UPDATE payments SET status = $1, zp_trans_id = $2, updated_at = NOW() WHERE app_trans_id = $3",
        ["completed", result.data.zp_trans_id, app_trans_id]
      );

      // Log transaction
      await pool.query(
        `INSERT INTO payment_transactions 
        (payment_id, app_trans_id, amount, return_code, return_message, status, transaction_data) 
        VALUES ((SELECT payment_id FROM payments WHERE app_trans_id = $1), $1, $2, $3, $4, $5, $6)`,
        [
          app_trans_id,
          result.data.amount,
          result.data.return_code,
          result.data.return_message,
          "completed",
          JSON.stringify(result.data),
        ]
      );
    }

    return res.status(200).json({
      status: "success",
      data: result.data,
    });
  } catch (error) {
    console.error("Check payment status error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to check payment status",
      error: error.message,
    });
  }
});

// ZaloPay callback handler
router.post("/callback", async (req, res) => {
  let result = {};
  try {
    // Get payment settings
    const config = await getPaymentSettings("zalopay");

    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    // Verify callback
    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = "Invalid MAC signature";
    } else {
      // Payment successful
      let dataJson = JSON.parse(dataStr);

      // Extract embedded data
      let embedData = {};
      try {
        embedData = JSON.parse(dataJson.embed_data || "{}");
      } catch (err) {
        console.log("Error parsing embed_data:", err);
      }

      // Update payment status in database
      if (embedData.orderId) {
        await pool.query(
          "UPDATE payments SET status = $1, zp_trans_id = $2, callback_data = $3, updated_at = NOW() WHERE app_trans_id = $4",
          [
            "completed",
            dataJson.zp_trans_id,
            JSON.stringify(dataJson),
            dataJson.app_trans_id,
          ]
        );

        // Log transaction
        await pool.query(
          `INSERT INTO payment_transactions 
          (payment_id, app_trans_id, amount, return_code, return_message, status, transaction_data) 
          VALUES ((SELECT payment_id FROM payments WHERE app_trans_id = $1), $1, $2, $3, $4, $5, $6)`,
          [
            dataJson.app_trans_id,
            dataJson.amount,
            1,
            "Success from callback",
            "completed",
            JSON.stringify(dataJson),
          ]
        );

        // Update order status
        await pool.query(
          "UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW() WHERE order_id = $3",
          ["processing", "paid", embedData.orderId]
        );
      }

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    console.error("Callback processing error:", ex.message);
    result.return_code = 0; // ZaloPay server will retry
    result.return_message = ex.message;
  }

  res.json(result);
});

module.exports = router;
