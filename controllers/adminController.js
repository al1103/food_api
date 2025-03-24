const { pool } = require("../config/database");
const UserModel = require("../models/user_model");
const fs = require("fs");
const { getPaginationParams } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const AdminModel = require("../models/admin_model");

// Food management functions
exports.createFood = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        statusCode: 500,
        message: "Tên món ăn, giá và danh mục là bắt buộc",
      });
    }

    const food = await AdminModel.createFood({
      name,
      description,
      price,
      imageUrl,
      category,
    });
    res.status(201).json({
      statusCode: 200,
      message: "Tạo món ăn thành công",
      data: food,
    });
  } catch (error) {
    console.error("Error creating food:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể tạo món ăn mới",
      error: error.message,
    });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const { name, description, price, imageUrl, category } = req.body;

    // Assuming FoodModel.getFoodById is still used for existence check
    const existingFood = await FoodModel.getFoodById(foodId);
    if (!existingFood) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    const updatedFood = await AdminModel.updateFood(foodId, {
      name,
      description,
      price,
      imageUrl,
      category,
    });
    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật món ăn thành công",
      data: updatedFood,
    });
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật món ăn",
      error: error.message,
    });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const existingFood = await FoodModel.getFoodById(foodId);
    if (!existingFood) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    await AdminModel.deleteFood(foodId);
    res.status(200).json({
      statusCode: 200,
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Error deleting food:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const result = await UserModel.getAllUsers(page, limit);

    res.status(200).json({
      statusCode: 200,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách người dùng",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        statusCode: 500,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: [user],
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin người dùng",
      error: error.message,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        statusCode: 400,
        message: "Vai trò người dùng là bắt buộc",
      });
    }

    const updatedUser = await UserModel.updateUserRole(userId, role);

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật vai trò người dùng thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật vai trò người dùng",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Không thể xóa tài khoản hiện tại đang đăng nhập",
      });
    }

    const result = await UserModel.deleteUser(userId);

    res.status(200).json({
      statusCode: 200,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa người dùng",
      error: error.message,
    });
  }
};
exports.getDashboardStats = async (req, res) => {
  try {
    // Get orders statistics
    const totalOrdersResult = await pool.query(
      "SELECT COUNT(*) AS total FROM orders"
    );
    const totalOrders = parseInt(totalOrdersResult.rows[0].total);

    const completedOrdersResult = await pool.query(
      "SELECT COUNT(*) AS total FROM orders WHERE status = 'completed'"
    );
    const completedOrders = parseInt(completedOrdersResult.rows[0].total);

    const pendingOrdersResult = await pool.query(
      "SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'"
    );
    const pendingOrders = parseInt(pendingOrdersResult.rows[0].total);

    // Calculate total revenue
    const revenueResult = await pool.query(
      "SELECT SUM(total_price) AS total FROM orders WHERE status = 'completed'"
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

    // Get reservation statistics
    const totalReservationsResult = await pool.query(
      "SELECT COUNT(*) AS total FROM reservations"
    );
    const totalReservations = parseInt(totalReservationsResult.rows[0].total);

    const todayReservationsResult = await pool.query(
      "SELECT COUNT(*) AS total FROM reservations WHERE reservation_time::date = CURRENT_DATE"
    );
    const todayReservations = parseInt(todayReservationsResult.rows[0].total);

    // Get table information
    const totalTablesResult = await pool.query(
      "SELECT COUNT(*) AS total FROM tables"
    );
    const totalTables = parseInt(totalTablesResult.rows[0].total);

    const availableTablesResult = await pool.query(
      "SELECT COUNT(*) AS total FROM tables WHERE status = 'available'"
    );
    const availableTables = parseInt(availableTablesResult.rows[0].total);

    // Get popular dishes (top 5)
    const popularDishesResult = await pool.query(`
      SELECT 
        d.id AS "dishId", 
        d.name AS "dishName",
        SUM(od.quantity) AS "count",
        d.price
      FROM order_details od
      JOIN dishes d ON od.dish_id = d.id
      JOIN orders o ON od.order_id = o.order_id
      WHERE o.status = 'completed'
      GROUP BY d.id, d.name, d.price
      ORDER BY "count" DESC
      LIMIT 5
    `);

    // Get dishes totals
    const dishCountResult = await pool.query(`
      SELECT COUNT(*) AS total,
      SUM(CASE WHEN available = true THEN 1 ELSE 0 END) AS available_count
      FROM dishes
    `);

    const dishesTotal = parseInt(dishCountResult.rows[0].total || 0);
    const dishesAvailable = parseInt(
      dishCountResult.rows[0].available_count || 0
    );

    // Send response
    res.status(200).json({
      statusCode: 200,
      data: [
        {
          orders: {
            total: totalOrders,
            completed: completedOrders,
            pending: pendingOrders,
          },
          revenue: {
            total: totalRevenue,
          },
          reservations: {
            total: totalReservations,
            today: todayReservations,
          },
          tables: {
            total: totalTables,
            available: availableTables,
          },
          dishes: {
            total: dishesTotal,
            available: dishesAvailable,
          },
          popularDishes: popularDishesResult.rows,
        },
      ],
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin tổng quan",
      error: error.message,
    });
  }
};

// Get all dishes with pagination, filtering, and sorting options
exports.getAllDishes = async (req, res) => {
  try {
    const {
      page,
      limit,
      sortBy = "dish_id",
      sortOrder = "ASC",
    } = getPaginationParams(req);
    const { category } = req.query;

    // Build query conditions
    let queryConditions = "";
    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      queryConditions = "WHERE category = $1";
      queryParams.push(category);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM dishes
      ${queryConditions}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination values
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Add pagination parameters
    const paginatedQueryParams = [...queryParams, limit, offset];

    // Get dishes with pagination
    const query = `
      SELECT 
        dish_id AS "dishId",
        name,
        description,
        price,
        image_url AS "imageUrl",
        rating,
        category,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM dishes
      ${queryConditions}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await pool.query(query, paginatedQueryParams);

    res.status(200).json({
      statusCode: 200,
      data: result.rows,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error getting dishes:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách món ăn",
      error: error.message,
    });
  }
};

// Get dish by ID
exports.getDishById = async (req, res) => {
  try {
    const dishId = req.params.id;

    if (!dishId || isNaN(parseInt(dishId))) {
      return res.status(400).json({
        statusCode: 400,
        message: "ID món ăn không hợp lệ",
      });
    }

    const query = `
      SELECT 
        dish_id AS "dishId",
        name,
        description,
        price,
        image_url AS "imageUrl",
        rating,
        category,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM dishes
      WHERE dish_id = $1
    `;

    const result = await pool.query(query, [dishId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting dish:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin món ăn",
      error: error.message,
    });
  }
};
// Create new dish
// Create new dish
exports.createDish = async (req, res) => {
  try {
    console.log("Creating a new dish");

    // Lấy dữ liệu từ body request
    const { name, description, price, category } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      // Xóa file tạm nếu có
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Không thể xóa file tạm:", err);
        });
      }
      return res.status(400).json({
        statusCode: 400,
        message: "Tên món ăn, giá và danh mục là bắt buộc",
      });
    }

    // Validate price
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      // Xóa file tạm nếu có
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Không thể xóa file tạm:", err);
        });
      }
      return res.status(400).json({
        statusCode: 400,
        message: "Giá món ăn không hợp lệ",
      });
    }

    // Biến để lưu URL ảnh
    let imageUrl = null;

    // Upload ảnh lên Cloudinary nếu có file
    if (req.file) {
      try {
        console.log("Uploading image to Cloudinary:", req.file.path);

        // Upload file lên Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "food_api/dishes", // Thư mục riêng cho dishes
            transformation: [{ width: 600, height: 600, crop: "limit" }],
          }
        );

        // Lưu URL của ảnh từ Cloudinary
        imageUrl = cloudinaryResult.secure_url;

        console.log("Image uploaded successfully:", imageUrl);

        // Xóa file tạm
        fs.unlinkSync(req.file.path);
        console.log("Temporary file deleted");
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);

        // Xóa file tạm nếu upload thất bại
        if (req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Không thể xóa file tạm:", err);
          });
        }

        return res.status(500).json({
          statusCode: 500,
          message: "Lỗi khi upload ảnh món ăn",
          error: uploadError.message,
        });
      }
    }

    // Thêm vào database
    const query = `
      INSERT INTO dishes (
        name, description, price, image_url, category, rating, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING 
        dish_id AS "dishId", 
        name, 
        description, 
        price, 
        image_url AS "imageUrl", 
        category, 
        rating, 
        created_at AS "createdAt"
    `;

    const result = await pool.query(query, [
      name,
      description || null,
      parseFloat(price),
      imageUrl, // URL từ Cloudinary hoặc null nếu không có ảnh
      category,
      0.0, // Initial rating
    ]);

    res.status(201).json({
      statusCode: 200,
      message: "Tạo món ăn mới thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating dish:", error);

    // Xóa file tạm nếu có lỗi
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Không thể xóa file tạm:", err);
      });
    }

    res.status(500).json({
      statusCode: 500,
      message: "Không thể tạo món ăn mới",
      error: error.message,
    });
  }
};
// Update dish
exports.updateDish = async (req, res) => {
  try {
    const dishId = req.params.id;
    const { name, description, price, category, rating } = req.body;

    // Check if dish exists
    const checkQuery = "SELECT image_url FROM dishes WHERE dish_id = $1";
    const checkResult = await pool.query(checkQuery, [dishId]);

    if (checkResult.rows.length === 0) {
      // Xóa file tạm nếu có
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Không thể xóa file tạm:", err);
        });
      }
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    // Lưu URL ảnh cũ (nếu có)
    const oldImageUrl = checkResult.rows[0].image_url;

    // Upload ảnh mới nếu có
    let imageUrl = undefined; // Không thay đổi ảnh mặc định

    if (req.file) {
      try {
        // Upload lên Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "food_api/dishes",
        });

        // Lưu URL ảnh mới
        imageUrl = result.secure_url;

        // Xóa file tạm
        fs.unlinkSync(req.file.path);

        // Xóa ảnh cũ trên Cloudinary nếu có
        if (oldImageUrl) {
          try {
            // Trích xuất public_id từ URL cũ
            const publicId = extractPublicIdFromUrl(oldImageUrl);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (deleteError) {
            console.error("Lỗi khi xóa ảnh cũ:", deleteError);
            // Tiếp tục không quan tâm đến lỗi xóa ảnh cũ
          }
        }
      } catch (uploadError) {
        console.error("Lỗi khi upload ảnh mới:", uploadError);

        // Xóa file tạm nếu upload thất bại
        if (req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Không thể xóa file tạm:", err);
          });
        }

        return res.status(500).json({
          statusCode: 500,
          message: "Lỗi khi upload ảnh món ăn",
          error: uploadError.message,
        });
      }
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (price !== undefined) {
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "Giá món ăn không hợp lệ",
        });
      }
      updates.push(`price = $${paramIndex++}`);
      values.push(parseFloat(price));
    }

    if (imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(imageUrl);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (rating !== undefined) {
      if (
        isNaN(parseFloat(rating)) ||
        parseFloat(rating) < 0 ||
        parseFloat(rating) > 5
      ) {
        return res.status(400).json({
          statusCode: 400,
          message: "Đánh giá không hợp lệ (0-5)",
        });
      }
      updates.push(`rating = $${paramIndex++}`);
      values.push(parseFloat(rating));
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    // If no fields to update
    if (updates.length === 1) {
      // Only updated_at
      return res.status(400).json({
        statusCode: 400,
        message: "Không có thông tin nào được cập nhật",
      });
    }

    // Add dish_id to values array
    values.push(dishId);

    const query = `
      UPDATE dishes
      SET ${updates.join(", ")}
      WHERE dish_id = $${paramIndex}
      RETURNING 
        dish_id AS "dishId", 
        name, 
        description, 
        price, 
        image_url AS "imageUrl", 
        category, 
        rating, 
        updated_at AS "updatedAt"
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật món ăn thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật món ăn",
      error: error.message,
    });
  }
};

