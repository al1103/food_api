const ReservationModel = require("../models/reservation_model");
const { getPaginationParams } = require("../utils/pagination");

exports.getAllReservations = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(req);
    const { status, date } = req.query;

    const result = await ReservationModel.getAllReservations({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      date,
    });

    res.json({
      status: "success",
      data: result.reservations,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách đặt bàn",
      error: error.message,
    });
  }
};

// Enhanced reservation creation
exports.createReservation = async (req, res) => {
  try {
    const {
      tableId,
      customerName,
      phoneNumber,
      reservationTime,
      partySize,
      specialRequests,
    } = req.body;

    const userId = req.user?.userid; // Optional from auth middleware

    if (!tableId || !reservationTime || !customerName || !phoneNumber) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin đặt bàn cần thiết",
      });
    }

    // Check table availability
    const isTableAvailable = await ReservationModel.checkTableAvailability(
      tableId,
      reservationTime
    );

    if (!isTableAvailable) {
      return res.status(400).json({
        status: "error",
        message: "Bàn đã được đặt trong khung giờ này",
      });
    }

    const newReservation = await ReservationModel.createReservation({
      userId,
      tableId,
      customerName,
      phoneNumber,
      reservationTime,
      partySize,
      specialRequests,
    });

    res.status(201).json({
      status: "success",
      message: "Đặt bàn thành công",
      data: newReservation,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi đặt bàn",
      error: error.message,
    });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái không hợp lệ",
      });
    }

    await ReservationModel.updateReservationStatus(id, status);
    res.json({
      status: "success",
      message: "Cập nhật trạng thái đặt bàn thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi cập nhật trạng thái đặt bàn",
      error: error.message,
    });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    await ReservationModel.deleteReservation(id);

    res.json({
      status: "success",
      message: "Xóa đặt bàn thông tin",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi xóa đặt bàn",
      error: error.message,
    });
  }
};

// Add availability check endpoint
exports.checkAvailability = async (req, res) => {
  try {
    const { date, time, partySize } = req.query;

    if (!date || !time || !partySize) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng cung cấp ngày, giờ và số người",
      });
    }

    const availableTables = await ReservationModel.findAvailableTables(
      date,
      time,
      partySize
    );

    res.json({
      status: "success",
      data: {
        available: availableTables.length > 0,
        availableTables,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể kiểm tra tình trạng sẵn có",
      error: error.message,
    });
  }
};
