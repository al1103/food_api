const { sql, poolPromise } = require("../config/database");

class DishModel {
  static async getAllDishes({
    page = 1,
    limit = 10,
    sortBy = "Name",
    sortOrder = "ASC",
    category,
    search,
  }) {
    try {
      const pool = await poolPromise;
      const offset = (page - 1) * limit;

      // Build the WHERE clause if filters exist
      let whereClause = "";
      const inputs = [];
      if (category) {
        whereClause += " WHERE Category = @category";
        inputs.push({
          name: "category",
          type: sql.NVarChar(100),
          value: category,
        });
      }
      if (search) {
        whereClause += inputs.length > 0 ? " AND" : " WHERE";
        whereClause += " Name LIKE '%' + @search + '%'";
        inputs.push({ name: "search", type: sql.NVarChar(100), value: search });
      }

      // Build the final queries
      const dataQuery = `
        SELECT 
          DishID,
          Name,
          Description,
          Price,
          ImageURL,
          Rating,
          Category,
          CreatedAt,
          UpdatedAt
        FROM Dishes
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      `;
      const countQuery = `
        SELECT COUNT(*) AS totalCount FROM Dishes
        ${whereClause};
      `;

      // Prepare request
      const request = pool.request();
      inputs.forEach((input) => {
        request.input(input.name, input.type, input.value);
      });
      request.input("offset", sql.Int, offset);
      request.input("limit", sql.Int, limit);

      const [dataResult, countResult] = await Promise.all([
        request.query(dataQuery),
        request.query(countQuery),
      ]);

      const totalCount = countResult.recordset[0].totalCount;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        dishes: dataResult.recordset,
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
      const pool = await poolPromise;
      const result = await pool.request().input("dishId", sql.Int, parsedId)
        .query(`
          SELECT 
            DishID,
            Name,
            Description,
            Price,
            ImageURL,
            Rating,
            Category,
            CreatedAt,
            UpdatedAt
          FROM Dishes 
          WHERE DishID = @dishId
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin món ăn:", error);
      throw error;
    }
  }

  static async createDish(dishData) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Name", sql.NVarChar(100), dishData.name)
        .input("Description", sql.NVarChar(sql.MAX), dishData.description)
        .input("Price", sql.Decimal(10, 2), dishData.price)
        .input("ImageURL", sql.NVarChar(255), dishData.imageUrl)
        .input("Category", sql.NVarChar(100), dishData.category).query(`
          INSERT INTO Dishes (Name, Description, Price, ImageURL, Category, CreatedAt, UpdatedAt)
          VALUES (@Name, @Description, @Price, @ImageURL, @Category, GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS DishID;
        `);
      const newDishId = result.recordset[0].DishID;
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
      const pool = await poolPromise;
      await pool
        .request()
        .input("DishID", sql.Int, parsedId)
        .input("Name", sql.NVarChar(100), dishData.name)
        .input("Description", sql.NVarChar(sql.MAX), dishData.description)
        .input("Price", sql.Decimal(10, 2), dishData.price)
        .input("ImageURL", sql.NVarChar(255), dishData.imageUrl)
        .input("Category", sql.NVarChar(100), dishData.category).query(`
          UPDATE Dishes
          SET Name = @Name,
              Description = @Description,
              Price = @Price,
              ImageURL = @ImageURL,
              Category = @Category,
              UpdatedAt = GETDATE()
          WHERE DishID = @DishID;
        `);
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
      const pool = await poolPromise;
      await pool.request().input("DishID", sql.Int, parsedId).query(`
          DELETE FROM Dishes WHERE DishID = @DishID;
        `);
      return { message: "Xóa món ăn thành công" };
    } catch (error) {
      console.error("Lỗi khi xóa món ăn:", error);
      throw error;
    }
  }
}

module.exports = DishModel;
