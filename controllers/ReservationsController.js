const ReservationModel = require("../models/reservation_model");
const { getPaginationParams } = require("../utils/pagination");
const ApiResponse = require("../utils/apiResponse");
const TableModel = require("../models/table_model");
const { pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");


exports.cancelReservationRequest = async (req, res) => {
    try {
      const { reservationId } = req.params;

      // Hủy yêu cầu đặt bàn
      const cancelledReservation = await TableModel.cancelReservationRequestUser(
        reservationId,
      );

      return ApiResponse.success(
        res,
        200,
        "Yêu cầu đặt bàn đã được hủy thành công",
        cancelledReservation,
      );
    } catch (error) {
      console.error("Lỗi khi hủy yêu cầu đặt bàn:", error);
      return ApiResponse.error(
        res,
        500,
        "Đã xảy ra lỗi khi hủy yêu cầu đặt bàn",
      );
    }
  }

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
    const { status, cancelReason } = req.body; // Changed from statusCode to status

    // Validate status
    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Trạng thái không hợp lệ",
      });
    }

    // If status is cancelled, require a reason
    if (status === "cancelled" && !cancelReason) {
      return res.status(400).json({
        statusCode: 400,
        message: "Vui lòng nhập lý do hủy đặt bàn",
      });
    }

    // Validate cancel reason length if provided
    if (cancelReason && cancelReason.length > 500) {
      return res.status(400).json({
        statusCode: 400,
        message: "Lý do hủy không được vượt quá 500 ký tự",
      });
    }

    const adminId = req.user?.userId;

    // Update reservation status with cancel reason
    const updatedReservation = await ReservationModel.updateReservationStatus(
      id,
      status,
      cancelReason,
      adminId
    );

    if (!updatedReservation) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy đặt bàn",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: status === 'cancelled'
        ? `Đặt bàn đã được hủy thành công. Lý do: ${cancelReason}`
        : "Cập nhật trạng thái đặt bàn thành công",
      data: updatedReservation
    });

  } catch (error) {
    console.error("Error updating reservation status:", error);
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

// Get all reservations (admin only)
exports.getAllReservations = async (req, res) => {
  try {
    // Extract query parameters for filtering and pagination
    const {
      status,
      date,
      page = 1,
      limit = 10,
      sortBy = 'reservation_time',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let params = [];
    let whereConditions = [];
    let paramIndex = 1;

    // Build WHERE clause based on filters
    if (status) {
      whereConditions.push(`r.status = $${paramIndex++}`);
      params.push(status);
    }

    if (date) {
      whereConditions.push(`DATE(r.reservation_time) = $${paramIndex++}`);
      params.push(date);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Add pagination parameters
    params.push(parseInt(limit));
    params.push(offset);

    const query = `
      SELECT
        r.reservation_id AS "reservationId",
        r.user_id AS "userId",
        r.customer_name AS "customerName",
        r.phone_number AS "customerPhone",
        u.email AS "customerEmail",
        r.party_size AS "partySize",
        r.reservation_time  AS "reservationTime",
        r.special_requests AS "specialRequests",
        r.status,
        r.table_id AS "tableId",
        r.order_id AS "orderId",
        t.capacity AS "tableCapacity",
        r.created_at  AS "createdAt",
        r.updated_at  AS "updatedAt"
      FROM reservations r
      LEFT JOIN tables t ON r.table_id = t.table_id
      LEFT JOIN users u ON r.user_id = u.user_id
      ${whereClause}
      ORDER BY r.${sortBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*)
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.user_id
      ${whereClause}
    `;

    const [reservations, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Remove limit and offset
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      statusCode: 200,
      data: reservations.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });

  } catch (error) {
    console.error("Error fetching reservations:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Lỗi khi lấy danh sách đặt bàn: " + error.message
    });
  }
};
