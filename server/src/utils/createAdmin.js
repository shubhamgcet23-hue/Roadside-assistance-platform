
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;
  const phone = process.env.ADMIN_PHONE;

  if (!email || !password || !name || !phone) {
    throw new Error(
      'Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, and ADMIN_PHONE first.'
    );
  }

  await connectDB();

  const existing = await User.findOne({ email });

  if (existing) {
    throw new Error(
      'That email already exists. No user was modified.'
    );
  }

  await User.create({
    name,
    email,
    password,
    phone,
    role: 'ADMIN',
  });

  console.log(`Admin account created successfully: ${email}`);
}

main()
  .catch((error) => {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
