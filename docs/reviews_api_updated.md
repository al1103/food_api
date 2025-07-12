# Reviews API Documentation (Updated)

## Overview
Hệ thống đánh giá và review cho món ăn, sử dụng function `rateDish` hiện có và bảng `dish_ratings`. Cho phép người dùng đánh giá món ăn với rating và comment.

## Base URL
```
/api/dishes
```

## Authentication
Hầu hết các endpoints yêu cầu authentication thông qua JWT token trong header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Tạo/Cập nhật đánh giá món ăn
**POST** `/api/dishes/:id/rate`

**Authentication:** Required

**Body:**
```json
{
  "rating": 5,
  "comment": "Món ăn rất ngon!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Dish rated successfully",
  "dish": {
    "id": 1,
    "name": "Phở Bò",
    "ratings": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Món ăn rất ngon!",
        "username": "user1",
        "full_name": "User One",
        "avatar": "avatar_url",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 2. Lấy đánh giá theo món ăn
**GET** `/api/dishes/:id/reviews`

**Authentication:** Not required

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (default: 'created_at')
- `sortOrder` (default: 'DESC')

**Response:**
```json
{
  "statusCode": 200,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Phở rất ngon!",
        "username": "user1",
        "full_name": "User One",
        "avatar": "avatar_url",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Thống kê đánh giá món ăn
**GET** `/api/dishes/:id/reviews/stats`

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "message": "Review statistics retrieved successfully",
  "data": {
    "total_reviews": 25,
    "average_rating": 4.2,
    "five_star": 10,
    "four_star": 8,
    "three_star": 4,
    "two_star": 2,
    "one_star": 1
  }
}
```

### 4. Món ăn đánh giá cao nhất
**GET** `/api/dishes/reviews/top-rated`

**Authentication:** Not required

**Query Parameters:**
- `limit` (default: 10)

**Response:**
```json
{
  "statusCode": 200,
  "message": "Top rated dishes retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Phở Bò",
      "price": 75000,
      "review_count": 25,
      "average_rating": 4.8
    }
  ]
}
```

### 5. Đánh giá gần đây
**GET** `/api/dishes/reviews/recent`

**Authentication:** Not required

**Query Parameters:**
- `limit` (default: 10)

**Response:**
```json
{
  "statusCode": 200,
  "message": "Recent reviews retrieved successfully",
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Món ăn rất ngon!",
      "username": "user1",
      "full_name": "User One",
      "avatar": "avatar_url",
      "dish_id": 1,
      "dish_name": "Phở Bò",
      "dish_image": "image_url",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 6. Lấy thông tin món ăn với đánh giá
**GET** `/api/dishes/:id`

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "Phở Bò",
      "description": "Soup with rice noodles and beef",
      "price": 75000,
      "ratings": [
        {
          "id": 1,
          "rating": 5,
          "comment": "Món ăn rất ngon!",
          "username": "user1",
          "full_name": "User One",
          "avatar": "avatar_url",
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Rating must be between 1 and 5"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Dish not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Server error",
  "error": "Error details"
}
```

## Database Schema

### Dish Ratings Table (Updated)
```sql
CREATE TABLE dish_ratings (
  id serial NOT NULL,
  dish_id integer NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment TEXT,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT dish_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT dish_ratings_dish_id_user_id_key UNIQUE (dish_id, user_id)
);
```

## Features

1. **Rating System**: Đánh giá từ 1-5 sao
2. **Comment System**: Hỗ trợ comment cho đánh giá
3. **Auto Update**: Tự động cập nhật đánh giá nếu user đã đánh giá trước đó
4. **Review Statistics**: Thống kê chi tiết về đánh giá món ăn
5. **Pagination**: Hỗ trợ phân trang cho danh sách đánh giá
6. **Sorting**: Sắp xếp theo nhiều tiêu chí khác nhau
7. **Top Rated**: Lấy danh sách món ăn đánh giá cao nhất
8. **Recent Reviews**: Lấy đánh giá gần đây
9. **User Information**: Hiển thị thông tin người đánh giá
10. **Dish Integration**: Tích hợp đánh giá vào thông tin món ăn

## Usage Examples

### Tạo đánh giá
```bash
curl -X POST http://localhost:9999/api/dishes/1/rate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Món ăn rất ngon!"
  }'
```

### Lấy đánh giá món ăn
```bash
curl -X GET "http://localhost:9999/api/dishes/1/reviews?page=1&limit=10"
```

### Lấy thống kê đánh giá
```bash
curl -X GET "http://localhost:9999/api/dishes/1/reviews/stats"
```

### Lấy món ăn đánh giá cao
```bash
curl -X GET "http://localhost:9999/api/dishes/reviews/top-rated?limit=10"
```

### Lấy đánh giá gần đây
```bash
curl -X GET "http://localhost:9999/api/dishes/reviews/recent?limit=10"
```

## Database Update

Chạy SQL để cập nhật database:

```bash
psql -d food_db -f sql/add_comment_to_dish_ratings.sql
```

SQL này sẽ:
1. Thêm cột `comment` vào bảng `dish_ratings`
2. Tạo index cho tìm kiếm comment
3. Tạo trigger để tự động cập nhật `updated_at`
4. Thêm sample data với comments 