# Chi tiết xây dựng Frontend (Vue.js)

Phần giao diện sẽ được chia thành các component nhỏ để bạn dễ dàng quản lý state (trạng thái) như % của progress bar.

## Bước 1: Khởi tạo Vue 3
Sử dụng Vite để thiết lập môi trường (nhanh và gọn nhẹ hơn Webpack).
```bash
npm create vite@latest frontend -- --template vue
cd frontend
npm install
npm install axios
```

## Bước 2: Thiết lập cấu trúc thư mục `src/`
Dọn dẹp các file mặc định của Vite (như HelloWorld.vue) và tự tạo cấu trúc sau:
```text
frontend/src/
├── assets/
│   └── style.css          # Nơi bạn viết CSS toàn cục
├── components/
│   ├── ProgressBar.vue    # Component hiển thị thanh tiến độ (nhận props %)
│   ├── TaskItem.vue       # Component hiển thị 1 công việc kèm checkbox
│   └── CalendarView.vue   # Dùng để chọn ngày
├── services/
│   └── api.js             # File chứa logic cấu hình Axios gọi đến http://localhost:3000
├── App.vue                # Khung sườn chính của toàn bộ UI
└── main.js                # File mount Vue instance
```

## Bước 3: Định hình logic cốt lõi cho Progress Bar
Một ví dụ về cách tách component để UI có thể tự động nhảy mượt mà khi % thay đổi.

### File: `components/ProgressBar.vue`
```html
<template>
  <div class="progress-wrapper">
    <!-- Độ dài thanh màu xanh sẽ tự bind theo biến progress truyền từ ngoài vào -->
    <div class="progress-fill" :style="{ width: progress + '%' }">
      {{ progress }}%
    </div>
  </div>
</template>

<script>
export default {
  props: {
    progress: {
      type: Number,
      required: true,
      default: 0
    }
  }
}
</script>

<style scoped>
.progress-wrapper {
  width: 100%;
  background-color: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  background-color: #3b82f6; /* Màu xanh nổi bật */
  color: white;
  text-align: center;
  font-weight: bold;
  padding: 4px 0;
  transition: width 0.4s ease-in-out; /* Đây là CSS giúp thanh tiến độ nhảy mượt */
}
</style>
```
