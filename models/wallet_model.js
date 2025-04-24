const { pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class WalletModel {
  /**
   * Create a wallet transaction
   * @param {string} userId - The user ID
   * @param {number} amount - The transaction amount (positive for credit, negative for debit)
   * @param {string} transactionType - Type of transaction (e.g., 'deposit', 'withdrawal', 'referral_commission')
   * @param {string} referenceId - Optional reference ID (e.g., order ID, payment ID)
   * @param {string} description - Transaction description
   * @returns {Promise<Object>} The created transaction
   */
  static async createTransaction(
    userId,
    amount,
    transactionType,
    referenceId = null,
    description
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Validate amount
      if (typeof amount !== "number" || isNaN(amount) || amount === 0) {
        throw new Error("Số tiền giao dịch không hợp lệ");
      }

      // Update user's wallet balance
      const userResult = await client.query(
        `UPDATE users 
         SET wallet_balance = wallet_balance + $1, updated_at = NOW()
         WHERE user_id = $2
         RETURNING wallet_balance AS "walletBalance"`,
        [amount, userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error("Người dùng không tồn tại");
      }

      // Insert transaction record
      const transactionResult = await client.query(
        `INSERT INTO wallet_transactions (
          user_id, amount, transaction_type, reference_id, description, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW()
        ) RETURNING 
          id, 
          amount, 
          transaction_type AS "transactionType", 
          reference_id AS "referenceId", 
          description, 
          created_at AS "createdAt"`,
        [userId, amount, transactionType, referenceId, description]
      );

      await client.query("COMMIT");

      return {
        transaction: transactionResult.rows[0],
        newBalance: parseFloat(userResult.rows[0].walletBalance),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi tạo giao dịch ví:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a payment transaction for a reservation
   * @param {string} userId - The user ID
   * @param {string|number} amount - The payment amount (can be string with comma as decimal separator)
   * @param {string} reservationId - The reservation ID
   * @param {string} description - Description of the payment
   * @returns {Promise<Object>} The processed transaction
   */
  static async processReservationPayment(
    userId,
    amount,
    reservationId,
    description
  ) {
    try {
      // Format amount properly - handle both string and number inputs
      let formattedAmount;

      if (typeof amount === "string") {
        // Replace comma with dot for decimal separator if present
        formattedAmount = parseFloat(
          amount.replace(/\./g, "").replace(",", ".")
        );
      } else {
        formattedAmount = parseFloat(amount);
      }

      // Validate the formatted amount
      if (isNaN(formattedAmount) || formattedAmount <= 0) {
        throw new Error("Số tiền giao dịch không hợp lệ");
      }

      // Make negative as it's a payment (money leaving the wallet)
      const transactionAmount = -Math.abs(formattedAmount);

      // Process the transaction
      return await this.createTransaction(
        userId,
        transactionAmount,
        "reservation_payment",
        reservationId,
        description || "Thanh toán đặt bàn"
      );
    } catch (error) {
      console.error("Lỗi khi xử lý thanh toán đặt bàn:", error);
      throw error;
    }
  }
}

module.exports = WalletModel;
