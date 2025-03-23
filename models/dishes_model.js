const { pool } = require("../config/database");

class DishModel {
  /**
   * Get all dishes with pagination
   * @param {number} page - Current page number
   * @param {number} limit - Number of items per page
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Pagination details and dish data
   */
  static async getAllDishes(page, limit, offset) {
    try {
      const countQuery = "SELECT COUNT(*) FROM dishes";
      const dishesQuery = `
        SELECT * FROM dishes 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const countResult = await pool.query(countQuery);
      const dishesResult = await pool.query(dishesQuery, [limit, offset]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        count: totalCount,
        rows: dishesResult.rows,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      console.error("Error in getAllDishes:", error);
      throw error;
    }
  }

  /**
   * Get a dish by its ID
   * @param {number} id - Dish ID
   * @returns {Promise<Object>} - Dish data
   */
  static async getDishById(id) {
    const query = "SELECT * FROM dishes WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new dish
   * @param {Object} dishData - Dish data
   * @returns {Promise<number>} - ID of the created dish
   */
  static async createDish(dishData) {
    try {
      const { name, description, category_id, price, preparation_time, image } =
        dishData;

      // Check for table structure
      console.log("Checking dishes table structure...");
      const tableStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'dishes'
        ORDER BY ordinal_position;
      `);

      console.log("Table structure:", tableStructure.rows);

      // Create query based on if image column exists
      const hasImageColumn = tableStructure.rows.some(
        (col) => col.column_name === "image"
      );

      let query;
      let values;

      if (hasImageColumn) {
        query = `
          INSERT INTO dishes 
            (name, description, category_id, price, preparation_time, image, created_at, updated_at) 
          VALUES 
            ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
          RETURNING id
        `;

        values = [
          name,
          description,
          category_id,
          price,
          preparation_time,
          image,
        ];
      } else {
        query = `
          INSERT INTO dishes 
            (name, description, category_id, price, preparation_time, created_at, updated_at) 
          VALUES 
            ($1, $2, $3, $4, $5, NOW(), NOW()) 
          RETURNING id
        `;

        values = [name, description, category_id, price, preparation_time];
        console.warn(
          "Warning: 'image' column doesn't exist in dishes table. Image will not be saved."
        );
      }

      console.log("Executing query:", query);
      console.log("With values:", values);

      const result = await pool.query(query, values);

      if (!result.rows || result.rows.length === 0) {
        throw new Error("Insert succeeded but no ID was returned");
      }

      return result.rows[0].id;
    } catch (error) {
      console.error("Error in createDish:", error);
      throw error;
    }
  }

  /**
   * Update a dish
   * @param {number} id - Dish ID
   * @param {Object} dishData - Updated dish data
   * @returns {Promise<void>}
   */
  static async updateDish(id, dishData) {
    try {
      const { name, description, category_id, price, preparation_time, image } =
        dishData;

      const query = `
        UPDATE dishes 
        SET 
          name = $1,
          description = $2,
          category_id = $3,
          price = $4,
          preparation_time = $5,
          image = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING id
      `;

      const values = [
        name,
        description,
        category_id,
        price,
        preparation_time,
        image,
        id,
      ];

      const result = await pool.query(query, values);

      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Update failed. No dish found with ID: ${id}`);
      }

      return result.rows[0].id;
    } catch (error) {
      console.error("Error in updateDish:", error);
      throw error;
    }
  }

  /**
   * Delete a dish
   * @param {number} id - Dish ID
   * @returns {Promise<void>}
   */
  static async deleteDish(id) {
    const query = "DELETE FROM dishes WHERE id = $1";
    await pool.query(query, [id]);
  }

  /**
   * Get sizes for a dish
   * @param {number} dishId - Dish ID
   * @returns {Promise<Array>} - Array of sizes
   */
  static async getDishSizes(dishId) {
    const query = `
      SELECT id, size_name, price_adjustment 
      FROM dish_sizes 
      WHERE dish_id = $1 
      ORDER BY price_adjustment ASC
    `;

    const result = await pool.query(query, [dishId]);
    return result.rows;
  }

  /**
   * Add a size option to a dish
   * @param {number} dishId - Dish ID
   * @param {Object} sizeData - Size data {size_name, price_adjustment}
   * @returns {Promise<number>} - ID of the created size
   */
  static async addDishSize(dishId, sizeData) {
    try {
      // Check if sizeData is already an object or a string that needs parsing
      const { size_name, price_adjustment } =
        typeof sizeData === "string" ? JSON.parse(sizeData) : sizeData;

      const query = `
        INSERT INTO dish_sizes 
          (dish_id, size_name, price_adjustment) 
        VALUES 
          ($1, $2, $3) 
        RETURNING id
      `;

      const result = await pool.query(query, [
        dishId,
        size_name,
        price_adjustment,
      ]);

      return result.rows[0].id;
    } catch (error) {
      console.error("Error in addDishSize:", error);
      throw error;
    }
  }

  /**
   * Remove all sizes for a dish
   * @param {number} dishId - Dish ID
   * @returns {Promise<void>}
   */
  static async removeDishSizes(dishId) {
    const query = "DELETE FROM dish_sizes WHERE dish_id = $1";
    await pool.query(query, [dishId]);
  }

  /**
   * Get toppings for a dish
   * @param {number} dishId - Dish ID
   * @returns {Promise<Array>} - Array of toppings
   */
  static async getDishToppings(dishId) {
    const query = `
      SELECT t.id, t.name, t.price 
      FROM toppings t
      JOIN dish_toppings dt ON t.id = dt.topping_id
      WHERE dt.dish_id = $1
    `;

    const result = await pool.query(query, [dishId]);
    return result.rows;
  }

  /**
   * Add a topping to a dish
   * @param {number} dishId - Dish ID
   * @param {number} toppingId - Topping ID
   * @returns {Promise<void>}
   */
  static async addDishTopping(dishId, toppingId) {
    try {
      const query = `
        INSERT INTO dish_toppings 
          (dish_id, topping_id) 
        VALUES 
          ($1, $2) 
        ON CONFLICT (dish_id, topping_id) DO NOTHING
        RETURNING id
      `;

      const result = await pool.query(query, [dishId, toppingId]);
      return result.rows[0]?.id;
    } catch (error) {
      console.error("Error in addDishTopping:", error);
      throw error;
    }
  }

  /**
   * Remove all toppings for a dish
   * @param {number} dishId - Dish ID
   * @returns {Promise<void>}
   */
  static async removeDishToppings(dishId) {
    const query = "DELETE FROM dish_toppings WHERE dish_id = $1";
    await pool.query(query, [dishId]);
  }

  /**
   * Get ratings for a dish
   * @param {number} dishId - Dish ID
   * @returns {Promise<Array>} - Array of ratings
   */
  static async getDishRatings(dishId) {
    const query = `
      SELECT 
        dr.id, 
        dr.rating, 
        dr.created_at,
        u.username,
        u.full_name
      FROM dish_ratings dr
      JOIN users u ON dr.user_id = u.user_id
      WHERE dr.dish_id = $1
      ORDER BY dr.created_at DESC
    `;

    const result = await pool.query(query, [dishId]);
    return result.rows;
  }

  /**
   * Get a user's rating for a dish
   * @param {number} dishId - Dish ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Rating data
   */
  static async getUserRating(dishId, userId) {
    const query = `
      SELECT id, rating
      FROM dish_ratings
      WHERE dish_id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [dishId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Add a rating to a dish
   * @param {number} dishId - Dish ID
   * @param {string} userId - User ID
   * @param {number} rating - Rating (1-5)
   * @returns {Promise<number>} - ID of the created ratingb
   */
  static async addRating(dishId, userId, rating) {
    try {
      // Thêm kiểm tra chi tiết
      console.log("Adding rating with values:", {
        dishId: dishId,
        userId: userId,
        rating: rating,
        typeOfDishId: typeof dishId,
        typeOfUserId: typeof userId,
        typeOfRating: typeof rating,
      });

      // Chuyển đổi các tham số nếu cần
      const parsedDishId = parseInt(dishId);
      const parsedRating = parseInt(rating);

      // Kiểm tra giá trị null hoặc undefined
      if (!parsedDishId || isNaN(parsedDishId)) {
        throw new Error("Invalid dish ID");
      }

      if (!userId) {
        throw new Error("User ID cannot be null or undefined");
      }

      if (
        !parsedRating ||
        isNaN(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        throw new Error("Rating must be a number between 1 and 5");
      }

      const query = `
        INSERT INTO dish_ratings 
          (dish_id, user_id, rating, created_at, updated_at) 
        VALUES 
          ($1, $2, $3, NOW(), NOW()) 
        RETURNING id
      `;

      const result = await pool.query(query, [
        parsedDishId,
        userId,
        parsedRating,
      ]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error("Insert succeeded but no ID was returned");
      }

      return result.rows[0].id;
    } catch (error) {
      console.error("Error in addRating:", error);
      // Thêm thông tin chi tiết về lỗi
      if (error.code === "23502") {
        // Mã lỗi của PostgreSQL cho NOT NULL violation
        console.error("NOT NULL constraint failed. Check your values:", {
          dishId,
          userId,
          rating,
        });
      }
      throw error;
    }
  }

  /**
   * Update a rating
   * @param {number} ratingId - Rating ID
   * @param {number} rating - New rating (1-5)
   * @returns {Promise<void>}
   */
  static async updateRating(ratingId, rating) {
    const query = `
      UPDATE dish_ratings 
      SET 
        rating = $1, 
        updated_at = NOW() 
      WHERE id = $2
    `;

    await pool.query(query, [rating, ratingId]);
  }

  /**
   * Search dishes by name or description
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of matching dish names
   */
  static async searchDishes(query) {
    const searchQuery = `
      SELECT id, name 
      FROM dishes 
      WHERE 
        name ILIKE $1 OR 
        description ILIKE $1
      LIMIT 10
    `;

    const result = await pool.query(searchQuery, [`%${query}%`]);
    return result.rows;
  }

  /**
   * Get all dish categories
   * @returns {Promise<Array>} - Array of categories
   */
  static async getDishCategories() {
    const query = `
      SELECT DISTINCT category 
      FROM dishes 
      ORDER BY category
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => row.category);
  }

  /**
   * Get popular dishes
   * @param {number} limit - Number of dishes to return
   * @returns {Promise<Array>} - Array of popular dishes
   */
  static async getPopularDishes(limit) {
    const query = `
      SELECT d.*, 
            COALESCE(AVG(dr.rating), 0) as average_rating,
            COUNT(dr.id) as ratings_count
      FROM dishes d
      LEFT JOIN dish_ratings dr ON d.id = dr.dish_id
      GROUP BY d.id
      ORDER BY average_rating DESC, ratings_count DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get combo dishes
   * @param {number} limit - Number of items per page
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Count and rows of combo dishes
   */
  static async getComboDishes(limit, offset) {
    const countQuery = "SELECT COUNT(*) FROM dishes WHERE category = 'Combo'";
    const dishesQuery = `
      SELECT * FROM dishes 
      WHERE category = 'Combo'
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    const countResult = await pool.query(countQuery);
    const dishesResult = await pool.query(dishesQuery, [limit, offset]);

    return {
      count: parseInt(countResult.rows[0].count),
      rows: dishesResult.rows,
    };
  }
}

module.exports = DishModel;
