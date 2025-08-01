// Quick test to check user confirmation status
import { Pool } from 'pg';

// Use the same DATABASE_URL from .env
const DATABASE_URL = "postgresql://streamply_user:streamply_dev_2024@localhost:5432/streamply_dev?schema=public";

const client = new Pool({
  connectionString: DATABASE_URL
});

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status...');
    const result = await client.query(
      'SELECT username, email, confirmed, account_type FROM users WHERE username = $1',
      ['Vanity']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log('  Username:', user.username);
      console.log('  Email:', user.email);
      console.log('  Confirmed:', user.confirmed, '(Type:', typeof user.confirmed, ')');
      console.log('  Account Type:', user.account_type);
      console.log('  Boolean conversion:', Boolean(user.confirmed));
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserStatus();
