import express from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getCompanies,
  createCompany,
  createCompanyUser,
  getCompanyAnalytics,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.post('/companies/:companyId/users', createCompanyUser);
router.get('/companies/:companyId/analytics', getCompanyAnalytics);

export default router;
