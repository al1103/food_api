const DishModel = require("../models/dishes_model");
const { pool } = require("../config/database");
const { getPaginationParams } = require("../utils/pagination");
const cloudinary = require("../config/cloudinary");
const ApiResponse = require("../utils/apiResponse");

const fs = require("fs");

// Add this to your dishesController.js file
exports.getTopDishes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const dishes = await DishModel.getTopDishes(limit);

    // Fix: Add the status code as the second parameter (200 for success)
    return ApiResponse.success(res, 200, {
      message: "Lấy danh sách món ăn phổ biến thành công",
      data: dishes,
    });
  } catch (error) {
    console.error("Error in getTopDishes controller:", error);
    return ApiResponse.error(
      res,
      500,
      "Đã xảy ra lỗi khi lấy danh sách món ăn phổ biến",
    );
  }
};

exports.getAllDishes = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const { categoryId } = req.query;

    // Pass category ID as an optional filter
    const result = await DishModel.getAllDishes(
      page,
      limit,
      offset,
      categoryId,
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Dishes retrieved successfully",
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalItems: result.count,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error getting dishes:", error);
    return res.status(500).json({
      statusCode: 500,
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
      return res.status(404).json({
        statusCode: 404,
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

    return res.status(200).json({
      statusCode: 200,
      data: [dish],
    });
  } catch (error) {
    console.error("Error getting dish:", error);
    return res.status(500).json({
      statusCode: 500,
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
      categoryId, // Changed from category to categoryId
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

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing required fields",
      });
    }

    // Validate if category exists
    // const category = await DishModel.getCategoryById(categoryId);
    // if (!category) {
    //   return res.status(400).json({
    //     statusCode: 400,
    //     message: "Invalid category ID",
    //   });
    // }

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
      categoryId,
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
        sizesToAdd.map((size) => DishModel.addDishSize(dishId, size)),
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
            `Creating ${newToppingsArray.length} new toppings for dish ${dishId}`,
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

    return res.status(201).json({
      statusCode: 200,
      message: "Dish created successfully",
      dish: newDish,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    return res.status(500).json({
      statusCode: 500,
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
      return res.status(404).json({
        statusCode: 500,
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
        sizesToAdd.map((size) => DishModel.addDishSize(id, size)),
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
              `Creating ${newToppingsArray.length} new toppings for dish ${id}`,
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

    return res.status(200).json({
      statusCode: 200,
      message: "Dish updated successfully",
      dish: updatedDish,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    return res.status(500).json({
      statusCode: 500,
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
      return res.status(404).json({
        statusCode: 500,
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

    return res.status(200).json({
      statusCode: 200,
      message: "Dish deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return res.status(500).json({
      statusCode: 500,
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

    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        statusCode: 400,
        message: "Rating must be between 1 and 5",
      });
    }

    // Validate userId - bắt buộc phải có
    if (!userId) {
      return res.status(400).json({
        statusCode: 400,
        message: "User ID is required. Please log in to rate dishes.",
      });
    }

    // Check if dish exists
    const dish = await DishModel.getDishById(id);
    if (!dish) {
      return res.status(404).json({
        statusCode: 404,
        message: "Dish not found",
      });
    }

    // Check if user has already rated this dish
    const existingRating = await DishModel.getUserRating(id, userId);

    let ratingId;

    if (existingRating) {
      // Update existing rating with comment
      ratingId = existingRating.id;
      await DishModel.updateRating(ratingId, rating, comment);
      console.log(
        `Updated rating ${ratingId} for dish ${id} by user ${userId} with value ${rating} and comment: ${comment}`,
      );
    } else {
      // Add new rating with comment
      try {
        ratingId = await DishModel.addRating(id, userId, rating, comment);
        console.log(
          `Added new rating ${ratingId} for dish ${id} by user ${userId} with value ${rating} and comment: ${comment}`,
        );
      } catch (ratingError) {
        console.error("Detailed error when adding rating:", ratingError);
        return res.status(400).json({
          statusCode: 400,
          message: "Failed to add rating",
          error: ratingError.message,
        });
      }
    }

    // Get updated dish with ratings
    const updatedDish = await DishModel.getDishById(id);
    const ratings = await DishModel.getDishRatings(id);
    updatedDish.ratings = ratings;

    return res.status(200).json({
      statusCode: 200,
      message: "Dish rated successfully",
      dish: updatedDish,
    });
  } catch (error) {
    console.error("Error rating dish:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAllToppings = async (req, res) => {
  try {
    const toppings = await DishModel.getAllToppings();

    return res.status(200).json({
      statusCode: 200,
      message: "Toppings retrieved successfully",
      toppings,
    });
  } catch (error) {
    console.error("Error getting toppings:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update getAllCategories function
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await DishModel.getAllCategories();
    return res.status(200).json({
      statusCode: 200,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update createCategory function
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        statusCode: 400,
        message: "Category name is required",
      });
    }

    const categoryId = await DishModel.createCategory({ name });
    const newCategory = await DishModel.getCategoryById(categoryId);

    return res.status(201).json({
      statusCode: 201,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add updateCategory function
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        statusCode: 400,
        message: "Category name is required",
      });
    }

    // Check if category exists
    const category = await DishModel.getCategoryById(id);
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: "Category not found",
      });
    }

    await DishModel.updateCategory(id, { name });
    const updatedCategory = await DishModel.getCategoryById(id);

    return res.status(200).json({
      statusCode: 200,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add deleteCategory function
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await DishModel.getCategoryById(id);
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: "Category not found",
      });
    }

    // Check if category has dishes
    const dishes = await DishModel.getDishesByCategory(id);
    if (dishes.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Cannot delete category with existing dishes",
      });
    }

    await DishModel.deleteCategory(id);

    return res.status(200).json({
      statusCode: 200,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getDishesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Validate categoryId
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid category ID",
      });
    }

    // Check if category exists
    const category = await DishModel.getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: "Category not found",
      });
    }

    const result = await DishModel.getDishesByCategory(
      parseInt(categoryId),
      parseInt(page),
      parseInt(limit),
      parseInt(offset),
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Dishes retrieved successfully",
      category: category.name,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalItems: result.count,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error getting dishes by category:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.setDishAvailability = async (req, res) => {
  try {
    // Parse the ID as an integer and validate it
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid dish ID format",
      });
    }

    const { available } = req.body;

    // Convert string to boolean if needed
    const isAvailable =
      available === "true" || available === true ? true : false;

    // Check if dish exists
    const dish = await DishModel.getDishById(id);
    if (!dish) {
      return res.status(404).json({
        statusCode: 404,
        message: "Dish not found",
      });
    }

    const updatedDish = await DishModel.setDishAvailability(id, isAvailable);

    return ApiResponse.success(res, 200, {
      message: `Dish ${isAvailable ? "enabled" : "disabled"} successfully`,
      data: updatedDish,
    });
  } catch (error) {
    console.error("Error setting dish availability:", error);
    return ApiResponse.error(res, 500, "Failed to update dish availability");
  }
};

// Get reviews for a specific dish
exports.getDishReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    // Check if dish exists
    const dish = await DishModel.getDishById(id);
    if (!dish) {
      return res.status(404).json({
        statusCode: 404,
        message: "Dish not found",
      });
    }

    const offset = (page - 1) * limit;
    
    // Get reviews with pagination
    const query = `
      SELECT 
        dr.id, 
        dr.rating, 
        dr.comment,
        dr.created_at,
        dr.updated_at,
        u.username,
        u.full_name,
        u.avatar
      FROM dish_ratings dr
      JOIN users u ON dr.user_id = u.user_id
      WHERE dr.dish_id = $1
      ORDER BY dr.${sortBy} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dish_ratings
      WHERE dish_id = $1
    `;
    
    const [reviewsResult, countResult] = await Promise.all([
      pool.query(query, [id, limit, offset]),
      pool.query(countQuery, [id])
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      statusCode: 200,
      message: "Reviews retrieved successfully",
      data: {
        reviews: reviewsResult.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error getting dish reviews:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get review statistics for a dish
exports.getDishReviewStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if dish exists
    const dish = await DishModel.getDishById(id);
    if (!dish) {
      return res.status(404).json({
        statusCode: 404,
        message: "Dish not found",
      });
    }

    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM dish_ratings
      WHERE dish_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    const stats = result.rows[0];

    return res.status(200).json({
      statusCode: 200,
      message: "Review statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Error getting review stats:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get top rated dishes
exports.getTopRatedDishes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = `
      SELECT 
        d.*,
        COUNT(dr.id) as review_count,
        AVG(dr.rating) as average_rating
      FROM dishes d
      LEFT JOIN dish_ratings dr ON d.id = dr.dish_id
      GROUP BY d.id
      HAVING COUNT(dr.id) >= 1
      ORDER BY average_rating DESC, review_count DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [parseInt(limit)]);

    return res.status(200).json({
      statusCode: 200,
      message: "Top rated dishes retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    console.error("Error getting top rated dishes:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get recent reviews
exports.getRecentReviews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = `
      SELECT 
        dr.id,
        dr.rating,
        dr.comment,
        dr.created_at,
        dr.updated_at,
        u.username,
        u.full_name,
        u.avatar,
        d.id as dish_id,
        d.name as dish_name,
        d.image_url as dish_image
      FROM dish_ratings dr
      LEFT JOIN users u ON dr.user_id = u.user_id
      LEFT JOIN dishes d ON dr.dish_id = d.id
      ORDER BY dr.created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [parseInt(limit)]);

    return res.status(200).json({
      statusCode: 200,
      message: "Recent reviews retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    console.error("Error getting recent reviews:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message,
    });
  }
};
