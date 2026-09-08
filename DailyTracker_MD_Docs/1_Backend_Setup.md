# Chi tiết xây dựng Backend từ con số 0

Để nắm vững cách Express xử lý HTTP request và kết nối với MongoDB, chúng ta sẽ không dùng các công cụ tự sinh code (scaffolding) mà tự tay thiết lập từng file. 

## Bước 1: Khởi tạo dự án
Mở terminal và chạy các lệnh sau:
```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose cors dotenv
```

## Bước 2: Tạo cấu trúc thư mục thủ công
Bạn hãy tạo các thư mục và file trống tương ứng như sau:
```text
backend/
├── config/
│   └── db.js             # Logic kết nối MongoDB
├── controllers/
│   └── dayController.js  # Chứa các hàm xử lý API (ví dụ: getDay, toggleTask)
├── models/
│   └── Day.js            # Định nghĩa Schema cho MongoDB
├── routes/
│   └── dayRoutes.js      # Gắn các controller vào từng endpoint (GET, POST, PUT)
├── .env                  # Lưu biến môi trường (PORT=3000, MONGO_URI)
└── server.js             # File gốc khởi chạy hệ thống
```

## Bước 3: Code các thành phần cốt lõi đầu tiên

### 1. `models/Day.js` (Schema)
Quy định kiểu dữ liệu sẽ lưu xuống DB.
```javascript
const mongoose = require('mongoose');

const DaySchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // Định dạng: YYYY-MM-DD
    tasks: [{
        title: String,
        isCompleted: { type: Boolean, default: false }
    }]
});

module.exports = mongoose.model('Day', DaySchema);
```

### 2. `server.js` (Khởi tạo Server)
Dựng khung để app có thể nhận request từ Vue.js (qua CORS).
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());           // Cho phép frontend gọi API
app.use(express.json());   // Parse body của request thành JSON

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend server đang chạy tại http://localhost:${PORT}`);
});
```
