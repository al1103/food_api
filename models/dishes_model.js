const { sql, poolPromise } = require("../config/database");

class DishModel {
  static async getAllDishes() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          DishID,
          Name,
          Description,
          Price,
          ImageURL,
          Rating,
          CreatedAt,
          UpdatedAt
        FROM Dishes
        ORDER BY Name ASC
      `);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách món ăn:", error);
      throw error;
    }
  }

  static async getDishById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("dishId", sql.Int, id).query(`
          SELECT * FROM Dishes WHERE DishID = @dishId
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
        .input("name", sql.NVarChar(100), dishData.name)
        .input("description", sql.NVarChar(500), dishData.description)
        .input("price", sql.Decimal(10, 2), dishData.price)
        .input("imageUrl", sql.NVarChar(255), dishData.imageUrl)
        .input("rating", sql.Decimal(3, 2), 0).query(`
          INSERT INTO Dishes (
            Name, Description, Price, ImageURL, Rating, CreatedAt, UpdatedAt
          ) VALUES (
            @name, @description, @price, @imageUrl, @rating, GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS DishID;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi tạo món ăn:", error);
      throw error;
    }
  }

  static async updateDish(id, dishData) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("dishId", sql.Int, id)
        .input("name", sql.NVarChar(100), dishData.name)
        .input("description", sql.NVarChar(500), dishData.description)
        .input("price", sql.Decimal(10, 2), dishData.price)
        .input("imageUrl", sql.NVarChar(255), dishData.imageUrl).query(`
          UPDATE Dishes 
          SET Name = @name,
              Description = @description,
              Price = @price,
              ImageURL = @imageUrl,
              UpdatedAt = GETDATE()
          WHERE DishID = @dishId
        `);
    } catch (error) {
      console.error("Lỗi khi cập nhật món ăn:", error);
      throw error;
    }
  }

  static async deleteDish(id) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("dishId", sql.Int, id)
        .query("DELETE FROM Dishes WHERE DishID = @dishId");
    } catch (error) {
      console.error("Lỗi khi xóa món ăn:", error);
      throw error;
    }
  }
}

module.exports = DishModel;
