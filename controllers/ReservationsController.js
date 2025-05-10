const ReservationModel = require("../models/reservation_model");
const { getPaginationParams } = require("../utils/pagination");

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
        statusCode: 400,
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
        statusCode: 400,
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
      statusCode: 200,
      message: "Đặt bàn thành công",
      data: newReservation,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi đặt bàn",
      error: error.message,
    });
  }
};

exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusCode } = req.body;

    if (
      !["pending", "confirmed", "cancelled", "completed"].includes(statusCode)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Trạng thái không hợp lệ",
      });
    }

    await ReservationModel.updateReservationStatus(id, statusCode);
    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật trạng thái đặt bàn thành công",
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi cập nhật trạng thái đặt bàn",
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
        statusCode: 400,
        message: "Vui lòng cung cấp ngày, giờ và số người",
      });
    }

    const availableTables = await ReservationModel.findAvailableTables(
      date,
      time,
      partySize
    );

    res.status(200).json({
      statusCode: 200,
      data: {
        available: availableTables.length > 0,
        availableTables,
      },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Không thể kiểm tra tình trạng sẵn có",
      error: error.message,
    });
  }
};

// Thêm phương thức mới để lấy lịch sử đặt bàn của người dùng
exports.getUserReservationHistory = async (req, res) => {
  try {
    const userId = req.user.userId; // Lấy ID người dùng từ token xác thực
    const { page, limit } = req.query;

    // Gọi model để lấy lịch sử đặt bàn
    const result = await ReservationModel.getReservationsByUserId(
      userId, 
      page, 
      limit
    );

    res.status(200).json({
      statusCode: 200,
      message: "Lấy lịch sử đặt bàn thành công",
      data: result.reservations,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đặt bàn:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Đã xảy ra lỗi khi lấy lịch sử đặt bàn",
      error: error.message
    });
  }
};
