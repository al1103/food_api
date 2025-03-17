const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/ReservationsController");
const { auth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Protected routes
router.post("/", auth, reservationsController.createReservation); // Any authenticated user
router.patch(
  "/:id/status",
  auth,
  reservationsController.updateReservationStatus
); // Any authenticated user

module.exports = router;
