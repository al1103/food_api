const OrderModel = require("../models/order_model");
const ReservationModel = require("../models/reservation_model");
const TableModel = require("../models/table_model");
const DishModel = require("../models/dishes_model");

exports.getDashboardStats = async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get revenue stats
    const revenue = await OrderModel.getRevenueStats();

    // Get today's orders
    const todayOrders = await OrderModel.getOrdersByDate(today);

    // Get today's reservations
    const todayReservations = await ReservationModel.getReservationsByDate(
      today
    );

    // Get popular dishes
    const popularDishes = await DishModel.getPopularDishes(5);

    // Get table utilization
    const tableUtilization = await TableModel.getTableUtilization();

    res.json({
      status: "success",
      data: {
        revenue: {
          today: revenue.today,
          thisWeek: revenue.thisWeek,
          thisMonth: revenue.thisMonth,
          growth: revenue.growth,
        },
        orders: {
          today: todayOrders.length,
          pending: todayOrders.filter((o) => o.Status === "pending").length,
          completed: todayOrders.filter((o) => o.Status === "completed").length,
        },
        reservations: {
          today: todayReservations.length,
          upcoming: todayReservations.filter(
            (r) => new Date(r.ReservationTime) > new Date()
          ).length,
        },
        popularDishes,
        tableUtilization,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy thông tin tổng quan",
      error: error.message,
    });
  }
};
