const { pool } = require("../config/database");
const UserModel = require("../models/user_model");
const fs = require("fs");
const { getPaginationParams } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const AdminModel = require("../models/admin_model");

// Food management functions
exports.createFood = async (req, res) => {
  try {
    const { name, description, price, imageUrl, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        statusCode: 500,
        message: "Tên món ăn, giá và danh mục là bắt buộc",
      });
    }

    const food = await AdminModel.createFood({
      name,
      description,
      price,
      imageUrl,
      category,
    });
    res.status(201).json({
      statusCode: 200,
      message: "Tạo món ăn thành công",
      data: food,
    });
  } catch (error) {
    console.error("Error creating food:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể tạo món ăn mới",
      error: error.message,
    });
  }
};

exports.updateFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const { name, description, price, imageUrl, category } = req.body;

    // Assuming FoodModel.getFoodById is still used for existence check
    const existingFood = await FoodModel.getFoodById(foodId);
    if (!existingFood) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    const updatedFood = await AdminModel.updateFood(foodId, {
      name,
      description,
      price,
      imageUrl,
      category,
    });
    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật món ăn thành công",
      data: updatedFood,
    });
  } catch (error) {
    console.error("Error updating food:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật món ăn",
      error: error.message,
    });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const existingFood = await FoodModel.getFoodById(foodId);
    if (!existingFood) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    await AdminModel.deleteFood(foodId);
    res.status(200).json({
      statusCode: 200,
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Error deleting food:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const result = await UserModel.getAllUsers(page, limit);

    res.status(200).json({
      statusCode: 200,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách người dùng",
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        statusCode: 500,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: [user],
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin người dùng",
      error: error.message,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        statusCode: 400,
        message: "Vai trò người dùng là bắt buộc",
      });
    }

    const updatedUser = await UserModel.updateUserRole(userId, role);

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật vai trò người dùng thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật vai trò người dùng",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Không thể xóa tài khoản hiện tại đang đăng nhập",
      });
    }

    const result = await UserModel.deleteUser(userId);

    res.status(200).json({
      statusCode: 200,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa người dùng",
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await AdminModel.getDashboardStats();

    // Send response
    res.status(200).json({
      statusCode: 200,
      data: [stats],
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin tổng quan",
      error: error.message,
    });
  }
};

// Get all dishes with pagination, filtering, and sorting options
exports.getAllDishes = async (req, res) => {
  try {
    const {
      page,
      limit,
      sortBy = "dish_id",
      sortOrder = "ASC",
    } = getPaginationParams(req);
    const { category } = req.query;

    const filters = {
      category,
      sortBy,
      sortOrder,
    };

    const result = await AdminModel.getAllDishes(page, limit, filters);

    res.status(200).json({
      statusCode: 200,
      data: result.dishes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting dishes:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách món ăn",
      error: error.message,
    });
  }
};

// Get dish by ID
exports.getDishById = async (req, res) => {
  try {
    const dishId = req.params.id;

    if (!dishId || isNaN(parseInt(dishId))) {
      return res.status(400).json({
        statusCode: 400,
        message: "ID món ăn không hợp lệ",
      });
    }

    const dish = await AdminModel.getDishById(dishId);

    if (!dish) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: dish,
    });
  } catch (error) {
    console.error("Error getting dish:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin món ăn",
      error: error.message,
    });
  }
};

