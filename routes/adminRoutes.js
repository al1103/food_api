const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");
const { Parser } = require('json2csv');

// Protect all admin routes with adminAuth middleware
router.use(adminAuth);

// User management routes
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// Dashboard statistics
router.get("/dashboard/stats", adminController.getDashboardStats);

// Dish management routes
router.get("/dishes", adminController.getAllDishes);
router.get("/dishes/:id", adminController.getDishById);
router.post("/dishes", upload.single("image"), adminController.createDish);
router.put("/dishes/:id", upload.single("image"), adminController.updateDish);
router.delete("/dishes/:id", adminController.deleteDish);

// Table management routes
router.get("/tables", adminController.getAllTables);
router.get("/tables/:id", adminController.getTableById);
router.post("/tables", adminController.createTable);
router.put("/tables/:id", adminController.updateTable);

// In routes/adminRoutes.js - Add these endpoints
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrderById);
router.patch("/orders/:id/status", adminController.updateOrderStatus);

router.post("/", adminController.createFood);
router.put("/:id", adminController.updateFood);
router.delete("/:id", adminController.deleteFood);

router.get('/reports/orders', adminAuth, async (req, res) => {
  const { from, to } = req.query;
  const orders = await require('../models/order_model').getAllOrders({ from, to });
  const parser = new Parser();
  const csv = parser.parse(orders);
  res.header('Content-Type', 'text/csv');
  res.attachment('orders_report.csv');
  return res.send(csv);
});

router.get('/dashboard/summary', adminAuth, async (req, res) => {
  const OrderModel = require('../models/order_model');
  const UserModel = require('../models/user_model');
  const TableModel = require('../models/table_model');
  const totalOrders = await OrderModel.countAll();
  const totalRevenue = await OrderModel.sumRevenue();
  const totalUsers = await UserModel.countAll();
  const totalTables = await TableModel.countAll();
  res.json({ totalOrders, totalRevenue, totalUsers, totalTables });
});

router.get('/dashboard/sales-by-day', adminAuth, async (req, res) => {
  const OrderModel = require('../models/order_model');
  const sales = await OrderModel.getSalesByDay(req.query.month, req.query.year);
  res.json(sales);
});

router.get('/dashboard/top-dishes', adminAuth, async (req, res) => {
  const DishModel = require('../models/dishes_model');
  const topDishes = await DishModel.getTopDishes(5);
  res.json(topDishes);
});

module.exports = router;
