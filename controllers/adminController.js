const { pool } = require("../config/database");
const UserModel = require("../models/user_model");

const { getPaginationParams } = require("../utils/pagination");

// Food management functions
exports.createFood = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        status: "error",
        message: "Tên món ăn, giá và danh mục là bắt buộc",
      });
    }

    const query = `
      INSERT INTO foods(name, description, price, image_url, category, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING 
        food_id AS "foodId",
        name,
        description,
        price,
        image_url AS "imageUrl",
        category,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const result = await pool.query(query, [
      name,
      description,
      price,
      imageUrl,
      category,
    ]);

    res.status(201).json({
      status: "success",
      message: "Tạo món ăn thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating food:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể tạo món ăn mới",
      error: error.message,
    });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const { name, description, price, imageUrl, category } = req.body;

    // Check if food exists
    const existingFood = await FoodModel.getFoodById(foodId);
    if (!existingFood) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }

    // Build the update parts
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
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }

    if (imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(imageUrl);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at was added
      return res.status(400).json({
        status: "error",
        message: "Không có thông tin nào được cập nhật",
      });
    }

    values.push(foodId);

    const query = `
      UPDATE foods
      SET ${updates.join(", ")}
      WHERE food_id = $${paramIndex}
      RETURNING 
        food_id AS "foodId",
        name,
        description,
        price,
        image_url AS "imageUrl",
        category,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const result = await pool.query(query, values);

    res.json({
      status: "success",
      message: "Cập nhật món ăn thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể cập nhật món ăn",
      error: error.message,
    });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const foodId = req.params.id;

    // Check if food exists
    const existingFood = await FoodModel.getFoodById(foodId);
    if (!existingFood) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }

    const query = `
      DELETE FROM foods
      WHERE food_id = $1
    `;

    await pool.query(query, [foodId]);

    res.json({
      status: "success",
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Error deleting food:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const result = await UserModel.getAllUsers(page, limit);

    res.json({
      status: "success",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
        message: "Vai trò người dùng là bắt buộc",
      });
    }

    const updatedUser = await UserModel.updateUserRole(userId, role);

    res.json({
      status: "success",
      message: "Cập nhật vai trò người dùng thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
        message: "Không thể xóa tài khoản hiện tại đang đăng nhập",
      });
    }

    const result = await UserModel.deleteUser(userId);

    res.json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể xóa người dùng",
      error: error.message,
    });
  }
};

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const client = await pool.connect();

    try {
      // Get user statistics
      const userStats = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE role = 'customer') AS total_customers,
          COUNT(*) FILTER (WHERE role = 'staff') AS total_staff,
          COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_last_30_days,
          COUNT(*) AS total_users
        FROM users
      `);

      // Get revenue statistics
      const revenueStats = await client.query(`
        SELECT
          COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
          COALESCE(SUM(total_price) FILTER (WHERE status = 'completed' AND DATE(order_date) = CURRENT_DATE), 0) AS today_revenue,
          COALESCE(SUM(total_price) FILTER (WHERE status = 'completed' AND 
            EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND
            EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) AS month_revenue,
          COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0) AS completed_orders,
          COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0) AS pending_orders,
          COALESCE(COUNT(*) FILTER (WHERE status = 'in-progress'), 0) AS in_progress_orders,
          COUNT(*) AS total_orders
        FROM orders
      `);

      // Get order counts by date (for last 7 days)
      const ordersByDate = await client.query(`
        SELECT 
          DATE(order_date) AS date,
          COUNT(*) AS order_count,
          COALESCE(SUM(total_price), 0) AS daily_revenue
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(order_date)
        ORDER BY date
      `);

      // Get dish statistics
      const dishStats = await client.query(`
        SELECT
          COUNT(*) AS total_dishes,
          COUNT(*) FILTER (WHERE category = 'Appetizers') AS appetizers_count,
          COUNT(*) FILTER (WHERE category = 'Main Course') AS main_course_count,
          COUNT(*) FILTER (WHERE category = 'Desserts') AS desserts_count,
          COUNT(*) FILTER (WHERE category = 'Beverages') AS beverages_count,
          COUNT(*) FILTER (WHERE category = 'Noodles') AS noodles_count,
          COUNT(*) FILTER (WHERE category = 'Rice') AS rice_count,
          COALESCE(AVG(rating), 0) AS avg_dish_rating
        FROM dishes
      `);

      // Get popular dishes (top 10)
      const popularDishesResult = await client.query(`
        SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.image_url AS "imageUrl",
          d.price AS "price",
          d.category AS "category",
          d.rating AS "rating",
          COALESCE(SUM(od.quantity), 0) AS "totalOrdered"
        FROM dishes d
        LEFT JOIN order_details od ON d.dish_id = od.dish_id
        LEFT JOIN orders o ON od.order_id = o.order_id AND o.status = 'completed'
        GROUP BY d.dish_id, d.name, d.image_url, d.price, d.category, d.rating
        ORDER BY "totalOrdered" DESC, d.rating DESC
        LIMIT 10
      `);

      // Get recent orders
      const recentOrdersResult = await client.query(`
        SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.username,
          u.full_name AS "customerName",
          o.total_price AS "totalPrice",
          o.status,
          o.table_id AS "tableId",
          o.order_date AS "orderDate",
          COUNT(od.id) AS "itemCount"
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_details od ON o.order_id = od.order_id
        GROUP BY o.order_id, o.user_id, u.username, u.full_name, o.total_price, o.status, o.table_id, o.order_date
        ORDER BY o.order_date DESC
        LIMIT 10
      `);

      // Get reservation statistics
      const reservationStats = await client.query(`
        SELECT
          COUNT(*) AS total_reservations,
          COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_reservations,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_reservations,
          COUNT(*) FILTER (WHERE reservation_time::date = CURRENT_DATE) AS today_reservations,
          COUNT(*) FILTER (WHERE reservation_time::date > CURRENT_DATE) AS upcoming_reservations
        FROM reservations
      `);

      // Get table occupancy status
      const tableStats = await client.query(`
        SELECT
          COUNT(*) AS total_tables,
          COUNT(*) FILTER (WHERE status = 'available') AS available_tables,
          COUNT(*) FILTER (WHERE status = 'occupied') AS occupied_tables,
          COUNT(*) FILTER (WHERE status = 'reserved') AS reserved_tables,
          SUM(capacity) AS total_capacity
        FROM tables
      `);

      // Get revenue by category
      const revenueByCategory = await client.query(`
        SELECT
          d.category,
          COALESCE(SUM(od.quantity * od.price), 0) AS category_revenue,
          COALESCE(COUNT(DISTINCT od.order_id), 0) AS order_count
        FROM dishes d
        LEFT JOIN order_details od ON d.dish_id = od.dish_id
        LEFT JOIN orders o ON od.order_id = o.order_id AND o.status = 'completed'
        GROUP BY d.category
        ORDER BY category_revenue DESC
      `);

      // Calculate business growth metrics (compare current month with previous month)
      const growthMetrics = await client.query(`
        WITH current_month AS (
          SELECT COALESCE(SUM(total_price), 0) AS revenue
          FROM orders
          WHERE status = 'completed'
            AND EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        ),
        previous_month AS (
          SELECT COALESCE(SUM(total_price), 0) AS revenue
          FROM orders
          WHERE status = 'completed'
            AND (
              (EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND 
               EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM CURRENT_DATE) - 1)
              OR
              (EXTRACT(MONTH FROM CURRENT_DATE) = 1 AND
               EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND
               EXTRACT(MONTH FROM order_date) = 12)
            )
        )
        SELECT
          cm.revenue AS current_month_revenue,
          pm.revenue AS previous_month_revenue,
          CASE 
            WHEN pm.revenue = 0 THEN 100
            ELSE ROUND((cm.revenue - pm.revenue) / pm.revenue * 100, 2)
          END AS revenue_growth_percentage
        FROM current_month cm, previous_month pm
      `);

      res.json({
        status: "success",
        data: [
          {
            users: {
              totalUsers: parseInt(userStats.rows[0].total_users),
              totalCustomers: parseInt(userStats.rows[0].total_customers),
              totalStaff: parseInt(userStats.rows[0].total_staff),
              totalAdmins: parseInt(userStats.rows[0].total_admins),
              newUsersLast30Days: parseInt(
                userStats.rows[0].new_users_last_30_days
              ),
            },
            revenue: {
              totalRevenue: parseFloat(revenueStats.rows[0].total_revenue),
              todayRevenue: parseFloat(revenueStats.rows[0].today_revenue),
              monthRevenue: parseFloat(revenueStats.rows[0].month_revenue),
              revenueGrowth: parseFloat(
                growthMetrics.rows[0].revenue_growth_percentage
              ),
            },
            orders: {
              totalOrders: parseInt(revenueStats.rows[0].total_orders),
              completedOrders: parseInt(revenueStats.rows[0].completed_orders),
              pendingOrders: parseInt(revenueStats.rows[0].pending_orders),
              inProgressOrders: parseInt(
                revenueStats.rows[0].in_progress_orders
              ),
              ordersByDate: ordersByDate.rows,
            },
            dishes: {
              totalDishes: parseInt(dishStats.rows[0].total_dishes),
              categoryCounts: {
                appetizers: parseInt(dishStats.rows[0].appetizers_count),
                mainCourse: parseInt(dishStats.rows[0].main_course_count),
                desserts: parseInt(dishStats.rows[0].desserts_count),
                beverages: parseInt(dishStats.rows[0].beverages_count),
                noodles: parseInt(dishStats.rows[0].noodles_count),
                rice: parseInt(dishStats.rows[0].rice_count),
              },
              averageRating: parseFloat(dishStats.rows[0].avg_dish_rating),
              popularDishes: popularDishesResult.rows,
              revenueByCategory: revenueByCategory.rows,
            },
            tables: {
              totalTables: parseInt(tableStats.rows[0].total_tables),
              availableTables: parseInt(tableStats.rows[0].available_tables),
              occupiedTables: parseInt(tableStats.rows[0].occupied_tables),
              reservedTables: parseInt(tableStats.rows[0].reserved_tables),
              totalCapacity: parseInt(tableStats.rows[0].total_capacity),
            },
            reservations: {
              totalReservations: parseInt(
                reservationStats.rows[0].total_reservations
              ),
              confirmedReservations: parseInt(
                reservationStats.rows[0].confirmed_reservations
              ),
              pendingReservations: parseInt(
                reservationStats.rows[0].pending_reservations
              ),
              todayReservations: parseInt(
                reservationStats.rows[0].today_reservations
              ),
              upcomingReservations: parseInt(
                reservationStats.rows[0].upcoming_reservations
              ),
            },
            recentActivity: {
              recentOrders: recentOrdersResult.rows,
            },
          },
        ],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy thống kê bảng điều khiển",
      error: error.message,
    });
  }
};

// Add these dish management functions

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

    res.json({
      status: "success",
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
      status: "error",
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
        status: "error",
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
        status: "error",
        message: "Không tìm thấy món ăn",
      });
    }

    res.json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting dish:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy thông tin món ăn",
      error: error.message,
    });
  }
};

// Create new dish
exports.createDish = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        status: "error",
        message: "Tên món ăn, giá và danh mục là bắt buộc",
      });
    }

    // Validate price
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Giá món ăn không hợp lệ",
      });
    }

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
      imageUrl || null,
      category,
      0.0, // Initial rating
    ]);

    res.status(201).json({
      status: "success",
      message: "Tạo món ăn mới thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể tạo món ăn mới",
      error: error.message,
    });
  }
};

// Update dish
exports.updateDish = async (req, res) => {
  try {
    const dishId = req.params.id;
    const { name, description, price, imageUrl, category, rating } = req.body;

    // Check if dish exists
    const checkQuery = "SELECT 1 FROM dishes WHERE dish_id = $1";
    const checkResult = await pool.query(checkQuery, [dishId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn",
      });
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
          status: "error",
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
          status: "error",
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
        status: "error",
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

    res.json({
      status: "success",
      message: "Cập nhật món ăn thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
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
        status: "error",
        message: "Không thể xóa món ăn đã được sử dụng trong đơn hàng",
      });
    }

    // Delete dish
    const deleteQuery = "DELETE FROM dishes WHERE dish_id = $1";
    await pool.query(deleteQuery, [dishId]);

    res.json({
      status: "success",
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
};

// Get dish categories

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

    res.json({
      status: "success",
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
      status: "error",
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
        status: "error",
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
        status: "error",
        message: "Không tìm thấy bàn",
      });
    }

    res.json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting table:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
        message: "Số bàn và sức chứa là bắt buộc",
      });
    }

    // Validate table number and capacity
    if (isNaN(parseInt(tableNumber)) || parseInt(tableNumber) <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Số bàn không hợp lệ",
      });
    }

    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Sức chứa không hợp lệ",
      });
    }

    // Check if table number already exists
    const checkQuery = "SELECT 1 FROM tables WHERE table_number = $1";
    const checkResult = await pool.query(checkQuery, [tableNumber]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Số bàn đã tồn tại",
      });
    }

    // Validate status
    const validStatuses = ["available", "occupied", "reserved", "maintenance"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
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
      status: "success",
      message: "Tạo bàn mới thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
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
          status: "error",
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
          status: "error",
          message: "Số bàn đã tồn tại",
        });
      }

      updates.push(`table_number = $${paramIndex++}`);
      values.push(parseInt(tableNumber));
    }

    if (capacity !== undefined) {
      if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
        return res.status(400).json({
          status: "error",
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
          status: "error",
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
        status: "error",
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

    res.json({
      status: "success",
      message: "Cập nhật bàn thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({
      status: "error",
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
        status: "error",
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
        status: "error",
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
        status: "error",
        message: "Không thể xóa bàn đã có đặt chỗ trong tương lai",
      });
    }

    // Delete table
    const deleteQuery = "DELETE FROM tables WHERE table_id = $1";
    await pool.query(deleteQuery, [tableId]);

    res.json({
      status: "success",
      message: "Xóa bàn thành công",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({
      status: "error",
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

    res.json({
      status: "success",
      data: {
        statusSummary: result.rows,
        currentDateTime,
      },
    });
  } catch (error) {
    console.error("Error getting table availability:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy thông tin khả dụng của bàn",
      error: error.message,
    });
  }
};