// Create new dish
exports.createDish = async (req, res) => {
  try {
    console.log("Creating a new dish");

    // Lấy dữ liệu từ body request
    const { name, description, price, category } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      // Xóa file tạm nếu có
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Không thể xóa file tạm:", err);
        });
      }
      return res.status(400).json({
        statusCode: 400,
        message: "Tên món ăn, giá và danh mục là bắt buộc",
      });
    }

    // Validate price
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      // Xóa file tạm nếu có
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Không thể xóa file tạm:", err);
        });
      }
      return res.status(400).json({
        statusCode: 400,
        message: "Giá món ăn không hợp lệ",
      });
    }

    // Biến để lưu URL ảnh
    let imageUrl = null;

    // Upload ảnh lên Cloudinary nếu có file
    if (req.file) {
      try {
        console.log("Uploading image to Cloudinary:", req.file.path);

        // Upload file lên Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "food_api/dishes", // Thư mục riêng cho dishes
            transformation: [{ width: 600, height: 600, crop: "limit" }],
          }
        );

        // Lưu URL của ảnh từ Cloudinary
        imageUrl = cloudinaryResult.secure_url;

        console.log("Image uploaded successfully:", imageUrl);

        // Xóa file tạm
        fs.unlinkSync(req.file.path);
        console.log("Temporary file deleted");
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);

        // Xóa file tạm nếu upload thất bại
        if (req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Không thể xóa file tạm:", err);
          });
        }

        return res.status(500).json({
          statusCode: 500,
          message: "Lỗi khi upload ảnh món ăn",
          error: uploadError.message,
        });
      }
    }

    // Use model method to create dish
    const dish = await AdminModel.createDish({
      name,
      description: description || null,
      price: parseFloat(price),
      imageUrl,
      category,
      available: true,
    });

    res.status(201).json({
      statusCode: 200,
      message: "Tạo món ăn mới thành công",
      data: dish,
    });
  } catch (error) {
    console.error("Error creating dish:", error);

    // Xóa file tạm nếu có lỗi
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Không thể xóa file tạm:", err);
      });
    }

    res.status(500).json({
      statusCode: 500,
      message: "Không thể tạo món ăn mới",
      error: error.message,
    });
  }
};

// Update dish
exports.updateDish = async (req, res) => {
  try {
    const dishId = req.params.id;
    const { name, description, price, category, rating } = req.body;

    // Check if dish exists using model method
    const existingDish = await AdminModel.getDishById(dishId);

    if (!existingDish) {
      // Xóa file tạm nếu có
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Không thể xóa file tạm:", err);
        });
      }
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    // Lưu URL ảnh cũ (nếu có)
    const oldImageUrl = existingDish.imageUrl;

    // Upload ảnh mới nếu có
    let imageUrl = undefined; // Không thay đổi ảnh mặc định

    if (req.file) {
      try {
        // Upload lên Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "food_api/dishes",
        });

        // Lưu URL ảnh mới
        imageUrl = result.secure_url;

        // Xóa file tạm
        fs.unlinkSync(req.file.path);

        // Xóa ảnh cũ trên Cloudinary nếu có
        if (oldImageUrl) {
          try {
            // Trích xuất public_id từ URL cũ
            const publicId = extractPublicIdFromUrl(oldImageUrl);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (deleteError) {
            console.error("Lỗi khi xóa ảnh cũ:", deleteError);
            // Tiếp tục không quan tâm đến lỗi xóa ảnh cũ
          }
        }
      } catch (uploadError) {
        console.error("Lỗi khi upload ảnh mới:", uploadError);

        // Xóa file tạm nếu upload thất bại
        if (req.file.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Không thể xóa file tạm:", err);
          });
        }

        return res.status(500).json({
          statusCode: 500,
          message: "Lỗi khi upload ảnh món ăn",
          error: uploadError.message,
        });
      }
    }

    // Validate price if provided
    if (
      price !== undefined &&
      (isNaN(parseFloat(price)) || parseFloat(price) <= 0)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Giá món ăn không hợp lệ",
      });
    }

    // Validate rating if provided
    if (
      rating !== undefined &&
      (isNaN(parseFloat(rating)) ||
        parseFloat(rating) < 0 ||
        parseFloat(rating) > 5)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Đánh giá không hợp lệ (0-5)",
      });
    }

    // Use model to update dish
    const updatedDish = await AdminModel.updateDish(dishId, {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      imageUrl,
      category,
      rating: rating ? parseFloat(rating) : undefined,
    });

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật món ăn thành công",
      data: updatedDish,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật món ăn",
      error: error.message,
    });
  }
};

