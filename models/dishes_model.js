const { pool } = require("../config/database");

class DishModel {
  static async getAllDishes({
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "ASC",
    category,
    search,
    minPrice,
    maxPrice,
  }) {
    try {
      // Convert page and limit to integers
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      // Build query parts
      let queryParams = [];
      let paramCount = 1;
      let whereConditions = [];

      // Category filter
      if (category) {
        whereConditions.push(`category = $${paramCount++}`);
        queryParams.push(category);
      }

      // Search by name (fuzzy search)
      if (search) {
        whereConditions.push(`name ILIKE $${paramCount++}`);
        queryParams.push(`%${search}%`);
      }

      // Price range filter
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        whereConditions.push(`price >= $${paramCount++}`);
        queryParams.push(parseFloat(minPrice));
      }

      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        whereConditions.push(`price <= $${paramCount++}`);
        queryParams.push(parseFloat(maxPrice));
      }

      // Build WHERE clause
      let whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Validate sortBy and sortOrder to prevent SQL injection
      const allowedColumns = [
        "dish_id",
        "name",
        "price",
        "rating",
        "category",
        "created_at",
        "updated_at",
      ];
      sortBy = allowedColumns.includes(sortBy.toLowerCase())
        ? sortBy.toLowerCase()
        : "name";
      sortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

      // Data query with pagination
      const dataQuery = `
        SELECT 
          dish_id AS "dishId",
          name AS "name",
          description AS "description",
          price AS "price",
          image_url AS "imageUrl",
          rating AS "rating",
          category AS "category",
          is_available AS "isAvailable",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM dishes
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;

      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) AS "totalCount" FROM dishes
        ${whereClause}
      `;

      // Add pagination parameters
      queryParams.push(limit, offset);

      // Execute both queries in parallel
      const [dataResult, countResult] = await Promise.all([
        pool.query(dataQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, paramCount - 3)),
      ]);

      const totalCount = parseInt(countResult.rows[0].totalCount);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        dishes: dataResult.rows,
        pagination: {
          totalItems: totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Lỗi khi lấy danh sách món ăn:", error);
      throw error;
    }
  }

  // Thêm phương thức gợi ý tên món ăn khi tìm kiếm
  static async getSearchSuggestions(searchText, limit = 5) {
    try {
      const query = `
        SELECT 
          dish_id AS "dishId",
          name,
          category,
          price,
          image_url AS "imageUrl"
        FROM dishes
        WHERE name ILIKE $1
        ORDER BY 
          CASE 
            WHEN name ILIKE $2 THEN 1 -- Exact match at beginning
            WHEN name ILIKE $3 THEN 2 -- Exact match anywhere
            ELSE 3                     -- Partial match
          END,
          popularity DESC,
          name ASC
        LIMIT $4
      `;

      const params = [
        `%${searchText}%`, // Partial match anywhere
        `${searchText}%`, // Exact match at beginning
        `%${searchText}%`, // Exact match anywhere
        limit,
      ];

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy gợi ý tìm kiếm:", error);
      throw error;
    }
  }

  static async updateDishAvailability(id, isAvailable) {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error(`Invalid dish id: ${id}`);

      const query = `
        UPDATE dishes 
        SET is_available = $1, updated_at = NOW() 
        WHERE dish_id = $2 
        RETURNING *
      `;
      const result = await pool.query(query, [isAvailable, parsedId]);

      if (result.rows.length === 0) {
        throw new Error("Dish not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái món ăn:", error);
      throw error;
    }
  }

  static async getDishById(id) {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        throw new Error(`Invalid dish id: ${id}`);
      }

      const result = await pool.query(
        `SELECT 
          dish_id AS "dishId",
          name AS "name",
          description AS "description",
          price AS "price",
          image_url AS "imageUrl",
          rating AS "rating",
          category AS "category",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM dishes 
        WHERE dish_id = $1`,
        [parsedId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin món ăn:", error);
      throw error;
    }
  }

  static async createDish(dishData) {
    try {
      const result = await pool.query(
        `INSERT INTO dishes 
          (name, description, price, image_url, category, created_at, updated_at)
        VALUES 
          ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING dish_id`,
        [
          dishData.name,
          dishData.description,
          dishData.price,
          dishData.imageUrl,
          dishData.category,
        ]
      );

      const newDishId = result.rows[0].dish_id;
      return await this.getDishById(newDishId);
    } catch (error) {
      console.error("Lỗi khi tạo món ăn:", error);
      throw error;
    }
  }

  static async updateDish(id, dishData) {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error(`Invalid dish id: ${id}`);

      await pool.query(
        `UPDATE dishes
        SET 
          name = $1,
          description = $2,
          price = $3,
          image_url = $4,
          category = $5,
          updated_at = NOW()
        WHERE dish_id = $6`,
        [
          dishData.name,
          dishData.description,
          dishData.price,
          dishData.imageUrl,
          dishData.category,
          parsedId,
        ]
      );

      return await this.getDishById(parsedId);
    } catch (error) {
      console.error("Lỗi khi cập nhật món ăn:", error);
      throw error;
    }
  }

  static async deleteDish(id) {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error(`Invalid dish id: ${id}`);

      await pool.query("DELETE FROM dishes WHERE dish_id = $1", [parsedId]);

      return { message: "Xóa món ăn thành công" };
    } catch (error) {
      console.error("Lỗi khi xóa món ăn:", error);
      throw error;
    }
  }
}

module.exports = DishModel;
