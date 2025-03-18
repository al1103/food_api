const { pool } = require("../config/database");

class CartModel {
  static async getCart(userId) {
    try {
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
          d.image_url,
          d.category,
          d.is_combo,
          d.is_available,
          ds.size_name,
          ds.price,
          ds.is_available AS size_available
        FROM cart c
        JOIN dishes d ON c.dish_id = d.dish_id
        LEFT JOIN dish_sizes ds ON c.size_id = ds.size_id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `;

      // UUID is passed as a string
      const result = await pool.query(query, [userId]);

      // Get all items and calculate subtotals
      const items = await Promise.all(
        result.rows.map(async (item) => {
          const cartItem = {
            cartId: item.cart_id,
            dishId: item.dish_id,
            name: item.dish_name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            imageUrl: item.image_url,
            category: item.category,
            isCombo: item.is_combo,
            isAvailable: item.is_available && item.size_available,
            size: {
              sizeId: item.size_id,
              sizeName: item.size_name,
            },
            subtotal: parseFloat(item.price) * item.quantity,
          };

          // Add combo items details if it's a combo
          if (item.is_combo) {
            const comboQuery = `
            SELECT 
              ci.combo_item_id,
              ci.dish_id,
              d.name,
              ci.quantity,
              ci.size_id,
              ds.size_name,
              ds.price
            FROM combo_items ci
            JOIN dishes d ON ci.dish_id = d.dish_id
            LEFT JOIN dish_sizes ds ON ci.size_id = ds.size_id
            WHERE ci.combo_id = $1
          `;

            const comboResult = await pool.query(comboQuery, [item.dish_id]);
            cartItem.comboItems = comboResult.rows.map((ci) => ({
              comboItemId: ci.combo_item_id,
              dishId: ci.dish_id,
              name: ci.name,
              quantity: ci.quantity,
              size: {
                sizeId: ci.size_id,
                sizeName: ci.size_name,
              },
            }));
          }

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

  // Add an item to cart
  static async addToCart(userId, dishId, sizeId, quantity) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if dish exists and is available
      const dishResult = await client.query(
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

      // Check if size exists and is available
      let sizePrice;
      if (sizeId) {
        const sizeResult = await client.query(
          `SELECT * FROM dish_sizes WHERE size_id = $1 AND dish_id = $2`,
          [sizeId, dishId]
        );

        if (sizeResult.rows.length === 0) {
          throw new Error("Invalid size for this dish");
        }

        const size = sizeResult.rows[0];
        if (size.is_available === false) {
          throw new Error("Selected size is currently not available");
        }

        sizePrice = size.price;
      } else {
        // If no size specified, get the default size
        const defaultSizeResult = await client.query(
          `SELECT * FROM dish_sizes WHERE dish_id = $1 AND is_default = TRUE`,
          [dishId]
        );

        if (defaultSizeResult.rows.length === 0) {
          throw new Error("No default size found for this dish");
        }

        sizeId = defaultSizeResult.rows[0].size_id;
        sizePrice = defaultSizeResult.rows[0].price;
      }

      // Check if item already exists in cart with the same size
      const existingItem = await client.query(
        `SELECT * FROM cart WHERE user_id = $1 AND dish_id = $2 AND size_id = $3`,
        [userId, dishId, sizeId]
      );

      let result;
      if (existingItem.rows.length > 0) {
        // Update quantity if item exists
        const newQuantity = existingItem.rows[0].quantity + quantity;

        result = await client.query(
          `UPDATE cart 
           SET quantity = $1, updated_at = NOW() 
           WHERE user_id = $2 AND dish_id = $3 AND size_id = $4
           RETURNING *`,
          [newQuantity, userId, dishId, sizeId]
        );
      } else {
        // Add new item to cart
        result = await client.query(
          `INSERT INTO cart (user_id, dish_id, size_id, quantity, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [userId, dishId, sizeId, quantity]
        );
      }

      await client.query("COMMIT");
      return {
        ...result.rows[0],
        price: sizePrice,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding to cart:", error);
      throw error;
    } finally {
      client.release();
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
