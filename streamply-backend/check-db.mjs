import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Try to query the users table (we know this exists)
    const userCount = await prisma.user.count();
    console.log('✅ Users table accessible, count:', userCount);
    
    // Try to check if trusted_devices table exists
    try {
      const trustedDeviceCount = await prisma.trustedDevice.count();
      console.log('✅ Trusted devices table exists, count:', trustedDeviceCount);
    } catch (error) {
      console.log('❌ Trusted devices table error:', error.message);
      if (error.code === 'P2021') {
        console.log('⚠️ The trusted_devices table does not exist in the database.');
        console.log('Need to run database migration or table creation.');
      }
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
