// Node v10.15.3
const axios = require("axios").default; // npm install axios
const CryptoJS = require("crypto-js"); // npm install crypto-js
const express = require("express"); // npm install express
const bodyParser = require("body-parser"); // npm install body-parser
const moment = require("moment"); // npm install moment
const qs = require("qs");

const app = express();

// APP INFO, STK TEST: 4111 1111 1111 1111
const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

app.use(bodyParser.json());

/**
 * method: POST
 * Sandbox POST: https://sb-openapi.zalopay.vn/v2/create
 * Real POST: https://openapi.zalopay.vn/v2/create
 * description: tạo đơn hàng và xử lý thanh toán
 */
app.post("/payment", async (req, res) => {
  try { 
    // Get order data from request body
    const {
      amount = 50000,
      description = "Payment for order",
      items = [],
      redirectUrl = "https://zilongpro.me",
      orderId,
      userId,
    } = req.body;

    // Create embed data for redirects and callback handling
    const embed_data = {
      redirecturl: redirectUrl,
      orderId: orderId || null,
      userId: userId || null,
    };

    // Generate unique transaction ID
    const transID = Math.floor(Math.random() * 1000000);
    const appTransId = `${moment().format("YYMMDD")}_${transID}`;

    // Create ZaloPay order object
    const order = {
      app_id: config.app_id,
      app_trans_id: appTransId,
      app_user: req.body.app_user || "user123",
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: parseInt(amount),
      callback_url: "https://b074-1-53-37-194.ngrok-free.app/callback",
      description: description || `Payment for order #${orderId || transID}`,
      bank_code: req.body.bank_code || "zalopayapp",
    };

    // Generate MAC for security validation
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

    // Send payment request to ZaloPay
    const result = await axios.post(config.endpoint, null, { params: order });

    // Add app_trans_id to response for order tracking
    return res.status(200).json({
      ...result.data,
      app_trans_id: appTransId,
      order_id: orderId,
    });
  } catch (error) {
    console.log("Payment creation error:", error);
    return res.status(500).json({
      return_code: -1,
      return_message: "Failed to create payment",
      error: error.message,
    });
  }
});

/**
 * method: POST
 * description: callback để Zalopay Server call đến khi thanh toán thành công
 */
app.post("/callback", (req, res) => {
  let result = {};
  console.log("Callback received:", req.body);
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    console.log("Calculated MAC =", mac);

    // Verify callback authenticity
    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = "Invalid MAC signature";
    } else {
      // Payment successful
      let dataJson = JSON.parse(dataStr);
      console.log(
        "Payment successful for transaction:",
        dataJson["app_trans_id"]
      );

      // Extract embedded data
      let embedData = {};
      try {
        embedData = JSON.parse(dataJson.embed_data || "{}");
        console.log("Embedded data:", embedData);
      } catch (err) {
        console.log("Error parsing embed_data:", err);
      }

      // Here you would update your order status in database
      // If you have orderId in embedData, use it to update your order status
      if (embedData.orderId) {
        console.log("Update order status for order ID:", embedData.orderId);
        // updateOrderStatus(embedData.orderId, 'paid');
      }

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    console.log("Callback processing error:", ex.message);
    result.return_code = 0; // ZaloPay server will retry (up to 3 times)
    result.return_message = ex.message;
  }

  // Respond to ZaloPay server
  res.json(result);
});

/**
 * method: POST
 * Sandbox	POST	https://sb-openapi.zalopay.vn/v2/query
 * Real	POST	https://openapi.zalopay.vn/v2/query
 * description:
 * Khi user thanh toán thành công,
 * ZaloPay sẽ gọi callback (notify) tới merchant để merchant cập nhật trạng thái
 * đơn hàng Thành Công trên hệ thống. Trong thực tế callback có thể bị miss do lỗi Network timeout,
 * Merchant Service Unavailable/Internal Error...
 * nên Merchant cần hiện thực việc chủ động gọi API truy vấn trạng thái đơn hàng.
 */

app.post("/check-status-order", async (req, res) => {
  const { app_trans_id } = req.body;

  let postData = {
    app_id: config.app_id,
    app_trans_id, // Input your app_trans_id
  };

  let data = postData.app_id + "|" + postData.app_trans_id + "|" + config.key1; // appid|app_trans_id|key1
  postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  let postConfig = {
    method: "post",
    url: "https://sb-openapi.zalopay.vn/v2/query",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: qs.stringify(postData),
  };

  try {
    const result = await axios(postConfig);
    console.log(result.data);
    return res.status(200).json(result.data);
    /**
     * kết quả mẫu
      {
        "return_code": 1, // 1 : Thành công, 2 : Thất bại, 3 : Đơn hàng chưa thanh toán hoặc giao dịch đang xử lý
        "return_message": "",
        "sub_return_code": 1,
        "sub_return_message": "",
        "is_processing": false,
        "amount": 50000,
        "zp_trans_id": 240331000000175,
        "server_time": 1711857138483,
        "discount_amount": 0
      }
    */
  } catch (error) {
    console.log("lỗi");
    console.log(error);
  }
});

app.listen(8888, function () {
  console.log("Server is listening at port :8888");
});
