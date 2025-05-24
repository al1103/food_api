const express = require("express");
const router = express.Router();
const axios = require("axios");
const CryptoJS = require("crypto-js");
const moment = require("moment");
const { pool } = require("../config/database");
const QRCode = require("qrcode"); // Add this import
const { auth, adminAuth } = require("../middleware/roleAuth");
const jwt = require('jsonwebtoken'); // Add JWT import at the top

// Get payment settings from database
async function getPaymentSettings(provider = "zalopay") {
  try {
    const result = await pool.query(
      "SELECT * FROM payment_settings WHERE provider = $1 AND is_active = true",
      [provider],
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
      amount, // This is the deposit amount
      description = "Payment for order",
      redirect_url,
      payment_method = "zalopay",
    } = req.body;
    const user_id = req.user.userId;

    // Validate required fields
    if (!order_id || !amount || !payment_method) {
      return res.status(400).json({
        status: "error",
        message: "Order ID, deposit amount, and payment method are required",
      });
    }

    // Get order with status and total price
    const orderResult = await pool.query(
      `SELECT o.*, u.wallet_balance
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1 AND o.user_id = $2`,
      [order_id, user_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Order not found or does not belong to this user",
      });
    }

    const order = orderResult.rows[0];
    const totalAmount = parseFloat(order.total_price);
    const depositAmount = parseFloat(amount);
    const remainingAfterDeposit = totalAmount - depositAmount;

    // Validate deposit amount
    if (depositAmount > totalAmount) {
      return res.status(400).json({
        status: "error",
        message: "Deposit amount cannot be greater than total price",
        total_price: totalAmount,
        deposit_amount: depositAmount
      });
    }

    // If direct payment, handle wallet payment
    if (payment_method === "direct") {
      const walletBalance = parseFloat(order.wallet_balance) || 0;
      const amountToDeduct = Math.min(walletBalance, depositAmount);
      const remainingDeposit = depositAmount - amountToDeduct;

      // Begin transaction
      await pool.query('BEGIN');

      try {
        const transID = Math.floor(Math.random() * 1000000);
        const appTransId = `DIRECT_${moment().format("YYMMDD")}_${transID}`;

        // Deduct available balance from wallet (if any)
        if (amountToDeduct > 0) {
          await pool.query(
            "UPDATE users SET wallet_balance = wallet_balance - $1 WHERE user_id = $2::uuid",
            [amountToDeduct, user_id]
          );

          // Log wallet transaction
          await pool.query(
            `INSERT INTO wallet_transactions
             (user_id, amount, transaction_type, reference_id, description)
             VALUES ($1::uuid, $2, $3, $4, $5)`,
            [
              user_id,
              amountToDeduct,
              'deposit',
              order_id,
              `Deposit payment for order #${order_id}`
            ]
          );
        }

        // Create payment record
        const paymentResult = await pool.query(
          `INSERT INTO payments
           (order_id, user_id, amount, payment_method, status, redirect_url, app_trans_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING payment_id`,
          [order_id, user_id, amountToDeduct, "direct", "completed", redirect_url, appTransId]
        );

        // Log transaction
        await pool.query(
          `INSERT INTO payment_transactions
           (payment_id, app_trans_id, amount, return_code, return_message, status, transaction_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            paymentResult.rows[0].payment_id,
            appTransId,
            amountToDeduct,
            1,
            'Deposit payment processed',
            'completed',
            JSON.stringify({
              payment_method: 'direct',
              order_id: order_id,
              total_price: totalAmount,
              deposit_amount: depositAmount,
              deducted_from_wallet: amountToDeduct,
              remaining_deposit: remainingDeposit,
              remaining_total: remainingAfterDeposit
            })
          ]
        );

        await pool.query('COMMIT');

        return res.status(200).json({
          status: "success",
          payment_id: paymentResult.rows[0].payment_id,
          app_trans_id: appTransId,
          total_price: totalAmount,
          deposit_amount: depositAmount,
          amount_paid: amountToDeduct,
          remaining_deposit: remainingDeposit,
          remaining_total: remainingAfterDeposit,
          payment_method: "direct",
          wallet_balance_used: amountToDeduct,
          message: `Deposit payment processed. Total price: ${totalAmount}, Deposit paid: ${amountToDeduct}, Remaining total: ${remainingAfterDeposit}`
        });

      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    }

    // Handle ZaloPay payment
    const config = await getPaymentSettings("zalopay");
    const transID = Math.floor(Math.random() * 1000000);
    const appTransId = `${moment().format("YYMMDD")}_${transID}`;

    const embed_data = {
      redirecturl: redirect_url || config.default_return_url,
      orderId: order_id,
      userId: user_id
    };

    const orderItems = await pool.query(
      `SELECT d.name, od.quantity, od.price
       FROM order_details od
       JOIN dishes d ON od.dish_id = d.dish_id
       WHERE od.order_id = $1`,
      [order_id]
    );

    const items = orderItems.rows.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const order_data = {
      app_id: config.app_id,
      app_trans_id: appTransId,
      app_user: `user_${user_id}`,
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: parseInt(amount),
      callback_url: config.callback_url,
      description: description || `Payment for order #${order_id}`,
      bank_code: "zalopayapp"
    };

    const mac_data = Object.values({
      app_id: order_data.app_id,
      app_trans_id: order_data.app_trans_id,
      app_user: order_data.app_user,
      amount: order_data.amount,
      app_time: order_data.app_time,
      embed_data: order_data.embed_data,
      item: order_data.item
    }).join("|");

    order_data.mac = CryptoJS.HmacSHA256(mac_data, config.key1).toString();

    const result = await axios.post(config.endpoint, null, { params: order_data });

    // Save ZaloPay payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments
       (order_id, user_id, amount, app_trans_id, payment_method, status, redirect_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING payment_id`,
      [order_id, user_id, amount, appTransId, "zalopay", "pending", redirect_url]
    );

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(result.data.order_url, {
      margin: 2,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });

    return res.status(200).json({
      status: "success",
      payment_id: paymentResult.rows[0].payment_id,
      app_trans_id: appTransId,
      order_url: result.data.order_url,
      zp_trans_token: result.data.zp_trans_token,
      qr_code: qrCodeDataURL,
      amount: parseInt(amount),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      description: description
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create payment",
      error: error.message
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
      postData,
    );

    // Update payment status in database
    if (result.data.return_code === 1) {
      await pool.query(
        "UPDATE payments SET status = $1, zp_trans_id = $2, updated_at = NOW() WHERE app_trans_id = $3",
        ["completed", result.data.zp_trans_id, app_trans_id],
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
        ],
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
          ],
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
          ],
        );

        // Update order status
        await pool.query(
          `UPDATE orders
           SET status = $1,
               updated_at = NOW()
           WHERE order_id = $2`,
          ["processing", embedData.orderId]
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

// Admin confirm payment and update order status
router.post("/admin/confirm-payment/:order_id", auth, async (req, res) => {
  try {
    const { order_id } = req.params;
    const admin_id = req.user.userId;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized. Admin access required"
      });
    }

    // Get order details with user info and previous payments
    const orderResult = await pool.query(
      `SELECT o.order_id, o.user_id, o.total_price, o.status,
              COALESCE(SUM(p.amount), 0) as total_paid_amount,
              u.wallet_balance, u.user_id::text as user_id
       FROM orders o
       LEFT JOIN payments p ON o.order_id = p.order_id AND p.status = 'completed'
       JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1
       GROUP BY o.order_id, u.user_id, u.wallet_balance`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Order not found"
      });
    }

    const order = orderResult.rows[0];
    const totalPrice = parseFloat(order.total_price);
    const totalPaidAmount = parseFloat(order.total_paid_amount);
    const remainingAmount = totalPrice - totalPaidAmount;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Order is already fully paid",
        total_price: totalPrice,
        total_paid: totalPaidAmount
      });
    }

    // Begin transaction
    await pool.query('BEGIN');

    try {
      const transID = Math.floor(Math.random() * 1000000);
      const appTransId = `ADMIN_CONFIRM_${moment().format("YYMMDD")}_${transID}`;

      // Create final payment record
      const paymentResult = await pool.query(
        `INSERT INTO payments
         (order_id, user_id, amount, payment_method, status, app_trans_id,
          admin_confirmed, admin_confirmed_at, admin_confirmed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
         RETURNING payment_id`,
        [
          order_id,
          order.user_id,
          remainingAmount,
          "admin_confirm",
          "completed",
          appTransId,
          true,
          admin_id
        ]
      );

      // Update order status
      await pool.query(
        `UPDATE orders
         SET status = $1,
             updated_at = NOW()
         WHERE order_id = $2`,
        ['paid', order_id]
      );

      // Log admin confirmation transaction
      await pool.query(
        `INSERT INTO payment_transactions
         (payment_id, app_trans_id, amount, return_code, return_message, status, transaction_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          paymentResult.rows[0].payment_id,
          appTransId,
          remainingAmount,
          1,
          'Final payment confirmed by admin',
          'paid',
          JSON.stringify({
            admin_id: admin_id,
            confirmation_type: 'admin_approval',
            order_id: order_id,
            total_price: totalPrice,
            previous_paid: totalPaidAmount,
            final_payment: remainingAmount
          })
        ]
      );

      await pool.query('COMMIT');

      return res.status(200).json({
        status: "success",
        message: "Payment confirmed and order status updated",
        order_id: order_id,
        total_price: totalPrice,
        previous_paid: totalPaidAmount,
        final_payment: remainingAmount,
        new_status: "paid"
      });

    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    console.error("Admin payment confirmation error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to confirm payment",
      error: error.message
    });
  }
});

module.exports = router;
