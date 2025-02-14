const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");
const authMiddleware = require("../middleware/auth");

// Public routes
router.get("/", tableController.getAllTables);
router.get("/:id", tableController.getTableById);

// Protected routes
router.use(authMiddleware);
router.post("/", tableController.createTable);
router.put("/:id", tableController.updateTable);
router.delete("/:id", tableController.deleteTable);

module.exports = router;
