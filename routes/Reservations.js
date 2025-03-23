const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/ReservationsController");
const { auth, adminAuth } = require("../middleware/roleAuth"); // Import specific middleware functions

// Protected routes
router.post("/", auth, reservationsController.createReservation); // Any authenticated user
router.patch(
  "/:id/statusCode",
  auth,
  reservationsController.updateReservationStatus
); // Any authenticated user

module.exports = router;
