require('dotenv').config();
const { app } = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to Database and start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✅ Backend server đang chạy tại http://localhost:${PORT}`);
  });
};

startServer();
