const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { adminAuth } = require("../middleware/roleAuth");
const upload = require("../middleware/multer");

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
router.put("/dishes/:id", adminController.updateDish);
router.delete("/dishes/:id", adminController.deleteDish);

// Table management routes
router.get("/tables", adminController.getAllTables);
router.get("/tables/availability", adminController.getTableAvailability);
router.get("/tables/:id", adminController.getTableById);
router.post("/tables", adminController.createTable);
router.put("/tables/:id", adminController.updateTable);
router.delete("/tables/:id", adminController.deleteTable);

router.post("/", adminController.createFood);
router.put("/:id", adminController.updateFood);
router.delete("/:id", adminController.deleteFood);
module.exports = router;