// Delete dish
exports.deleteDish = async (req, res) => {
  try {
    const dishId = req.params.id;

    // Check if dish exists
    const checkQuery = "SELECT 1 FROM dishes WHERE dish_id = $1";
    const checkResult = await pool.query(checkQuery, [dishId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    // Check if dish is used in any orders
    const orderCheckQuery = `
      SELECT 1 FROM order_details WHERE dish_id = $1 LIMIT 1
    `;
    const orderCheckResult = await pool.query(orderCheckQuery, [dishId]);

    if (orderCheckResult.rows.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Không thể xóa món ăn đã được sử dụng trong đơn hàng",
      });
    }

    // Delete dish
    const deleteQuery = "DELETE FROM dishes WHERE dish_id = $1";
    await pool.query(deleteQuery, [dishId]);

    res.status(200).json({
      statusCode: 200,
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
};

// Get all tables with optional filtering and sorting
exports.getAllTables = async (req, res) => {
  try {
    const {
      page,
      limit,
      sortBy = "table_id",
      sortOrder = "ASC",
    } = getPaginationParams(req);
    const { status } = req.query;

    // Build query conditions
    let queryConditions = "";
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      queryConditions = "WHERE status = $1";
      queryParams.push(status);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM tables
      ${queryConditions}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination values
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Add pagination parameters
    const paginatedQueryParams = [...queryParams, limit, offset];

    // Get tables with pagination
    const query = `
      SELECT 
        table_id AS "tableId",
        table_number AS "tableNumber",
        capacity,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tables
      ${queryConditions}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await pool.query(query, paginatedQueryParams);

    res.status(200).json({
      statusCode: 200,
      data: result.rows,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách bàn",
      error: error.message,
    });
  }
};

// Get table by ID
exports.getTableById = async (req, res) => {
  try {
    const tableId = req.params.id;

    if (!tableId || isNaN(parseInt(tableId))) {
      return res.status(400).json({
        statusCode: 400,
        message: "ID bàn không hợp lệ",
      });
    }

    const query = `
      SELECT 
        table_id AS "tableId",
        table_number AS "tableNumber",
        capacity,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tables
      WHERE table_id = $1
    `;

    const result = await pool.query(query, [tableId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 400,
        message: "Không tìm thấy bàn",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin bàn",
      error: error.message,
    });
  }
};

// Create new table
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status = "available" } = req.body;

    // Validate required fields
    if (!tableNumber || !capacity) {
      return res.status(400).json({
        statusCode: 400,
        message: "Số bàn và sức chứa là bắt buộc",
      });
    }

    // Validate table number and capacity
    if (isNaN(parseInt(tableNumber)) || parseInt(tableNumber) <= 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Số bàn không hợp lệ",
      });
    }

    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Sức chứa không hợp lệ",
      });
    }

    // Check if table number already exists
    const checkQuery = "SELECT 1 FROM tables WHERE table_number = $1";
    const checkResult = await pool.query(checkQuery, [tableNumber]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Số bàn đã tồn tại",
      });
    }

    // Validate status
    const validStatuses = ["available", "occupied", "reserved", "maintenance"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        statusCode: 500,
        message: "Trạng thái bàn không hợp lệ",
      });
    }

    const query = `
      INSERT INTO tables (
        table_number, capacity, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, NOW(), NOW()
      ) RETURNING 
        table_id AS "tableId", 
        table_number AS "tableNumber", 
        capacity, 
        status, 
        created_at AS "createdAt"
    `;

    const result = await pool.query(query, [
      parseInt(tableNumber),
      parseInt(capacity),
      status,
    ]);

    res.status(201).json({
      statusCode: 200,
      message: "Tạo bàn mới thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể tạo bàn mới",
      error: error.message,
    });
  }
};

// Update table
exports.updateTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const { tableNumber, capacity, status } = req.body;

    // Check if table exists
    const checkQuery = "SELECT 1 FROM tables WHERE table_id = $1";
    const checkResult = await pool.query(checkQuery, [tableId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy bàn",
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (tableNumber !== undefined) {
      if (isNaN(parseInt(tableNumber)) || parseInt(tableNumber) <= 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "Số bàn không hợp lệ",
        });
      }

      // Check if the new table number already exists (except for the current table)
      const duplicateQuery =
        "SELECT 1 FROM tables WHERE table_number = $1 AND table_id != $2";
      const duplicateResult = await pool.query(duplicateQuery, [
        tableNumber,
        tableId,
      ]);

      if (duplicateResult.rows.length > 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "Số bàn đã tồn tại",
        });
      }

      updates.push(`table_number = $${paramIndex++}`);
      values.push(parseInt(tableNumber));
    }

    if (capacity !== undefined) {
      if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "Sức chứa không hợp lệ",
        });
      }
      updates.push(`capacity = $${paramIndex++}`);
      values.push(parseInt(capacity));
    }

    if (status !== undefined) {
      const validStatuses = [
        "available",
        "occupied",
        "reserved",
        "maintenance",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          statusCode: 400,
          message: "Trạng thái bàn không hợp lệ",
        });
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);

    // If no fields to update
    if (updates.length === 1) {
      // Only updated_at
      return res.status(400).json({
        statusCode: 400,
        message: "Không có thông tin nào được cập nhật",
      });
    }

    // Add table_id to values array
    values.push(tableId);

    const query = `
      UPDATE tables
      SET ${updates.join(", ")}
      WHERE table_id = $${paramIndex}
      RETURNING 
        table_id AS "tableId", 
        table_number AS "tableNumber", 
        capacity, 
        status, 
        updated_at AS "updatedAt"
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật bàn thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật bàn",
      error: error.message,
    });
  }
};

// Delete table
exports.deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id;

    // Check if table exists
    const checkQuery = "SELECT 1 FROM tables WHERE table_id = $1";
    const checkResult = await pool.query(checkQuery, [tableId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 500,
        message: "Không tìm thấy bàn",
      });
    }

    // Check if table is used in any active orders
    const orderCheckQuery = `
      SELECT 1 FROM orders 
      WHERE table_id = $1 AND status IN ('pending', 'in-progress')
      LIMIT 1
    `;
    const orderCheckResult = await pool.query(orderCheckQuery, [tableId]);

    if (orderCheckResult.rows.length > 0) {
      return res.status(400).json({
        statusCode: 500,
        message:
          "Không thể xóa bàn đang được sử dụng trong các đơn hàng đang hoạt động",
      });
    }

    // Check if table has future reservations
    const reservationCheckQuery = `
      SELECT 1 FROM reservations 
      WHERE table_id = $1 AND reservation_time > NOW() AND status = 'confirmed'
      LIMIT 1
    `;
    const reservationCheckResult = await pool.query(reservationCheckQuery, [
      tableId,
    ]);

    if (reservationCheckResult.rows.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Không thể xóa bàn đã có đặt chỗ trong tương lai",
      });
    }

    // Delete table
    const deleteQuery = "DELETE FROM tables WHERE table_id = $1";
    await pool.query(deleteQuery, [tableId]);

    res.status(200).json({
      statusCode: 200,
      message: "Xóa bàn thành công",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa bàn",
      error: error.message,
    });
  }
};

// Get tables availability status summary
exports.getTableAvailability = async (req, res) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) AS count,
        SUM(capacity) AS total_capacity
      FROM tables
      GROUP BY status
      ORDER BY status
    `;

    const result = await pool.query(query);

    // Get current date and time for client reference
    const currentDateTime = new Date().toISOString();

    res.status(200).json({
      statusCode: 200,
      data: {
        statusSummary: result.rows,
        currentDateTime,
      },
    });
  } catch (error) {
    console.error("Error getting table availability:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin khả dụng của bàn",
      error: error.message,
    });
  }
};

// Thêm hàm hỗ trợ trích xuất public_id
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  try {
    // URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // Lấy phần sau v1234567890/
    const pathPart = parts[1].replace(/^v\d+\//, "");

    // Loại bỏ phần mở rộng file (.jpg, .png, etc.)
    return pathPart.replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Lỗi trích xuất public_id:", error);
    return null;
  }
}
