# Hướng dẫn phát triển Daily Tracker (MEVN Stack)

Dự án này được chia thành 2 phần tách biệt giúp bạn dễ dàng quản lý và kiểm soát toàn bộ luồng dữ liệu.

1. `backend/`: Chứa API và kết nối Database (Node.js, Express, MongoDB).
2. `frontend/`: Chứa giao diện người dùng (Vue.js).

## Cách chạy dự án song song
Để kiểm thử ở môi trường local, bạn cần chạy cả 2 server.

- **Mở Terminal 1 (Khởi động Backend):**
  ```bash
  cd backend
  node server.js
  ```
  *(Sẽ chạy ở port 3000)*

- **Mở Terminal 2 (Khởi động Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```
  *(Sẽ chạy ở port mặc định của Vite, ví dụ 5173)*
