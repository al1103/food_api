const { sql, poolPromise } = require("../config/database");

class FoodModel {
  static async getAllFoods() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          FoodID,
          Name,
          Description,
          Price,
          Rating,
          ImageUrl,
          created_at,
          updated_at
        FROM Foods
        ORDER BY Name ASC
      `);
      return result.recordset;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách món ăn:", error);
      throw error;
    }
  }

  static async getFoodById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("foodId", sql.Int, id).query(`
          SELECT * FROM Foods WHERE FoodID = @foodId
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin món ăn:", error);
      throw error;
    }
  }

  static async createFood(foodData) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("name", sql.NVarChar(100), foodData.name)
        .input("description", sql.NVarChar(500), foodData.description)
        .input("price", sql.Decimal(10, 2), foodData.price)
        .input("rating", sql.Decimal(3, 2), foodData.rating || 0)
        .input("imageUrl", sql.NVarChar(255), foodData.imageUrl).query(`
          INSERT INTO Foods (
            Name, Description, Price, Rating, ImageUrl, created_at, updated_at
          ) VALUES (
            @name, @description, @price, @rating, @imageUrl, GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS FoodID;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Lỗi khi tạo món ăn mới:", error);
      throw error;
    }
  }

  static async updateFood(id, foodData) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("foodId", sql.Int, id)
        .input("name", sql.NVarChar(100), foodData.name)
        .input("description", sql.NVarChar(500), foodData.description)
        .input("price", sql.Decimal(10, 2), foodData.price)
        .input("rating", sql.Decimal(3, 2), foodData.rating)
        .input("imageUrl", sql.NVarChar(255), foodData.imageUrl).query(`
          UPDATE Foods SET
            Name = @name,
            Description = @description,
            Price = @price,
            Rating = @rating,
            ImageUrl = @imageUrl,
            updated_at = GETDATE()
          WHERE FoodID = @foodId
        `);
    } catch (error) {
      console.error("Lỗi khi cập nhật món ăn:", error);
      throw error;
    }
  }

  static async deleteFood(id) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("foodId", sql.Int, id)
        .query("DELETE FROM Foods WHERE FoodID = @foodId");
    } catch (error) {
      console.error("Lỗi khi xóa món ăn:", error);
      throw error;
    }
  }
}

module.exports = FoodModel;
