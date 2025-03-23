## 📌 Install Dependencies

To install all required dependencies, run:

```bash
npm install
npm i -g nodemon
```

link hướng dẫn import file sql : https://www.youtube.com/watch?v=QdKOqlD_3jw

link test postman: '/postman/Restaurant.json'

## ⚙️ Configure Environment Variables

1. Create a `.env` file in the root directory.
2. Copy the content from `.env.example`.
3. Update the values according to your setup.

## 🛠 Database Setup

1. Create a new database in **SQL Server**.
2. Run the SQL scripts located in `/database/scripts` to set up tables.

## 🚀 Running the Application

### Development Mode:

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

## 📖 API Documentation

### 🔑 Authentication Endpoints

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| POST   | `/api/users/register`    | Register a new user      |
| POST   | `/api/users/verify-code` | Verify registration code |
| POST   | `/api/users/login`       | User login               |
| POST   | `/api/users/token`       | Refresh access token     |

## 📜 Available Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm start`    | Start the server                     |
| `npm run dev`  | Start the server in development mode |
| `npm test`     | Run tests                            |
| `npm run lint` | Run ESLint for code quality          |

## ❗ Error Handling

The API uses the following statusCode codes:
| statusCode Code | Meaning |
|-------------|--------------------------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

### 📝 Notes

- Ensure that your environment variables are correctly set up before running the application.
- For further information, check the API documentation.

Happy Coding! 🚀
