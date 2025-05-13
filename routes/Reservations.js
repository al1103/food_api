const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/ReservationsController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Protected routes
router.post("/", auth, reservationsController.createReservation); // Any authenticated user
router.patch(
  "/:id/status",
  auth,
  reservationsController.updateReservationStatus
); // Any authenticated user

// Thêm route mới để lấy lịch sử đặt bàn của người dùng
router.get("/history", auth, reservationsController.getUserReservationHistory);

router.post(
  "/:reservationId/cancel",
  auth,
  reservationsController.cancelReservationRequest
);
module.exports = router;
