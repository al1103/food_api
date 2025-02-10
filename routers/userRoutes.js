const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

// Public routes
router.post("/login", userController.login);
router.post("/register", userController.register);
router.post("/verify-code", userController.verifyRegistration);
router.post("/token", userController.token);

// Protected routes
router.use(authMiddleware);

module.exports = router;
