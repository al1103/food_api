const ReservationModel = require("../models/reservation_model");

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await ReservationModel.getAllReservations();
    res.json({
      statusCode: 200,
      data: reservations,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Không thể lấy danh sách đặt bàn",
      error: error.message,
    });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { tableNumber, reservationTime } = req.body;
    const userId = req.useruserid; // Từ middleware auth

    if (!tableNumber || !reservationTime) {
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Thiếu thông tin đặt bàn",
      });
    }

    const newReservation = await ReservationModel.createReservation({
      userId,
      tableNumber,
      reservationTime,
    });

    res.statusCode(201).json({
      statusCode: 200,
      message: "Đặt bàn thành công",
      data: newReservation,
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
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
      return res.statusCode(400).json({
        statusCode: "error",
        message: "Trạng thái không hợp lệ",
      });
    }

    await ReservationModel.updateReservationStatus(id, statusCode);
    res.json({
      statusCode: 200,
      message: "Cập nhật trạng thái đặt bàn thành công",
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
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
      statusCode: 200,
      message: "Xóa đặt bàn thành cong",
    });
  } catch (error) {
    res.statusCode(500).json({
      statusCode: "error",
      message: "Lỗi khi xóa đặt bàn",
      error: error.message,
    });
  }
};
