import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';

const users = [
  {
    name: 'DealPilot Admin',
    email: 'admin@dealpilot.ai',
    password: 'Admin@2026Secure!',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'DealPilot Company User',
    email: 'company@dealpilot.ai',
    password: 'Company@2026Secure!',
    role: 'user',
    isActive: true,
  },
];

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  for (const data of users) {
    let user = await User.findOne({ email: data.email });

    if (user) {
      user.name = data.name;
      user.password = data.password;
      user.role = data.role;
      user.isActive = true;
      await user.save();

      console.log(`Updated: ${data.email}`);
    } else {
      await User.create(data);
      console.log(`Created: ${data.email}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}