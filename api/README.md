# 🔌 ChemEco API Server

## 🖥️ Backend API за система за докладване на отпадъци

Това е Node.js/TypeScript API сървър, който обслужва мобилното приложение и уеб платформата на ChemEco. Сървърът предоставя RESTful API за управление на потребители, доклади за отпадъци и качване на изображения с фокус върху химичните аспекти на околната среда.

### ✨ Основни функции

- 🔐 **JWT автентикация** - Сигурна автентикация с JWT токени
- 👥 **Управление на потребители** - Регистрация, вход, роли (user/admin)
- 📊 **CRUD операции** за доклади за отпадъци
- 📸 **Качване на изображения** - Multer за обработка на файлове
- 🗄️ **MySQL база данни** - Релационна база данни с оптимизирана схема
- 🛡️ **Сигурност** - bcrypt за хеширане на пароли
- 🌐 **CORS поддръжка** - Cross-origin requests за уеб платформата
- 👤 **Гостови доклади** - Възможност за анонимни доклади
- 🧪 **Химично категоризиране** - Научен подход към класификация на отпадъци

### 🏗️ Архитектура

```
src/
├── config/             # Конфигурация на базата данни
├── controllers/        # Business logic
├── middleware/         # Authentication middleware
├── models/            # Модели за базата данни
├── routes/            # API маршрути
└── services/          # Помощни услуги
```

## 🚀 Инсталация и настройка

### Предварителни изисквания

- Node.js (версия 18 или по-висока)
- MySQL Server (версия 8.0 или по-висока)
- npm или yarn

### Стъпки за инсталация

1. **Клониране на проекта**
```bash
git clone https://github.com/BRMilev22/eccc.git
cd eccc/api
```

2. **Инсталиране на зависимости**
```bash
npm install
# или
yarn install
```

3. **Настройка на базата данни**
```bash
# Влезте в MySQL
mysql -u root -p

# Изпълнете SQL скрипта
source ../ecccChemistryDb.sql
```

4. **Конфигуриране на environment variables**
Създайте `.env` файл в root директорията:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecccChemistryDb

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Upload Configuration
UPLOAD_DIR=public/uploads
MAX_FILE_SIZE=5242880
```

5. **Компилиране на TypeScript**
```bash
npm run build
```

6. **Стартиране на сървъра**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Сървърът ще бъде достъпен на `http://localhost:3000`

### 📊 Типове отпадъци (Химична класификация)

| Тип | Описание | Химични характеристики |
|-----|----------|----------------------|
| 🥤 **PLASTIC** | Пластмасови отпадъци | Полимери (PET, PE, PP, PS) |
| 🍎 **FOOD** | Органични отпадъци | Биоразградими съединения |
| ☠️ **HAZARDOUS** | Опасни отпадъци | Токсични химикали и тежки метали |
| 📄 **PAPER** | Хартиени отпадъци | Целулозни влакна |
| 📱 **ELECTRONICS** | Електронни отпадъци | Рядкоземни елементи, литий |
| 🗑️ **MIXED** | Смесени отпадъци | Различни композитни материали |

### ⚡ Нива на сериозност

- 🟢 **LOW** - Минимално екологично въздействие
- 🟡 **MEDIUM** - Умерено въздействие върху околната среда
- 🔴 **HIGH** - Критично въздействие, изисква незабавна намеса

## 📚 API Documentation

#### POST /api/auth/register
Регистрация на нов потребител

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "isAdmin": false
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/login
Вход в системата

