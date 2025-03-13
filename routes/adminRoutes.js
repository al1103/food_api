const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/roleAuth');

// Protect all admin routes with adminAuth middleware
router.use(adminAuth);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;