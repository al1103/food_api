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
    isCombo,
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
        whereConditions.push(`d.category = $${paramCount++}`);
        queryParams.push(category);
      }

      // Search by name (fuzzy search)
      if (search) {
        whereConditions.push(`d.name ILIKE $${paramCount++}`);
        queryParams.push(`%${search}%`);
      }

      // Price range filter (now filtering on minimum size price)
      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        whereConditions.push(
          `(SELECT MIN(ds.price) FROM dish_sizes ds WHERE ds.dish_id = d.dish_id) >= $${paramCount++}`
        );
        queryParams.push(parseFloat(minPrice));
      }

      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        whereConditions.push(
          `(SELECT MIN(ds.price) FROM dish_sizes ds WHERE ds.dish_id = d.dish_id) <= $${paramCount++}`
        );
        queryParams.push(parseFloat(maxPrice));
      }

      // Combo filter
      if (isCombo !== undefined) {
        whereConditions.push(`d.is_combo = $${paramCount++}`);
        queryParams.push(isCombo === "true" || isCombo === true);
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
      const sortColumn = allowedColumns.includes(sortBy.toLowerCase())
        ? sortBy.toLowerCase()
        : "name";
      const sortDir = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

      // Special handling for price sorting since it's now in the dish_sizes table
      let orderBy;
      if (sortColumn === "price") {
        orderBy = `(SELECT MIN(ds.price) FROM dish_sizes ds WHERE ds.dish_id = d.dish_id) ${sortDir}`;
      } else {
        orderBy = `d.${sortColumn} ${sortDir}`;
      }

      // Data query with pagination
      const dataQuery = `
        SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.description AS "description",
          d.image_url AS "imageUrl",
          d.rating AS "rating",
          d.category AS "category",
          d.is_combo AS "isCombo",
          (SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'sizeId', ds.size_id, 
              'sizeName', ds.size_name, 
              'price', ds.price, 
              'isDefault', ds.is_default,
              'isAvailable', ds.is_available
            )
          ) FROM dish_sizes ds WHERE ds.dish_id = d.dish_id) AS "sizes",
          d.is_available AS "isAvailable",
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt"
        FROM dishes d
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;

      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) AS "totalCount" FROM dishes d
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

      // For combo dishes, fetch their components
      const dishes = await Promise.all(
        dataResult.rows.map(async (dish) => {
          if (dish.isCombo) {
            dish.comboItems = await this.getComboItems(dish.dishId);
          }
          return dish;
        })
      );

      return {
        dishes,
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

  static async getDishById(id) {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        throw new Error(`Invalid dish id: ${id}`);
      }

      const dishQuery = `
        SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.description AS "description",
          d.image_url AS "imageUrl",
          d.rating AS "rating",
          d.category AS "category",
          d.is_combo AS "isCombo",
          d.is_available AS "isAvailable",
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt"
        FROM dishes d
        WHERE d.dish_id = $1`;

      const sizesQuery = `
        SELECT
          size_id AS "sizeId",
          size_name AS "sizeName",
          price,
          is_default AS "isDefault",
          is_available AS "isAvailable"
        FROM dish_sizes
        WHERE dish_id = $1
        ORDER BY price ASC`;

      // Execute both queries
      const [dishResult, sizesResult] = await Promise.all([
        pool.query(dishQuery, [parsedId]),
        pool.query(sizesQuery, [parsedId]),
      ]);

      if (dishResult.rows.length === 0) {
        return null;
      }

      const dish = dishResult.rows[0];
      dish.sizes = sizesResult.rows;

      // If this is a combo, get its components
      if (dish.isCombo) {
        dish.comboItems = await this.getComboItems(parsedId);
      }

      return dish;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin món ăn:", error);
      throw error;
    }
  }

  static async getComboItems(comboId) {
    try {
      const query = `
        SELECT 
          ci.combo_item_id AS "comboItemId",
          ci.dish_id AS "dishId",
          d.name AS "dishName",
          d.image_url AS "imageUrl",
          ci.quantity,
          ci.is_required AS "isRequired",
          ci.max_selections AS "maxSelections",
          ci.size_id AS "sizeId",
          ds.size_name AS "sizeName",
          ds.price AS "itemPrice"
        FROM combo_items ci
        JOIN dishes d ON ci.dish_id = d.dish_id
        LEFT JOIN dish_sizes ds ON ci.size_id = ds.size_id
        WHERE ci.combo_id = $1
        ORDER BY ci.is_required DESC, d.name ASC`;

      const result = await pool.query(query, [comboId]);
      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy thành phần combo:", error);
      throw error;
    }
  }

  static async createDish(dishData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert the basic dish information
      const dishResult = await client.query(
        `INSERT INTO dishes 
          (name, description, image_url, category, is_combo, is_available, created_at, updated_at)
        VALUES 
          ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING dish_id`,
        [
          dishData.name,
          dishData.description,
          dishData.imageUrl,
          dishData.category,
          dishData.isCombo || false,
          dishData.isAvailable !== undefined ? dishData.isAvailable : true,
        ]
      );

      const newDishId = dishResult.rows[0].dish_id;

      // 2. Insert size information
      if (dishData.sizes && dishData.sizes.length > 0) {
        for (const size of dishData.sizes) {
          await client.query(
            `INSERT INTO dish_sizes 
              (dish_id, size_name, price, is_default, is_available)
            VALUES 
              ($1, $2, $3, $4, $5)`,
            [
              newDishId,
              size.sizeName,
              size.price,
              size.isDefault || false,
              size.isAvailable !== undefined ? size.isAvailable : true,
            ]
          );
        }
      } else {
        // If no sizes provided, create a default size
        await client.query(
          `INSERT INTO dish_sizes 
            (dish_id, size_name, price, is_default, is_available)
          VALUES 
            ($1, 'Default', $2, true, true)`,
          [newDishId, dishData.price || 0]
        );
      }

      // 3. If it's a combo, insert combo items
      if (
        dishData.isCombo &&
        dishData.comboItems &&
        dishData.comboItems.length > 0
      ) {
        for (const item of dishData.comboItems) {
          await client.query(
            `INSERT INTO combo_items 
              (combo_id, dish_id, quantity, size_id, is_required, max_selections)
            VALUES 
              ($1, $2, $3, $4, $5, $6)`,
            [
              newDishId,
              item.dishId,
              item.quantity || 1,
              item.sizeId || null,
              item.isRequired || false,
              item.maxSelections || 1,
            ]
          );
        }
      }

      await client.query("COMMIT");
      return await this.getDishById(newDishId);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi tạo món ăn:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateDish(id, dishData) {
    const client = await pool.connect();
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error(`Invalid dish id: ${id}`);

      await client.query("BEGIN");

      // 1. Update the basic dish information
      await client.query(
        `UPDATE dishes
        SET 
          name = $1,
          description = $2,
          image_url = $3,
          category = $4,
          is_combo = $5,
          is_available = $6,
          updated_at = NOW()
        WHERE dish_id = $7`,
        [
          dishData.name,
          dishData.description,
          dishData.imageUrl,
          dishData.category,
          dishData.isCombo || false,
          dishData.isAvailable !== undefined ? dishData.isAvailable : true,
          parsedId,
        ]
      );

      // 2. Handle size information updates
      if (dishData.sizes && dishData.sizes.length > 0) {
        // Get existing sizes
        const currentSizes = await client.query(
          `SELECT size_id FROM dish_sizes WHERE dish_id = $1`,
          [parsedId]
        );

        const existingSizeIds = currentSizes.rows.map((row) => row.size_id);
        const updatedSizeIds = dishData.sizes
          .filter((size) => size.sizeId)
          .map((size) => parseInt(size.sizeId));

        // Delete sizes that are no longer present
        const sizesToDelete = existingSizeIds.filter(
          (id) => !updatedSizeIds.includes(id)
        );
        if (sizesToDelete.length > 0) {
          await client.query(`DELETE FROM dish_sizes WHERE size_id = ANY($1)`, [
            sizesToDelete,
          ]);
        }

        // Update or insert sizes
        for (const size of dishData.sizes) {
          if (size.sizeId) {
            // Update existing size
            await client.query(
              `UPDATE dish_sizes
              SET 
                size_name = $1,
                price = $2,
                is_default = $3,
                is_available = $4,
                updated_at = NOW()
              WHERE size_id = $5`,
              [
                size.sizeName,
                size.price,
                size.isDefault || false,
                size.isAvailable !== undefined ? size.isAvailable : true,
                size.sizeId,
              ]
            );
          } else {
            // Insert new size
            await client.query(
              `INSERT INTO dish_sizes 
                (dish_id, size_name, price, is_default, is_available)
              VALUES 
                ($1, $2, $3, $4, $5)`,
              [
                parsedId,
                size.sizeName,
                size.price,
                size.isDefault || false,
                size.isAvailable !== undefined ? size.isAvailable : true,
              ]
            );
          }
        }
      }

      // 3. If it's a combo, update combo items
      if (dishData.isCombo) {
        // Delete existing combo items if we're updating the list
        if (dishData.comboItems) {
          await client.query(`DELETE FROM combo_items WHERE combo_id = $1`, [
            parsedId,
          ]);

          // Insert new combo items
          for (const item of dishData.comboItems) {
            await client.query(
              `INSERT INTO combo_items 
                (combo_id, dish_id, quantity, size_id, is_required, max_selections)
              VALUES 
                ($1, $2, $3, $4, $5, $6)`,
              [
                parsedId,
                item.dishId,
                item.quantity || 1,
                item.sizeId || null,
                item.isRequired || false,
                item.maxSelections || 1,
              ]
            );
          }
        }
      }

      await client.query("COMMIT");
      return await this.getDishById(parsedId);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi cập nhật món ăn:", error);
      throw error;
    } finally {
      client.release();
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

  static async updateSizeAvailability(sizeId, isAvailable) {
    try {
      const parsedId = parseInt(sizeId);
      if (isNaN(parsedId)) throw new Error(`Invalid size id: ${sizeId}`);

      const query = `
        UPDATE dish_sizes 
        SET is_available = $1, updated_at = NOW() 
        WHERE size_id = $2 
        RETURNING *
      `;
      const result = await pool.query(query, [isAvailable, parsedId]);

      if (result.rows.length === 0) {
        throw new Error("Size not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái kích thước món ăn:", error);
      throw error;
    }
  }

  static async deleteDish(id) {
    try {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) throw new Error(`Invalid dish id: ${id}`);

      // The foreign key constraints will cascade the delete to sizes and combo items
      await pool.query("DELETE FROM dishes WHERE dish_id = $1", [parsedId]);

      return { message: "Xóa món ăn thành công" };
    } catch (error) {
      console.error("Lỗi khi xóa món ăn:", error);
      throw error;
    }
  }

  // Add method to get related dishes (dishes in same category)
  static async getRelatedDishes(dishId, limit = 4) {
    try {
      const parsedId = parseInt(dishId);
      if (isNaN(parsedId)) {
        throw new Error(`Invalid dish id: ${dishId}`);
      }

      const query = `
        SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.description AS "description",
          d.image_url AS "imageUrl",
          d.rating AS "rating",
          d.category AS "category",
          d.is_combo AS "isCombo",
          (SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'sizeId', ds.size_id, 
              'sizeName', ds.size_name, 
              'price', ds.price, 
              'isDefault', ds.is_default,
              'isAvailable', ds.is_available
            )
          ) FROM dish_sizes ds WHERE ds.dish_id = d.dish_id) AS "sizes",
          d.is_available AS "isAvailable"
        FROM dishes d
        WHERE d.category = (SELECT category FROM dishes WHERE dish_id = $1)
          AND d.dish_id != $1
          AND d.is_available = true
        ORDER BY d.rating DESC
        LIMIT $2`;

      const result = await pool.query(query, [parsedId, limit]);
      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy món ăn liên quan:", error);
      throw error;
    }
  }

  // Add method to update dish rating
  static async updateDishRating(dishId, rating) {
    try {
      const parsedId = parseInt(dishId);
      const parsedRating = parseFloat(rating);

      if (isNaN(parsedId)) {
        throw new Error(`Invalid dish id: ${dishId}`);
      }

      if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        throw new Error("Rating must be a number between 0 and 5");
      }

      const query = `
        UPDATE dishes 
        SET rating = $1, updated_at = NOW() 
        WHERE dish_id = $2 
        RETURNING dish_id, name, rating`;

      const result = await pool.query(query, [parsedRating, parsedId]);

      if (result.rows.length === 0) {
        throw new Error("Dish not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Lỗi khi cập nhật đánh giá món ăn:", error);
      throw error;
    }
  }

  // Add method to get featured dishes for homepage
  static async getFeaturedDishes(limit = 6) {
    try {
      // Get a mix of highest-rated and newest dishes
      const query = `
        (SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.description AS "description",
          d.image_url AS "imageUrl",
          d.rating AS "rating",
          d.category AS "category",
          d.is_combo AS "isCombo",
          (SELECT MIN(price) FROM dish_sizes WHERE dish_id = d.dish_id) AS "minPrice",
          d.is_available AS "isAvailable"
        FROM dishes d
        WHERE d.is_available = true
        ORDER BY d.rating DESC
        LIMIT $1/2)
        
        UNION
        
        (SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.description AS "description",
          d.image_url AS "imageUrl",
          d.rating AS "rating",
          d.category AS "category",
          d.is_combo AS "isCombo",
          (SELECT MIN(price) FROM dish_sizes WHERE dish_id = d.dish_id) AS "minPrice",
          d.is_available AS "isAvailable"
        FROM dishes d
        WHERE d.is_available = true
        ORDER BY d.created_at DESC
        LIMIT $1/2)`;

      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error("Lỗi khi lấy món ăn nổi bật:", error);
      throw error;
    }
  }

  // Add method to bulk update dish availability
  static async bulkUpdateAvailability(dishIds, isAvailable) {
    const client = await pool.connect();
    try {
      // Validate input
      if (!Array.isArray(dishIds) || dishIds.length === 0) {
        throw new Error("dishIds must be a non-empty array");
      }

      if (typeof isAvailable !== "boolean") {
        throw new Error("isAvailable must be a boolean value");
      }

      // Parse all IDs to integers
      const parsedIds = dishIds.map((id) => {
        const parsed = parseInt(id);
        if (isNaN(parsed)) {
          throw new Error(`Invalid dish id: ${id}`);
        }
        return parsed;
      });

      await client.query("BEGIN");

      // Update dish availability
      const dishResult = await client.query(
        `UPDATE dishes
        SET is_available = $1, updated_at = NOW()
        WHERE dish_id = ANY($2)
        RETURNING dish_id, name, is_available`,
        [isAvailable, parsedIds]
      );

      await client.query("COMMIT");

      return {
        message: isAvailable
          ? "Các món ăn đã được kích hoạt"
          : "Các món ăn đã bị vô hiệu hóa",
        updatedDishes: dishResult.rows,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi cập nhật trạng thái nhiều món ăn:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = DishModel;
