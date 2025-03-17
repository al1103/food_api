const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");
const { auth, adminAuth } = require("../middleware/roleAuth");

// Public routes
router.get("/", tableController.getAllTables);
router.get("/:id", tableController.getTableById);

// Protected routes - use the auth middleware function
router.post("/", auth, tableController.createTable);
router.put("/:id", auth, tableController.updateTable);

module.exports = router;
