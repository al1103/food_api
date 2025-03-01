# SQL Server Connection Information

## Server Name for Connection

When connecting to the SQL Server database from:

### 1. From inside the Docker network (from the API container)

Use the container name as the server name:

```
Server name: sql1
```

### 2. From your local machine (outside Docker)

Use localhost with the exposed port:

```
Server name: localhost,1433
```

or

```
Server name: 127.0.0.1,1433
```

## Connection Details

- **Server name/host**: `sql1` (inside Docker) or `localhost,1433` (from host machine)
- **Port**: `1433`
- **Authentication**: SQL Server Authentication
- **Login**: `sa`
- **Password**: Value of `DB_PASSWORD` from your .env file
- **Database**: Value of `DB_NAME` from your .env file (likely "FoodAPI")

## Connection String Examples

### For Node.js (using mssql)

```javascript
const config = {
  user: "sa",
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // 'sql1' inside Docker
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
  },
};
```

### ADO.NET Connection String

```
Server=localhost,1433;Database=FoodAPI;User Id=sa;Password=YourStrongPassword;TrustServerCertificate=True;
```

### JDBC Connection String

```
jdbc:sqlserver://localhost:1433;databaseName=FoodAPI;user=sa;password=YourStrongPassword;trustServerCertificate=true;
```

## Testing the Connection

You can test the connection to the database using:

```bash
docker exec -it sql1 /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P ${DB_PASSWORD} -Q "SELECT @@VERSION"
```

This will return the SQL Server version if the connection is successful.
