const ReservationModel = require("../models/reservation_model");

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await ReservationModel.getAllReservations();
    res.json({
      status: "success",
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Không thể lấy danh sách đặt bàn",
      error: error.message,
    });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { tableNumber, reservationTime } = req.body;
    const userId = req.user.id; // Từ middleware auth

    if (!tableNumber || !reservationTime) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin đặt bàn",
      });
    }

    const newReservation = await ReservationModel.createReservation({
      userId,
      tableNumber,
      reservationTime,
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