// Delete dish
exports.deleteDish = async (req, res) => {
  try {
    const dishId = req.params.id;

    // Check if dish exists using model method
    const dish = await AdminModel.getDishById(dishId);

    if (!dish) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy món ăn",
      });
    }

    // Use model to delete dish (which includes validation checks)
    const result = await AdminModel.deleteDish(dishId);

    res.status(200).json({
      statusCode: 200,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
};

// Get all tables with optional filtering and sorting
exports.getAllTables = async (req, res) => {
  try {
    const {
      page,
      limit,
      sortBy = "table_id",
      sortOrder = "ASC",
    } = getPaginationParams(req);
    const { status } = req.query;

    const filters = {
      status,
      sortBy,
      sortOrder,
    };

    const result = await AdminModel.getAllTables(page, limit, filters);

    res.status(200).json({
      statusCode: 200,
      data: result.tables,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách bàn",
      error: error.message,
    });
  }
};

// Get table by ID
exports.getTableById = async (req, res) => {
  try {
    const tableId = req.params.id;

    if (!tableId || isNaN(parseInt(tableId))) {
      return res.status(400).json({
        statusCode: 400,
        message: "ID bàn không hợp lệ",
      });
    }

    const table = await AdminModel.getTableById(tableId);

    if (!table) {
      return res.status(404).json({
        statusCode: 400,
        message: "Không tìm thấy bàn",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: table,
    });
  } catch (error) {
    console.error("Error getting table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin bàn",
      error: error.message,
    });
  }
};

// Create new table
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status = "available" } = req.body;

    // Validate required fields
    if (!tableNumber || !capacity) {
      return res.status(400).json({
        statusCode: 400,
        message: "Số bàn và sức chứa là bắt buộc",
      });
    }

    // Validate table number and capacity
    if (isNaN(parseInt(tableNumber)) || parseInt(tableNumber) <= 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Số bàn không hợp lệ",
      });
    }

    if (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Sức chứa không hợp lệ",
      });
    }

    // Validate status
    const validStatuses = ["available", "occupied"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        statusCode: 500,
        message:
          "Trạng thái bàn không hợp lệ - Chỉ chấp nhận: available, occupied",
      });
    }

    // Use model to create new table
    const table = await AdminModel.createTable({
      tableNumber: parseInt(tableNumber),
      capacity: parseInt(capacity),
      status,
    });

    res.status(201).json({
      statusCode: 200,
      message: "Tạo bàn mới thành công",
      data: table,
    });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể tạo bàn mới",
      error: error.message,
    });
  }
};

// Update table
exports.updateTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const { tableNumber, capacity, status } = req.body;

    // Validate inputs if provided
    if (
      tableNumber !== undefined &&
      (isNaN(parseInt(tableNumber)) || parseInt(tableNumber) <= 0)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Số bàn không hợp lệ",
      });
    }

    if (
      capacity !== undefined &&
      (isNaN(parseInt(capacity)) || parseInt(capacity) <= 0)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Sức chứa không hợp lệ",
      });
    }

    if (status !== undefined) {
      const validStatuses = [
        "available",
        "occupied",
        "reserved",
        "maintenance",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          statusCode: 400,
          message: "Trạng thái bàn không hợp lệ",
        });
      }
    }

    // Use model to update table (which includes validation checks)
    const updatedTable = await AdminModel.updateTable(tableId, {
      tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      status,
    });

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật bàn thành công",
      data: updatedTable,
    });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật bàn",
      error: error.message,
    });
  }
};

// Delete table
// exports.deleteTable = async (req, res) => {
//   try {
//     const tableId = req.params.id;

//     // Use model to delete table (which includes validation checks)
//     const result = await AdminModel.deleteTable(tableId);

//     res.status(200).json({
//       statusCode: 200,
//       message: result.message,
//     });
//   } catch (error) {
//     console.error("Error deleting table:", error);
//     res.status(500).json({
//       statusCode: 500,
//       message: "Không thể xóa bàn",
//       error: error.message,
//     });
//   }
// };

