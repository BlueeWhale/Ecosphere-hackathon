import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// DEMO MODE ONLY — authentication bypass cached demo user
let cachedDemoUser = null;

// Verify JWT token from HTTP-only cookie or Authorization Header
export const protect = asyncHandler(async (req, res, next) => {
  // DEMO MODE ONLY — authentication bypass enabled for hackathon demo
  if (process.env.DEMO_MODE === 'true') {
    if (!cachedDemoUser) {
      cachedDemoUser = await User.findOne({ email: 'demo@dealpilot.ai' });
      if (!cachedDemoUser) {
        cachedDemoUser = await User.create({
          name: 'DealPilot Demo User',
          email: 'demo@dealpilot.ai',
          password: 'DemoPassword123!',
          role: 'admin',
          isActive: true,
        });
      }
    }
    req.user = cachedDemoUser;
    return next();
  }

  let token;

  // 1. Check HTTP-only Cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } 
  // 2. Check Authorization Header fallback (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  if (!process.env.JWT_SECRET) {
    res.status(500);
    throw new Error('FATAL: JWT_SECRET environment variable is not configured.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('User not found / token invalid');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Contact admin.');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed or expired');
  }
});

// Role-based Access Control Authorization
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role '${req.user?.role}' is not authorized to access this route`);
    }
    next();
  };
};