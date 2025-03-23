const DishModel = require("../models/dishes_model");
const { pool } = require("../config/database");
const { getPaginationParams } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

exports.getAllDishes = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    // Truyền đầy đủ 3 tham số: page, limit, offset
    const result = await DishModel.getAllDishes(page, limit, offset);

    return res.statusCode(200).json({
      success: true,
      message: "Dishes retrieved successfully",
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalItems: result.count,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      dishes: result.rows,
    });
  } catch (error) {
    console.error("Error getting dishes:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getDishById = async (req, res) => {
  try {
    const { id } = req.params;

    const dish = await DishModel.getDishById(id);

    if (!dish) {
      return res.statusCode(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    // Get dish sizes
    const sizes = await DishModel.getDishSizes(id);

    // Get dish toppings
    const toppings = await DishModel.getDishToppings(id);

    // Get dish ratings
    const ratings = await DishModel.getDishRatings(id);

    dish.sizes = sizes;
    dish.toppings = toppings;
    dish.ratings = ratings;

    return res.statusCode(200).json({
      success: true,
      dish,
    });
  } catch (error) {
    console.error("Error getting dish:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.createDish = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      preparation_time,
      has_small,
      small_price,
      has_medium,
      medium_price,
      has_large,
      large_price,
      // Mảng các id của topping đã tồn tại trong database
      // Mảng các topping mới cần tạo
      new_toppings,
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !price || !preparation_time) {
      return res.statusCode(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let imageUrl = null;

    // Upload image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;

      // Delete local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Create dish in database
    const dishId = await DishModel.createDish({
      name,
      description,
      category,
      price,
      preparation_time,
      image: imageUrl,
    });

    // Add standard sizes based on form inputs
    const sizesToAdd = [];

    // Add small size if requested
    if (has_small === "true" || has_small === true) {
      sizesToAdd.push({
        size_name: "Small",
        price_adjustment: small_price || -2.0, // Default to -2.00 if not specified
      });
    }

    // Add medium size if requested
    if (has_medium === "true" || has_medium === true) {
      sizesToAdd.push({
        size_name: "Medium",
        price_adjustment: medium_price || 0.0, // Default to 0.00 if not specified
      });
    }

    // Add large size if requested
    if (has_large === "true" || has_large === true) {
      sizesToAdd.push({
        size_name: "Large",
        price_adjustment: large_price || 3.0, // Default to 3.00 if not specified
      });
    }

    // Add the sizes to the dish
    if (sizesToAdd.length > 0) {
      await Promise.all(
        sizesToAdd.map((size) => DishModel.addDishSize(dishId, size))
      );
    }

    // Mảng để theo dõi tất cả các topping đã thêm vào món ăn
    const addedToppingIds = [];

    // 1. Xử lý topping mới (nếu có)
    if (new_toppings) {
      try {
        // Parse new_toppings nếu nó là chuỗi JSON
        const newToppingsArray =
          typeof new_toppings === "string"
            ? JSON.parse(new_toppings)
            : new_toppings;

        if (Array.isArray(newToppingsArray) && newToppingsArray.length > 0) {
          console.log(
            `Creating ${newToppingsArray.length} new toppings for dish ${dishId}`
          );

          // Tạo và thêm từng topping mới
          for (const newTopping of newToppingsArray) {
            const { name, price } = newTopping;
            if (name && price) {
              const toppingId = await DishModel.createTopping(name, price);
              if (toppingId) {
                await DishModel.addDishTopping(dishId, toppingId);
                addedToppingIds.push(toppingId);
              }
            }
          }
        }
      } catch (newToppingError) {
        console.error("Error processing new toppings:", newToppingError);
      }
    }

    // 2. Thêm các topping đã tồn tại

    // Lấy thông tin món ăn đã tạo để trả về
    const newDish = await DishModel.getDishById(dishId);

    // Lấy thông tin kích thước để đính kèm vào response
    const sizes = await DishModel.getDishSizes(dishId);
    newDish.sizes = sizes;

    // Lấy thông tin topping để đính kèm vào response
    const dishToppings = await DishModel.getDishToppings(dishId);
    newDish.toppings = dishToppings;

    return res.statusCode(201).json({
      success: true,
      message: "Dish created successfully",
      dish: newDish,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      preparation_time,
      has_small,
      small_price,
      has_medium,
      medium_price,
      has_large,
      large_price,
      new_toppings,
    } = req.body;

    // Check if dish exists
    const existingDish = await DishModel.getDishById(id);

    if (!existingDish) {
      return res.statusCode(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    let imageUrl = existingDish.image;

    // Upload new image if provided
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (existingDish.image) {
        const publicId = existingDish.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;

      // Delete local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Update dish in database
    await DishModel.updateDish(id, {
      name: name || existingDish.name,
      description: description || existingDish.description,
      category: category || existingDish.category,
      price: price || existingDish.price,
      preparation_time: preparation_time || existingDish.preparation_time,
      image: imageUrl,
    });

    // Update sizes based on form inputs
    // First remove all existing sizes
    await DishModel.removeDishSizes(id);

    // Then add sizes based on inputs
    const sizesToAdd = [];

    // Add small size if requested
    if (has_small === "true" || has_small === true) {
      sizesToAdd.push({
        size_name: "Small",
        price_adjustment: small_price || -2.0,
      });
    }

    // Add medium size if requested
    if (has_medium === "true" || has_medium === true) {
      sizesToAdd.push({
        size_name: "Medium",
        price_adjustment: medium_price || 0.0,
      });
    }

    // Add large size if requested
    if (has_large === "true" || has_large === true) {
      sizesToAdd.push({
        size_name: "Large",
        price_adjustment: large_price || 3.0,
      });
    }

    // Add the sizes to the dish
    if (sizesToAdd.length > 0) {
      await Promise.all(
        sizesToAdd.map((size) => DishModel.addDishSize(id, size))
      );
    }

    // Kiểm tra xem có định cập nhật topping không
    const shouldUpdateToppings = new_toppings !== undefined;

    if (shouldUpdateToppings) {
      // Xóa tất cả topping hiện tại của món ăn
      await DishModel.removeDishToppings(id);

      // Mảng để theo dõi các topping đã thêm
      const addedToppingIds = [];

      // 1. Thêm các topping mới (nếu có)
      if (new_toppings) {
        try {
          // Parse new_toppings nếu nó là chuỗi JSON
          const newToppingsArray =
            typeof new_toppings === "string"
              ? JSON.parse(new_toppings)
              : new_toppings;

          if (Array.isArray(newToppingsArray) && newToppingsArray.length > 0) {
            console.log(
              `Creating ${newToppingsArray.length} new toppings for dish ${id}`
            );

            // Tạo và thêm từng topping mới
            for (const newTopping of newToppingsArray) {
              const { name, price } = newTopping;
              if (name && price) {
                const toppingId = await DishModel.createTopping(name, price);
                if (toppingId) {
                  await DishModel.addDishTopping(id, toppingId);
                  addedToppingIds.push(toppingId);
                }
              }
            }
          }
        } catch (newToppingError) {
          console.error("Error processing new toppings:", newToppingError);
        }
      }
    }

    const updatedDish = await DishModel.getDishById(id);

    // Get dish sizes to include in response
    const sizes = await DishModel.getDishSizes(id);
    updatedDish.sizes = sizes;

    // Get dish toppings to include in response
    const dishToppings = await DishModel.getDishToppings(id);
    updatedDish.toppings = dishToppings;

    return res.statusCode(200).json({
      success: true,
      message: "Dish updated successfully",
      dish: updatedDish,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deleteDish = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if dish exists
    const dish = await DishModel.getDishById(id);

    if (!dish) {
      return res.statusCode(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    // Delete image from Cloudinary if exists
    if (dish.image) {
      const publicId = dish.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete dish from database
    await DishModel.deleteDish(id);

    return res.statusCode(200).json({
      success: true,
      message: "Dish deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.rateDish = async (req, res) => {
  try {
    const { id } = req.params;

    // Đảm bảo userId luôn có giá trị
    let userId = req.userData.userId;

    // Log thông tin debug
    console.log("Request userData:", req.userData);
    console.log("User ID determined:", userId);

    const { rating } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.statusCode(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Validate userId - bắt buộc phải có
    if (!userId) {
      return res.statusCode(400).json({
        success: false,
        message: "User ID is required. Please log in to rate dishes.",
      });
    }

    // Check if dish exists
    const dish = await DishModel.getDishById(id);
    if (!dish) {
      return res.statusCode(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    // Check if user has already rated this dish
    const existingRating = await DishModel.getUserRating(id, userId);

    let ratingId;

    if (existingRating) {
      // Update existing rating
      ratingId = existingRating.id;
      await DishModel.updateRating(ratingId, rating);
      console.log(
        `Updated rating ${ratingId} for dish ${id} by user ${userId} with value ${rating}`
      );
    } else {
      // Add new rating
      try {
        ratingId = await DishModel.addRating(id, userId, rating);
        console.log(
          `Added new rating ${ratingId} for dish ${id} by user ${userId} with value ${rating}`
        );
      } catch (ratingError) {
        console.error("Detailed error when adding rating:", ratingError);
        return res.statusCode(400).json({
          success: false,
          message: "Failed to add rating",
          error: ratingError.message,
        });
      }
    }

    // Get updated dish with ratings
    const updatedDish = await DishModel.getDishById(id);
    const ratings = await DishModel.getDishRatings(id);
    updatedDish.ratings = ratings;

    return res.statusCode(200).json({
      success: true,
      message: "Dish rated successfully",
      dish: updatedDish,
    });
  } catch (error) {
    console.error("Error rating dish:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAllToppings = async (req, res) => {
  try {
    const toppings = await DishModel.getAllToppings();

    return res.statusCode(200).json({
      success: true,
      message: "Toppings retrieved successfully",
      toppings,
    });
  } catch (error) {
    console.error("Error getting toppings:", error);
    return res.statusCode(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