// Get tables availability status summary
// exports.getTableAvailability = async (req, res) => {
//   try {
//     // Use model to get availability data
//     const availability = await AdminModel.getTableAvailability();

//     // Get current date and time for client reference
//     const currentDateTime = new Date().toISOString();

//     // Format response to match current structure
//     const statusSummary = Object.entries(availability)
//       .filter(([key]) => key !== "total")
//       .map(([status, count]) => ({
//         status,
//         count,
//       }));

//     res.status(200).json({
//       statusCode: 200,
//       data: {
//         statusSummary,
//         currentDateTime,
//         totalCount: availability.total,
//       },
//     });
//   } catch (error) {
//     console.error("Error getting table availability:", error);
//     res.status(500).json({
//       statusCode: 500,
//       message: "Không thể lấy thông tin khả dụng của bàn",
//       error: error.message,
//     });
//   }
// };

// Get confirmed reserved tables by user
exports.getConfirmedReservedTables = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    const userId = req.query.userId; // Optional: filter by specific user
    const dateFilter = req.query.date; // Optional: filter by specific date

    // Prepare filters object
    const filters = {
      status: "reserved", // Only get tables with reserved status
      userId: userId || undefined,
      date: dateFilter || undefined,
    };

    // Call model method to get confirmed reservations
    const result = await AdminModel.getConfirmedReservedTables(
      page,
      limit,
      filters
    );

    res.status(200).json({
      statusCode: 200,
      message: "Lấy danh sách bàn đã đặt thành công",
      data: result.reservations,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting confirmed reserved tables:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách bàn đã đặt",
      error: error.message,
    });
  }
};

// Get all orders with pagination and optional filters
exports.getAllOrders = async (req, res) => {
  try {
    const { page, limit } = getPaginationParams(req);
    // You can pass query parameters as filters (e.g., ?statusCode=completed&fromDate=2025-03-01)
    const filters = req.query;
    const result = await AdminModel.getAllOrders(page, limit, filters);

    res.status(200).json({
      statusCode: 200,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await AdminModel.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        statusCode: 404,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.status(200).json({
      statusCode: 200,
      data: order,
    });
  } catch (error) {
    console.error("Error getting order by ID:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể lấy thông tin đơn hàng",
      error: error.message,
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, tableId, reservationId } = req.body;

    if (!status) {
      return res.status(400).json({
        statusCode: 400,
        message: "Trạng thái đơn hàng là bắt buộc",
      });
    }

    const result = await AdminModel.updateOrderStatus(
      orderId,
      status,
      tableId,
      reservationId
    );

    if (!result.success) {
      return res.status(404).json({
        statusCode: 404,
        message: result.message,
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
};

// Update reservation status
exports.updateReservationStatus = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status, tableId } = req.body;

    if (!status) {
      return res.status(400).json({
        statusCode: 400,
        message: "Trạng thái đặt bàn là bắt buộc",
      });
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "canceled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: pending, confirmed, canceled, completed",
      });
    }

    const result = await AdminModel.updateReservationStatus(
      reservationId,
      status,
      tableId
    );

    if (!result.success) {
      return res.status(404).json({
        statusCode: 404,
        message: result.message,
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật trạng thái đặt bàn",
      error: error.message,
    });
  }
};

exports.updateTopDishes = async (req, res) => {
  try {
    const topDishes = await AdminModel.updateTopDishes();

    res.status(200).json({
      statusCode: 200,
      message: "Cập nhật món đứng top thành công",
      data: topDishes,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật món đứng top:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Không thể cập nhật món đứng top",
      error: error.message,
    });
  }
};


// Helper function for extracting Cloudinary public IDs
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  try {
    // URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // Lấy phần sau v1234567890/
    const pathPart = parts[1].replace(/^v\d+\//, "");

    // Loại bỏ phần mở rộng file (.jpg, .png, etc.)
    return pathPart.replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Lỗi trích xuất public_id:", error);
    return null;
  }
}
