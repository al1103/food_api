# Fixing bcrypt Error in Docker Container

The error `Error loading shared library /usr/src/app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: Exec format error` occurs because the bcrypt native module was compiled for a different architecture than the one in the Docker container.

## Solution

There are two ways to fix this issue:

### Option 1: Rebuild the Docker image with proper build tools (Recommended)

The Dockerfile has been updated to include the necessary build dependencies and rebuild bcrypt from source.

```bash
# Rebuild the Docker container
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Option 2: Manual fix (if you don't want to rebuild)

If you don't want to rebuild the container, you can connect to the running container and fix bcrypt:

```bash
# Connect to the container
docker exec -it food-api /bin/sh

# Inside the container, install build dependencies
apk add --no-cache make gcc g++ python3

# Rebuild bcrypt
npm rebuild bcrypt --build-from-source

# Exit the container
exit

# Restart the container
docker-compose restart api
```

## Prevention for Future

To avoid this issue in the future:

1. Always use a consistent architecture for development and deployment
2. When using native modules like bcrypt, ensure the build environment in Docker has the necessary tools
3. Consider using `bcryptjs` (a pure JavaScript implementation) instead of bcrypt if cross-architecture compatibility is important
