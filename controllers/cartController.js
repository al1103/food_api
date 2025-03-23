const CartModel = require("../models/cart_model");

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: User ID not found in token",
      });
    }

    const cart = await CartModel.getCart(userId);

    res.json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    console.error("Error getting cart:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

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

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: User ID not found in token",
      });
    }

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
      sizeId || null, // Ensure we pass null if sizeId is undefined
      parsedQuantity
    );

    // Get updated cart to return in response
    const updatedCart = await CartModel.getCart(userId);

    res.status(201).json({
      status: "success",
      message: "Đã thêm món ăn vào giỏ hàng",
      data: {
        addedItem: result,
        cart: updatedCart,
      },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);

    const knownErrors = [
      "Dish not found",
      "Dish is currently not available",
      "Invalid size for this dish",
      "Selected size is currently not available",
      "No default size found for this dish",
      "User not found",
    ];

    if (knownErrors.includes(error.message)) {
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

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: User ID not found in token",
      });
    }

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

    // Get updated cart to return in response
    const updatedCart = await CartModel.getCart(userId);

    res.json({
      status: "success",
      message:
        parsedQuantity > 0
          ? "Đã cập nhật số lượng"
          : "Đã xóa món ăn khỏi giỏ hàng",
      data: {
        updatedItem: result,
        cart: updatedCart,
      },
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

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: User ID not found in token",
      });
    }

    const { cartId } = req.params;

    const result = await CartModel.removeFromCart(userId, cartId);

    // Get updated cart to return in response
    const updatedCart = await CartModel.getCart(userId);

    res.json({
      status: "success",
      message: "Đã xóa món ăn khỏi giỏ hàng",
      data: {
        removedItem: result.removedItem,
        cart: updatedCart,
      },
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

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized: User ID not found in token",
      });
    }

    const result = await CartModel.clearCart(userId);

    res.json({
      status: "success",
      message: "Đã xóa toàn bộ giỏ hàng",
      data: result,
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
