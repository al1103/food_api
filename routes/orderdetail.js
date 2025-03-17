const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/ReservationsController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Protected routes
router.get("/", adminAuth, reservationsController.getAllReservations); // Admin only
router.post("/", auth, reservationsController.createReservation); // Any authenticated user
router.patch(
  "/:id/status",
  auth,
  reservationsController.updateReservationStatus
); // Any authenticated user
router.delete("/:id", adminAuth, reservationsController.deleteReservation); // Admin only

module.exports = router;