**Request Body:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "isAdmin": false
  },
  "token": "jwt_token_here"
}
```

### 📊 Reports Endpoints

#### GET /api/reports
Получаване на всички доклади

**Response:**
```json
[
  {
    "id": 1,
    "userId": 2,
    "photo_url": "uploads/image.jpg",
    "latitude": 42.6977,
    "longitude": 23.3219,
    "description": "Plastic bottles near park",
    "trash_type": "PLASTIC",
    "severity_level": "HIGH",
    "status": "REPORTED",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

#### POST /api/reports
Създаване на нов доклад

**Headers:**
```
Authorization: Bearer jwt_token_here (optional for guests)
```

**Request Body:**
```json
{
  "photoUrl": "uploads/image.jpg",
  "latitude": 42.6977,
  "longitude": 23.3219,
  "description": "Large pile of plastic waste",
  "trashType": "PLASTIC",
  "severityLevel": "HIGH"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 2,
  "photoUrl": "uploads/image.jpg",
  "latitude": 42.6977,
  "longitude": 23.3219,
  "description": "Large pile of plastic waste",
  "trashType": "PLASTIC",
  "severityLevel": "HIGH",
  "status": "REPORTED"
}
```

#### GET /api/reports/:id
Получаване на конкретен доклад

**Response:**
```json
{
  "id": 1,
  "userId": 2,
  "photo_url": "uploads/image.jpg",
  "latitude": 42.6977,
  "longitude": 23.3219,
  "description": "Plastic bottles near park",
  "trash_type": "PLASTIC",
  "severity_level": "HIGH",
  "status": "REPORTED",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

#### PATCH /api/reports/:id
Актуализиране на доклад (изисква автентикация)

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "status": "CLEANED",
  "description": "Updated description"
}
```

#### DELETE /api/reports/:id
Изтриване на доклад (изисква автентикация)

**Headers:**
```
Authorization: Bearer jwt_token_here
```

### 📸 Upload Endpoints

#### POST /api/upload
Качване на изображение

**Request:**
- Content-Type: multipart/form-data
- Field name: "image"
- Supported formats: JPG, JPEG, PNG
- Max size: 5MB

**Response:**
```json
{
  "imageUrl": "uploads/uuid-filename.jpg",
  "message": "Image uploaded successfully"
}
```

## 🗄️ База данни

### Схема на базата данни

#### users таблица
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);
```

#### trash_reports таблица
```sql
CREATE TABLE trash_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  photo_url VARCHAR(512) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  trash_type ENUM('PLASTIC', 'FOOD', 'HAZARDOUS', 'PAPER', 'ELECTRONICS', 'MIXED') NULL,
  severity_level ENUM('LOW', 'MEDIUM', 'HIGH') NULL,
  status ENUM('REPORTED', 'IN_PROGRESS', 'CLEANED', 'VERIFIED') DEFAULT 'REPORTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Индекси
- `idx_lat_long` - За бързи геолокационни заявки
- `idx_status` - За филтриране по статус
- `idx_trash_type` - За филтриране по тип отпадък
- `idx_severity` - За филтриране по ниво на сериозност

## 🛡️ Сигурност

### Автентикация
- JWT токени с expiration
- bcrypt хеширане на пароли (salt rounds: 10)
- Защитени маршрути с middleware

### Валидация
- Input validation за всички endpoints
- File type validation за uploads
- Size limits за изображения

### CORS
```typescript
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:8081'],
  credentials: true
}));
```

## 📁 Файлова структура

```
src/
├── config/
│   └── db.ts              # MySQL connection
├── controllers/
│   ├── authController.ts   # Authentication logic
│   ├── trashReportController.ts # Reports CRUD
│   └── uploadController.ts # File upload handling
├── middleware/
│   └── authMiddleware.ts   # JWT verification
├── models/
│   ├── user.ts            # User model
│   └── trashReport.ts     # Report model
├── routes/
│   ├── authRoutes.ts      # Auth endpoints
│   ├── trashReportRoutes.ts # Report endpoints
│   └── uploadRoutes.ts    # Upload endpoints
├── services/
│   └── uploadService.ts   # File handling utilities
└── index.ts              # Server entry point
```

## 🔧 Конфигурация

### TypeScript конфигурация (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### Package.json scripts
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

## 🧪 Тестване

### API тестване с curl

**Тест на връзката:**
```bash
curl http://localhost:3000/api/reports/debug
```

**Регистрация:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

**Получаване на доклади:**
```bash
curl http://localhost:3000/api/reports
```

### Postman Collection
Може да създадете Postman collection с всички endpoints за по-лесно тестване.

## 📊 Мониторинг и логове

### Логове
Сървърът логва:
- HTTP заявки и отговори
- Database операции
- Грешки и exceptions
- File upload операции

### Health Check
```bash
GET /api/reports/debug
```

Връща статус информация за сървъра.

## 🚀 Деплой

### Production настройки

1. **Environment variables**
```env
NODE_ENV=production
DB_HOST=your_production_db_host
JWT_SECRET=very_strong_secret_key
```

2. **PM2 конфигурация**
```json
{
  "name": "ecotracker-api",
  "script": "dist/index.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Nginx конфигурация**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /uploads {
        alias /path/to/your/uploads;
    }
}
```

## 🐛 Отстраняване на проблеми

### Чести проблеми

1. **Database connection failed**
   - Проверете MySQL сървъра
   - Валидирайте credentials в .env
   - Проверете firewall настройките

2. **JWT token invalid**
   - Проверете JWT_SECRET в .env
   - Валидирайте token format
   - Проверете expiration time

3. **File upload failed**
   - Проверете permissions на uploads директорията
   - Валидирайте file size и type
   - Проверете UPLOAD_DIR настройката

### Debug режим
```bash
DEBUG=* npm run dev
```

## 📈 Performance

### Оптимизации
- Database индекси за бързи заявки
- Connection pooling за MySQL
- File compression за uploads
- Rate limiting (препоръчително)

### Мониторинг
- Response time tracking
- Database query monitoring
- Error rate tracking
- Memory usage monitoring

## 🔄 API Versioning

Текущата версия: v1
Base URL: `/api/`

Бъдещи версии ще използват: `/api/v2/`, `/api/v3/` и т.н.

## 📄 Лиценз

Този проект е учебен и е предназначен за образователни цели.

## 🤝 Принос

За въпроси или предложения относно API-то, моля свържете се с разработчика.

---

**Backend API за учебен проект по химия и околна среда** 🧪🌍

---

> **"Химия за устойчива околна среда"** - ChemEco API 2025

*Разработено от екипа на ПГКПИ за опазване на природата*
