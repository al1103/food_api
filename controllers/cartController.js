const CartModel = require("../models/cart_model");

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("req user", req.user);
    const cart = await CartModel.getCart(userId);

    res.json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể lấy giỏ hàng",
      error: error.message,
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { dishId, sizeId, quantity = 1 } = req.body;

    if (!dishId) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin món ăn",
      });
    }

    // Validate quantity
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng không hợp lệ",
      });
    }

    const result = await CartModel.addToCart(
      userId,
      dishId,
      sizeId,
      parsedQuantity
    );

    res.status(201).json({
      status: "success",
      message: "Đã thêm món ăn vào giỏ hàng",
      data: result,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);

    if (
      error.message === "Dish not found" ||
      error.message === "Dish is currently not available" ||
      error.message === "Invalid size for this dish" ||
      error.message === "Selected size is currently not available" ||
      error.message === "No default size found for this dish"
    ) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }

    res.status(500).json({
      status: "error",
      message: "Không thể thêm món ăn vào giỏ hàng",
      error: error.message,
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin số lượng",
      });
    }

    const parsedQuantity = parseInt(quantity);

    const result = await CartModel.updateCartItem(
      userId,
      cartId,
      parsedQuantity
    );

    res.json({
      status: "success",
      message:
        parsedQuantity > 0
          ? "Đã cập nhật số lượng"
          : "Đã xóa món ăn khỏi giỏ hàng",
      data: result,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn trong giỏ hàng",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Không thể cập nhật giỏ hàng",
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartId } = req.params;

    const result = await CartModel.removeFromCart(userId, cartId);

    res.json({
      status: "success",
      message: "Đã xóa món ăn khỏi giỏ hàng",
      data: result,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy món ăn trong giỏ hàng",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Không thể xóa món ăn khỏi giỏ hàng",
      error: error.message,
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    await CartModel.clearCart(userId);

    res.json({
      status: "success",
      message: "Đã xóa toàn bộ giỏ hàng",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      status: "error",
      message: "Không thể xóa giỏ hàng",
      error: error.message,
    });
  }
};
