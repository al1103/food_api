const { pool } = require("../config/database");

class CartModel {
  // Get cart items for a specific user
  static async getCart(userId) {
    try {
      const query = `
        SELECT 
          c.cart_id,
          c.user_id,
          c.dish_id,
          c.quantity,
          c.created_at,
          c.updated_at,
          d.name AS dish_name,
          d.price,
          d.image_url,
          d.category,
          d.is_available
        FROM cart c
        JOIN dishes d ON c.dish_id = d.dish_id
        WHERE c.user_id = $1
      `;

      // UUID is passed as a string
      const result = await pool.query(query, [userId]);

      // Calculate total price
      const items = result.rows.map((item) => ({
        cartId: item.cart_id,
        dishId: item.dish_id,
        name: item.dish_name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.image_url,
        category: item.category,
        isAvailable: item.is_available,
        subtotal: parseFloat(item.price) * item.quantity,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        items,
        totalAmount,
        totalItems: items.length,
      };
    } catch (error) {
      console.error("Error getting cart:", error);
      throw error;
    }
  }

  // Add an item to cart
  static async addToCart(userId, dishId, quantity) {
    try {
      // Check if dish exists and is available
      const dishResult = await pool.query(
        `SELECT * FROM dishes WHERE dish_id = $1`,
        [dishId]
      );

      if (dishResult.rows.length === 0) {
        throw new Error("Dish not found");
      }

      const dish = dishResult.rows[0];
      if (dish.is_available === false) {
        throw new Error("Dish is currently not available");
      }

      // Check if item already exists in cart
      const existingItem = await pool.query(
        `SELECT * FROM cart WHERE user_id = $1 AND dish_id = $2`,
        [userId, dishId]
      );

      if (existingItem.rows.length > 0) {
        // Update quantity if item exists
        const newQuantity = existingItem.rows[0].quantity + quantity;

        const result = await pool.query(
          `UPDATE cart 
           SET quantity = $1, updated_at = NOW() 
           WHERE user_id = $2 AND dish_id = $3
           RETURNING *`,
          [newQuantity, userId, dishId]
        );

        return result.rows[0];
      } else {
        // Add new item to cart
        const result = await pool.query(
          `INSERT INTO cart (user_id, dish_id, quantity, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING *`,
          [userId, dishId, quantity]
        );

        return result.rows[0];
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  // Update cart item quantity
  static async updateCartItem(userId, cartId, quantity) {
    try {
      if (quantity <= 0) {
        // If quantity is 0 or negative, remove item from cart
        return await this.removeFromCart(userId, cartId);
      }

      const result = await pool.query(
        `UPDATE cart 
         SET quantity = $1, updated_at = NOW() 
         WHERE cart_id = $2 AND user_id = $3
         RETURNING *`,
        [quantity, cartId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Cart item not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeFromCart(userId, cartId) {
    try {
      const result = await pool.query(
        `DELETE FROM cart 
         WHERE cart_id = $1 AND user_id = $2
         RETURNING *`,
        [cartId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Cart item not found");
      }

      return { message: "Item removed from cart" };
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  // Clear all items from cart
  static async clearCart(userId) {
    try {
      await pool.query(`DELETE FROM cart WHERE user_id = $1`, [userId]);

      return { message: "Cart cleared successfully" };
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }
}

module.exports = CartModel;
