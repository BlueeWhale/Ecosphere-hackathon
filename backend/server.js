import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let aiServiceStatus = 'unreachable';
  
  try {
    const aiRes = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 });
    if (aiRes.status === 200) {
      aiServiceStatus = 'connected';
    }
  } catch (error) {
    aiServiceStatus = `error: ${error.message}`;
  }

  res.json({
    service: 'DealPilot Core Backend API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiServiceStatus
  });
});

app.listen(PORT, () => {
  console.log(`✅ Core Backend running at http://localhost:${PORT}`);
});