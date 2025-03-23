const { pool } = require("../config/database");

class CartModel {
  static async getCart(userId) {
    try {
      // First check if the user exists
      const userCheckQuery = `SELECT * FROM users WHERE user_id = $1`;
      const userResult = await pool.query(userCheckQuery, [userId]);
      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const query = `
        SELECT 
          c.cart_id,
          c.user_id,
          c.dish_id,
          c.size_id,
          c.quantity,
          c.created_at,
          c.updated_at,
          d.name AS dish_name,
          d.category,
          d.description,
          d.price AS base_price,
          false AS is_combo,  -- Use false since the column doesn't exist
          COALESCE(d.available, true) AS is_available,
          ds.size_name,
          ds.price_adjustment,  -- Updated column name for size adjustment
          true AS size_available  -- Return default true (since ds.is_available doesn't exist)
        FROM cart c
        JOIN dishes d ON c.dish_id = d.id
        LEFT JOIN dish_sizes ds ON c.size_id = ds.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [userId]);

      // If cart is empty, return empty structure
      if (result.rows.length === 0) {
        return {
          items: [],
          totalAmount: 0,
          totalItems: 0,
        };
      }

      // Process all items and calculate subtotals
      const items = await Promise.all(
        result.rows.map(async (item) => {
          const basePrice = parseFloat(item.base_price) || 0;
          const adjustment = item.price_adjustment
            ? parseFloat(item.price_adjustment)
            : 0;
          const finalPrice = basePrice + adjustment;

          const cartItem = {
            cartId: item.cart_id,
            dishId: item.dish_id,
            name: item.dish_name,
            description: item.description,
            imageUrl: "",
            category: item.category,
            isCombo: item.is_combo,
            isAvailable:
              item.is_available && (item.size_id ? item.size_available : true),
            size: item.size_id
              ? {
                  sizeId: item.size_id,
                  sizeName: item.size_name,
                }
              : null,
            subtotal: finalPrice * item.quantity,
            price: finalPrice,
            quantity: item.quantity,
          };

          // Removed combo items section

          return cartItem;
        })
      );

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

  static async addToCart(userId, dishId, sizeId, quantity) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if dish exists and is available
      const dishResult = await client.query(
        `SELECT * FROM dishes WHERE id = $1`,
        [dishId]
      );

      if (dishResult.rows.length === 0) {
        throw new Error("Dish not found");
      }

      const dish = dishResult.rows[0];
      if (dish.available === false) {
        throw new Error("Dish is currently not available");
      }

      // Handle sizing logic
      let finalSizeId = sizeId;
      let finalPrice = parseFloat(dish.price);

      if (sizeId) {
        // Check if selected size exists and is available
        const sizeResult = await client.query(
          `SELECT * FROM dish_sizes WHERE id = $1 AND dish_id = $2`,
          [sizeId, dishId]
        );

        if (sizeResult.rows.length === 0) {
          throw new Error("Invalid size for this dish");
        }

        const size = sizeResult.rows[0];
        if (size.is_available === false) {
          throw new Error("Selected size is currently not available");
        }

        finalPrice = parseFloat(size.price);
      } else {
        // Try to find a default size
        const defaultSizeResult = await client.query(
          `SELECT * FROM dish_sizes 
           WHERE dish_id = $1 AND is_default = true
           ORDER BY price ASC
           LIMIT 1`,
          [dishId]
        );

        // If we find a default size, use it
        if (defaultSizeResult.rows.length > 0) {
          finalSizeId = defaultSizeResult.rows[0].size_id;
          finalPrice = parseFloat(defaultSizeResult.rows[0].price);
        }
        // Otherwise, we'll use null for sizeId and the base dish price
      }

      // Check if item already exists in cart with the same size
      const existingItem = await client.query(
        `SELECT * FROM cart 
         WHERE user_id = $1 AND dish_id = $2 AND 
         (size_id = $3 OR (size_id IS NULL AND $3 IS NULL))`,
        [userId, dishId, finalSizeId]
      );

      let result;
      if (existingItem.rows.length > 0) {
        // Update quantity if item exists
        const newQuantity = existingItem.rows[0].quantity + quantity;

        result = await client.query(
          `UPDATE cart 
           SET quantity = $1, updated_at = NOW() 
           WHERE cart_id = $2
           RETURNING *`,
          [newQuantity, existingItem.rows[0].cart_id]
        );
      } else {
        // Add new item to cart
        result = await client.query(
          `INSERT INTO cart (user_id, dish_id, size_id, quantity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [userId, dishId, finalSizeId, quantity]
        );
      }

      await client.query("COMMIT");

      // Return cart item with price
      return {
        ...result.rows[0],
        price: finalPrice,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding to cart:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateCartItem(userId, cartId, quantity) {
    try {
      if (quantity <= 0) {
        // If quantity is 0 or negative, remove item from cart
        return await this.removeFromCart(userId, cartId);
      }

      // First verify the cart item belongs to this user
      const checkQuery = `
        SELECT * FROM cart WHERE cart_id = $1 AND user_id = $2
      `;
      const checkResult = await pool.query(checkQuery, [cartId, userId]);

      if (checkResult.rows.length === 0) {
        throw new Error("Cart item not found");
      }

      const result = await pool.query(
        `UPDATE cart 
         SET quantity = $1, updated_at = NOW() 
         WHERE cart_id = $2 AND user_id = $3
         RETURNING *`,
        [quantity, cartId, userId]
      );

      // Get price information
      const priceQuery = `
        SELECT 
          COALESCE(ds.price, d.price) AS price
        FROM cart c
        JOIN dishes d ON c.dish_id = d.id
        LEFT JOIN dish_sizes ds ON c.size_id = ds.id
        WHERE c.cart_id = $1
      `;

      const priceResult = await pool.query(priceQuery, [cartId]);
      const price =
        priceResult.rows.length > 0 ? parseFloat(priceResult.rows[0].price) : 0;

      return {
        ...result.rows[0],
        price,
        subtotal: price * quantity,
      };
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  static async removeFromCart(userId, cartId) {
    try {
      // First verify the cart item belongs to this user
      const checkQuery = `
        SELECT * FROM cart WHERE cart_id = $1 AND user_id = $2
      `;
      const checkResult = await pool.query(checkQuery, [cartId, userId]);

      if (checkResult.rows.length === 0) {
        throw new Error("Cart item not found");
      }

      const result = await pool.query(
        `DELETE FROM cart 
         WHERE cart_id = $1 AND user_id = $2
         RETURNING *`,
        [cartId, userId]
      );

      return {
        message: "Item removed from cart",
        removedItem: result.rows[0],
      };
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  static async clearCart(userId) {
    try {
      const result = await pool.query(
        `DELETE FROM cart WHERE user_id = $1 RETURNING *`,
        [userId]
      );

      return {
        message: "Cart cleared successfully",
        removedItems: result.rowCount,
      };
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }
}

module.exports = CartModel;
