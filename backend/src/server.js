import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB before accepting requests
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[DealPilot Server]: Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});