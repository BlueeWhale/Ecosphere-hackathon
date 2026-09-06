import { User } from '../models/User.js';
import { Deal } from '../models/Deal.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Conversation } from '../models/Conversation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Company } from '../models/Company.js';

const companySlug = (name) => String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({}).sort({ createdAt: -1 }).lean();
  const counts = await User.aggregate([{ $match: { tenantId: { $ne: null } } }, { $group: { _id: '$tenantId', users: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((item) => [item._id.toString(), item.users]));
  res.json({ success: true, count: companies.length, data: companies.map((company) => ({ ...company, users: countMap.get(company._id.toString()) || 0 })) });
});

export const createCompany = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) { res.status(400); throw new Error('Company name is required'); }
  const company = await Company.create({ name: name.trim(), slug: companySlug(name) });
  res.status(201).json({ success: true, data: company });
});

export const createCompanyUser = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error('Name, email, and password are required'); }
  const company = await Company.findById(companyId);
  if (!company) { res.status(404); throw new Error('Company not found'); }
  const user = await User.create({ name, email: email.toLowerCase().trim(), password, role: 'user', tenantId: company._id });
  res.status(201).json({ success: true, data: user.toSafeObject() });
});

export const getCompanyAnalytics = asyncHandler(async (req, res) => {
  const companyId = req.params.companyId;
  const [users, deals, customers, conversations] = await Promise.all([
    User.countDocuments({ tenantId: companyId }), Deal.countDocuments({ tenantId: companyId }),
    Customer.countDocuments({ tenantId: companyId }), Conversation.countDocuments({ tenantId: companyId }),
  ]);
  res.json({ success: true, data: { companyId, users, deals, customers, conversations } });
});

export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCustomers,
    totalLeads,
    totalDeals,
    activeDeals,
    conversations,
  ] = await Promise.all([
    User.countDocuments({}),
    Customer.countDocuments({}),
    Lead.countDocuments({}),
    Deal.countDocuments({}),
    Deal.countDocuments({
      $or: [{ status: { $ne: 'lost' } }, { currentStage: { $ne: 'CLOSED_LOST' } }],
    }),
    Conversation.countDocuments({}),
  ]);

  const pipelineValue = await Deal.aggregate([
    {
      $match: {
        $or: [{ status: { $ne: 'lost' } }, { currentStage: { $ne: 'CLOSED_LOST' } }],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$pricingContext.quotedAmount', 0] } },
      },
    },
  ]);

  const admins = await User.countDocuments({ role: 'admin' });
  const regularUsers = await User.countDocuments({ role: 'user' });

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        admins,
        users: regularUsers,
      },
      customers: totalCustomers,
      leads: totalLeads,
      deals: {
        total: totalDeals,
        active: activeDeals,
      },
      conversations,
      pipelineValue: pipelineValue[0]?.total || 0,
      systemActivity: {
        lastUserSignup: (await User.findOne().sort({ createdAt: -1 }).select('createdAt name email')) || null,
        lastDealUpdate: (await Deal.findOne().sort({ updatedAt: -1 }).select('updatedAt company')) || null,
      },
    },
  });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .select('-password -__v');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!['user', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be "user" or "admin".');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select('-password -__v');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
