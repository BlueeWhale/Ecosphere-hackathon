import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaultProducts } from './models/Product.js';
import { seedDefaultKnowledgeDocs } from './models/KnowledgeDocument.js';
import { initSocketServer } from './services/socketService.js';
import { User } from './models/User.js';
import { Company } from './models/Company.js';
import { Deal } from './models/Deal.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocketServer(server);

const seedAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || 'DealPilot Administrator';

  if (!adminEmail || !adminPassword) {
    console.log('[Admin Seed]: ADMIN_EMAIL / ADMIN_PASSWORD not set. Skipping admin user seeding.');
    return;
  }

  try {
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save({ validateBeforeSave: false });
        console.log(`[Admin Seed]: Promoted existing user "${adminEmail}" to admin role.`);
      } else {
        console.log(`[Admin Seed]: Admin user "${adminEmail}" already exists.`);
      }
      return;
    }

    const user = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });

    console.log(`[Admin Seed]: Created admin user "${user.email}" (role=${user.role}).`);
  } catch (err) {
    console.error('[Admin Seed]: Failed to seed admin user:', err.message);
  }
};

const seedCompanyUser = async () => {
  const email = process.env.COMPANY_EMAIL?.toLowerCase().trim();
  const password = process.env.COMPANY_PASSWORD;
  const name = process.env.COMPANY_USER_NAME?.trim() || 'DealPilot Company User';
  const companyName = process.env.COMPANY_NAME?.trim() || 'DealPilot Demo Company';

  if (!email || !password) {
    console.log('[Company Seed]: COMPANY_EMAIL / COMPANY_PASSWORD not set. Skipping company user seeding.');
    return;
  }

  try {
    let company = await Company.findOne({ slug: 'dealpilot-demo-company' });
    if (!company) company = await Company.create({ name: companyName, slug: 'dealpilot-demo-company' });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role !== 'admin' && !existingUser.tenantId) {
        existingUser.tenantId = company._id;
        await existingUser.save({ validateBeforeSave: false });
      }
      console.log(`[Company Seed]: Company user "${email}" already exists.`);
      return;
    }

    await User.create({ name, email, password, role: 'user', tenantId: company._id, isActive: true });
    console.log(`[Company Seed]: Created company user "${email}" for "${company.name}".`);
  } catch (err) {
    console.error('[Company Seed]: Failed to seed company user:', err.message);
  }
};

const seedCompanyDemoDeal = async () => {
  const user = await User.findOne({ email: process.env.COMPANY_EMAIL?.toLowerCase().trim() });
  if (!user?.tenantId) return;
  const existingDeal = await Deal.exists({ tenantId: user.tenantId });
  if (existingDeal) return;

  await Deal.create({
    user: user._id,
    tenantId: user.tenantId,
    company: process.env.COMPANY_NAME?.trim() || 'DealPilot Demo Company',
    customerName: 'Demo Prospect',
    customerEmail: 'prospect@example.com',
    product: 'ENTERPRISE',
    productInterest: 'Enterprise Suite',
    numberOfUsers: 50,
    currentStage: 'DISCOVERY',
    status: 'open',
  });
  console.log(`[Company Seed]: Created tenant-owned demo deal for "${user.email}".`);
};

// Connect to MongoDB before accepting requests
connectDB().then(async () => {
  await seedAdminUser();
  await seedCompanyUser();
  await seedCompanyDemoDeal();
  await seedDefaultProducts();
  await seedDefaultKnowledgeDocs();
  server.listen(PORT, () => {
    console.log(`[DealPilot Server]: Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});
