import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaultProducts } from './models/Product.js';
import { initSocketServer } from './services/socketService.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocketServer(server);

// Connect to MongoDB before accepting requests
connectDB().then(async () => {
  await seedDefaultProducts();
  server.listen(PORT, () => {
    console.log(`[DealPilot Server]: Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});