const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth } = require("../middleware/roleAuth"); // Import from roleAuth instead

// Public routes
router.post("/register", userController.register);
router.post("/verify-registration", userController.verifyRegistration);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/token", userController.token);

// Protected routes
router.get("/me", auth, userController.getUserProfile);
router.put("/me", auth, userController.updateUserProfile);

// Referral and wallet routes
router.get("/referrals", auth, userController.getReferralInfo);
router.get("/wallet/transactions", auth, userController.getWalletTransactions);
router.post("/wallet/withdraw", auth, userController.withdrawFromWallet);
router.get("/referrals/share", auth, userController.getReferralShareContent);

module.exports = router;
