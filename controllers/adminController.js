const UserModel = require("../models/user_model");
const DishModel = require("../models/dishes_model");
const OrderModel = require("../models/order_model");
const TableModel = require("../models/table_model");
const ReservationModel = require("../models/reservation_model");
const { getPaginationParams } = require("../utils/pagination");

// User management functions
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
      // Get total users count
      const usersResult = await client.query(
        "SELECT COUNT(*) AS total_users FROM users WHERE role = $1",
        ["customer"]
      );

      // Get total revenue
      const revenueResult = await client.query(
        "SELECT SUM(total_price) AS total_revenue FROM orders WHERE status = $1",
        ["completed"]
      );

      // Get total orders
      const ordersResult = await client.query(
        "SELECT COUNT(*) AS total_orders FROM orders"
      );

      // Get total dishes
      const dishesResult = await client.query(
        "SELECT COUNT(*) AS total_dishes FROM dishes"
      );

      // Get today's revenue
      const todayRevenueResult = await client.query(
        `SELECT SUM(total_price) AS today_revenue 
         FROM orders 
         WHERE status = $1 AND DATE(order_date) = CURRENT_DATE`,
        ["completed"]
      );

      // Get this month's revenue
      const monthRevenueResult = await client.query(
        `SELECT SUM(total_price) AS month_revenue 
         FROM orders 
         WHERE status = $1 AND 
         EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND
         EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
        ["completed"]
      );

      // Get popular dishes (top 5)
      const popularDishesResult = await client.query(
        `SELECT 
          d.dish_id AS "dishId",
          d.name AS "name",
          d.category AS "category",
          SUM(od.quantity) AS "totalOrdered"
         FROM order_details od
         JOIN dishes d ON od.dish_id = d.dish_id
         JOIN orders o ON od.order_id = o.order_id
         WHERE o.status = 'completed'
         GROUP BY d.dish_id, d.name, d.category
         ORDER BY "totalOrdered" DESC
         LIMIT 5`
      );

      // Get recent orders (last 5)
      const recentOrdersResult = await client.query(
        `SELECT 
          o.order_id AS "orderId",
          o.user_id AS "userId",
          u.username,
          o.total_price AS "totalPrice",
          o.status,
          o.order_date AS "orderDate"
         FROM orders o
         JOIN users u ON o.user_id = u.user_id
         ORDER BY o.order_date DESC
         LIMIT 5`
      );

      res.json({
        status: "success",
        data: {
          totalUsers: parseInt(usersResult.rows[0].total_users),
          totalRevenue: parseFloat(revenueResult.rows[0].total_revenue || 0),
          totalOrders: parseInt(ordersResult.rows[0].total_orders),
          totalDishes: parseInt(dishesResult.rows[0].total_dishes),
          todayRevenue: parseFloat(
            todayRevenueResult.rows[0].today_revenue || 0
          ),
          monthRevenue: parseFloat(
            monthRevenueResult.rows[0].month_revenue || 0
          ),
          popularDishes: popularDishesResult.rows,
          recentOrders: recentOrdersResult.rows,
        },
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
