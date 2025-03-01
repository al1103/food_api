# Docker Commands for Food API

This document contains the essential Docker commands for managing the Food API application.

## Prerequisites

Make sure you have the following installed:

- Docker
- Docker Compose

Also ensure you have a `.env` file in the project root with values for:

```
DB_SERVER=sql1
DB_PASSWORD=YourStrongPassword
DB_NAME=FoodAPI
API_KEY=your_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
OPENAI_API_KEY=your_openai_key
JWT_SECRET_KEY=your_jwt_secret
REFRESH_SECRET_KEY=your_refresh_token_secret
SECRET_KEY=your_secret_key
```

## Basic Docker Commands

### Start the application

```bash
docker-compose up
```

### Start the application in detached mode (runs in background)

```bash
docker-compose up -d
```

### Stop the application

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs
```

### View logs for a specific service

```bash
docker-compose logs api
docker-compose logs db
```

### Follow logs in real-time

```bash
docker-compose logs -f
```

### Rebuild containers (after Dockerfile or code changes)

```bash
docker-compose build
docker-compose up --build
```

### Status of running containers

```bash
docker-compose ps
```

## Database Management

### Connect to SQL Server container

```bash
docker exec -it sql1 /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P ${DB_PASSWORD}
```

### Backup database

```bash
docker exec -it sql1 /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P ${DB_PASSWORD} -Q "BACKUP DATABASE [${DB_NAME}] TO DISK = N'/var/opt/mssql/data/${DB_NAME}_backup.bak' WITH NOFORMAT, NOINIT, SKIP, NOREWIND, NOUNLOAD, STATS = 10"
```

## Troubleshooting

### Remove all containers and volumes (fresh start - will delete data)

```bash
docker-compose down -v
```

### View docker networks

```bash
docker network ls
```

### Inspect docker network

```bash
docker network inspect app-network
```
