const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/ReservationsController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware); // Protect all reservation routes

// Get all reservations (admin only)
router.get("/", reservationsController.getAllReservations);

// Create new reservation
router.post("/", reservationsController.createReservation);

// Update reservation status
router.patch("/:id/status", reservationsController.updateReservationStatus);

router.delete("/:id", reservationsController.deleteReservation);

module.exports = router;
