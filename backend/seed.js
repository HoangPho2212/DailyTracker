require('dotenv').config();
const mongoose = require('mongoose');
const Day = require('./models/Day');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dailytracker';

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const seedMockData = async () => {
  try {
    console.log(`Connecting to MongoDB for seeding: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    await Day.syncIndexes();

    console.log('Clearing existing Day records...');
    await Day.deleteMany({});

    const today = new Date();
    // Monday of current week
    const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const currentMon = new Date(today);
    currentMon.setDate(today.getDate() - currentDayOfWeek);

    // Monday of previous week
    const prevMon = new Date(currentMon);
    prevMon.setDate(currentMon.getDate() - 7);

    const mockDays = [];

    // ==========================================
    // 1. PREVIOUS WEEK (Mon - Sun): ~50% completion
    // ==========================================
    const prevWeekTaskTemplates = [
      // Monday
      [
        { title: 'Chạy bộ 20 phút', isCompleted: true },
        { title: 'Đọc tài liệu MongoDB', isCompleted: false },
        { title: 'Uống 2L nước', isCompleted: true },
        { title: 'Đi ngủ trước 23h', isCompleted: false }
      ], // 2/4 = 50%
      // Tuesday
      [
        { title: 'Luyện nghe tiếng Anh', isCompleted: true },
        { title: 'Dọn dẹp phòng', isCompleted: false },
        { title: 'Tập chống đẩy 30 cái', isCompleted: true },
        { title: 'Ghi chép chi tiêu', isCompleted: false }
      ], // 2/4 = 50%
      // Wednesday
      [
        { title: 'Học cú pháp Vue 3 Composition', isCompleted: true },
        { title: 'Chạy bộ 3km', isCompleted: false },
        { title: 'Ăn nhiều rau xanh', isCompleted: true },
        { title: 'Hạn chế dùng mạng xã hội', isCompleted: false }
      ], // 2/4 = 50%
      // Thursday
      [
        { title: 'Ôn tập thuật toán LeetCode', isCompleted: true },
        { title: 'Thiền 10 phút', isCompleted: false },
        { title: 'Uống đủ nước', isCompleted: true },
        { title: 'Đọc 15 trang sách', isCompleted: false }
      ], // 2/4 = 50%
      // Friday
      [
        { title: 'Review code tuần', isCompleted: true },
        { title: 'Tập thể dục 30 phút', isCompleted: true },
        { title: 'Lên kế hoạch cuối tuần', isCompleted: false },
        { title: 'Học từ vựng IELTS', isCompleted: false }
      ], // 2/4 = 50%
      // Saturday
      [
        { title: 'Đi chợ mua thực phẩm tươi', isCompleted: true },
        { title: 'Dọn dẹp nhà cửa', isCompleted: true },
        { title: 'Đạp xe ngoài trời', isCompleted: false },
        { title: 'Xem phim thư giãn', isCompleted: true }
      ], // 3/4 = 75%
      // Sunday
      [
        { title: 'Chuẩn bị kế hoạch tuần mới', isCompleted: true },
        { title: 'Giặt ủi quần áo', isCompleted: false },
        { title: 'Đọc sách phát triển bản thân', isCompleted: false },
        { title: 'Đi ngủ sớm', isCompleted: false }
      ] // 1/4 = 25%
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(prevMon);
      d.setDate(prevMon.getDate() + i);
      mockDays.push({
        date: formatDate(d),
        tasks: prevWeekTaskTemplates[i]
      });
    }

    // ==========================================
    // 2. CURRENT WEEK (Mon - Sun): ~75-80% completion (Better than last week!)
    // ==========================================
    const currentWeekTaskTemplates = [
      // Monday
      [
        { title: 'Chạy bộ khởi đầu tuần mới', isCompleted: true },
        { title: 'Đọc 20 trang sách kỹ thuật', isCompleted: true },
        { title: 'Viết unit tests cho Backend', isCompleted: true },
        { title: 'Ngủ trước 23h30', isCompleted: true }
      ], // 4/4 = 100%
      // Tuesday (Today - exactly 3/4 = 75% done!)
      [
        { title: 'Chạy bộ buổi sáng 30 phút', isCompleted: true },
        { title: 'Đọc 20 trang sách lập trình', isCompleted: true },
        { title: 'Hoàn thành Daily Tracker dashboard', isCompleted: true },
        { title: 'Thiền 15 phút trước khi ngủ', isCompleted: false }
      ], // 3/4 = 75%
      // Wednesday
      [
        { title: 'Luyện nói tiếng Anh 30 phút', isCompleted: true },
        { title: 'Review pull request', isCompleted: true },
        { title: 'Uống 2.5L nước', isCompleted: true },
        { title: 'Không ăn đồ ngọt sau 20h', isCompleted: false }
      ], // 3/4 = 75%
      // Thursday
      [
        { title: 'Tập gym ngực và vai', isCompleted: true },
        { title: 'Viết bài chia sẻ kỹ thuật', isCompleted: false },
        { title: 'Học Vue 3 component testing', isCompleted: true },
        { title: 'Đi dạo thư giãn 20 phút', isCompleted: true }
      ], // 3/4 = 75%
      // Friday
      [
        { title: 'Tổng kết công việc tuần', isCompleted: true },
        { title: 'Dọn dẹp workspace', isCompleted: true },
        { title: 'Nấu ăn tối tại nhà', isCompleted: true },
        { title: 'Đọc sách tài chính cá nhân', isCompleted: true }
      ], // 4/4 = 100%
      // Saturday
      [
        { title: 'Chạy bộ công viên', isCompleted: true },
        { title: 'Gặp gỡ bạn bè', isCompleted: true },
        { title: 'Học công nghệ mới 1 giờ', isCompleted: false },
        { title: 'Nghe podcast công nghệ', isCompleted: true }
      ], // 3/4 = 75%
      // Sunday
      [
        { title: 'Đánh giá tiến độ tuần (Review Dashboard)', isCompleted: true },
        { title: 'Lên mục tiêu tuần kế tiếp', isCompleted: true },
        { title: 'Nghỉ ngơi và thư giãn', isCompleted: true },
        { title: 'Đi ngủ sớm nạp năng lượng', isCompleted: false }
      ] // 3/4 = 75%
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMon);
      d.setDate(currentMon.getDate() + i);
      mockDays.push({
        date: formatDate(d),
        tasks: currentWeekTaskTemplates[i]
      });
    }

    console.log(`Inserting ${mockDays.length} seeded days into MongoDB...`);
    await Day.insertMany(mockDays);

    console.log('✅ Mock data seeded successfully!');
    console.log(`- Tuần trước: ${mockDays[0].date} đến ${mockDays[6].date} (~50% hoàn thành)`);
    console.log(`- Tuần này:   ${mockDays[7].date} đến ${mockDays[13].date} (~75-80% hoàn thành)`);
    console.log(`- Ngày hôm nay (${formatDate(today)}): đúng 75% (3/4 việc hoàn thành)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedMockData();
}

module.exports = seedMockData;
