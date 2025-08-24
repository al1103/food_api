# 🔒 Security Setup Guide

## ❌ Vấn đề đã fix

GitHub Push Protection đã chặn push vì phát hiện **Google Cloud Service Account credentials** trong commit.

## ✅ Đã thực hiện

1. **Xóa file nhạy cảm khỏi Git:**

   ```bash
   git rm --cached config/serviceAccountKey.json
   ```

2. **Cập nhật .gitignore:**

   - Thêm `config/serviceAccountKey.json`
   - Thêm các pattern bảo mật khác
   - Ngăn chặn commit secrets trong tương lai

3. **Tạo template file:**
   - `config/serviceAccountKey.json.example` - Template để setup

## 🚀 Setup cho developers

### 1. Copy template file:

```bash
cp config/serviceAccountKey.json.example config/serviceAccountKey.json
```

### 2. Cập nhật với credentials thật:

```json
{
  "type": "service_account",
  "project_id": "your-real-project-id",
  "private_key_id": "your-real-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_REAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "your-real-service-account@project.iam.gserviceaccount.com",
  ...
}
```

### 3. Verify file không được track:

```bash
git status
# serviceAccountKey.json không được hiển thị
```

## 🔐 Security Best Practices

### ✅ DO:

- Sử dụng environment variables cho production
- Dùng `.env` files cho local development
- Commit template/example files
- Sử dụng secret management services

### ❌ DON'T:

- Commit API keys, passwords, certificates
- Push service account keys lên Git
- Hardcode secrets trong source code
- Share credentials qua chat/email

## 📋 Files được bảo vệ

Các file sau sẽ KHÔNG được commit (đã thêm vào .gitignore):

```
# Sensitive configuration files
config/serviceAccountKey.json
config/*.key
config/*-key.json
**/serviceAccount*.json
*.p12
*.pfx

# Database backups
*.sql.backup
*.db.backup

# API keys and secrets
secrets/
credentials/
keys/
```

## 🔄 Environment Variables Setup

### Development (.env):

```bash
# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./config/serviceAccountKey.json
GOOGLE_PROJECT_ID=your-project-id

# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=food_db

# JWT
JWT_SECRET_KEY=your-jwt-secret

# ZaloPay
ZALOPAY_APP_ID=2554
ZALOPAY_KEY1=your-key1
ZALOPAY_KEY2=your-key2
```

### Production:

```bash
# Set environment variables in production server
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
export DB_PASSWORD=production-password
export JWT_SECRET_KEY=production-jwt-secret
```

## 🛠️ Code Changes Required

### Update Firebase/Google Cloud initialization:

```javascript
// Before (hardcoded path)
const serviceAccount = require("./config/serviceAccountKey.json");

// After (environment variable)
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  "./config/serviceAccountKey.json";
const serviceAccount = require(serviceAccountPath);
```

### Update database config:

```javascript
// Use environment variables
const config = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "food_db",
  password: process.env.DB_PASSWORD || "default-password",
  port: process.env.DB_PORT || 5432,
};
```

## 🚨 If secrets were already pushed

### 1. Rotate all compromised credentials:

- Generate new Google Cloud service account key
- Change database passwords
- Update JWT secret keys
- Regenerate API keys

### 2. Clean Git history (if needed):

```bash
# Remove file from all commits (DANGEROUS - rewrites history)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch config/serviceAccountKey.json' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if repository is private and you coordinate with team)
git push origin --force --all
```

### 3. Inform team:

- Notify all developers about credential rotation
- Update deployment configurations
- Check monitoring/logging for suspicious activity

## 📞 Next Steps

1. **Setup local development:**

   ```bash
   cp config/serviceAccountKey.json.example config/serviceAccountKey.json
   # Edit with real credentials
   ```

2. **Commit the fixes:**

   ```bash
   git add .gitignore config/serviceAccountKey.json.example
   git commit -m "fix: Remove sensitive credentials and update .gitignore"
   git push origin main
   ```

3. **Verify security:**
   ```bash
   git log --oneline -10
   # Check no sensitive files in recent commits
   ```

## 💡 Pro Tips

1. **Use git-secrets:** Install git-secrets to prevent future leaks

   ```bash
   git secrets --install
   git secrets --register-aws
   ```

2. **Pre-commit hooks:** Setup pre-commit hooks to scan for secrets

3. **Regular audits:** Periodically check repository for sensitive data

4. **Team training:** Educate team about security best practices

## 🔗 Useful Links

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)
- [Environment Variables Best Practices](https://12factor.net/config)
