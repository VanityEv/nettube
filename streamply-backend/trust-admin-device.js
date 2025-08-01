// Mark admin device as trusted to avoid security verification
import { Pool } from 'pg';
import crypto from 'crypto';

const DATABASE_URL = "postgresql://streamply_user:streamply_dev_2024@localhost:5432/streamply_dev?schema=public";

const client = new Pool({
  connectionString: DATABASE_URL
});

async function trustAdminDevice() {
  try {
    console.log('🔧 Marking admin device as trusted...');
    
    // Get admin user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['Vanity']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    
    // Generate a device fingerprint for the admin's device
    const deviceFingerprint = crypto.createHash('sha256')
      .update('admin-localhost-chrome-trusted')
      .digest('hex');
    
    // Insert or update trusted device record
    await client.query(`
      INSERT INTO trusted_devices (
        user_id, 
        device_fingerprint, 
        device_info, 
        location_info, 
        ip_address, 
        first_seen, 
        last_used, 
        is_trusted
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true)
      ON CONFLICT (user_id, device_fingerprint) 
      DO UPDATE SET 
        last_used = NOW(), 
        is_trusted = true
    `, [
      userId,
      deviceFingerprint,
      JSON.stringify({
        userAgent: 'Admin Development Device',
        platform: 'localhost',
        language: 'en-US'
      }),
      JSON.stringify({
        country: 'Local',
        region: 'Development',
        city: 'Localhost',
        isLocal: true
      }),
      '127.0.0.1'
    ]);
    
    console.log('✅ Admin device marked as trusted');
    console.log('   Device fingerprint:', deviceFingerprint);
    console.log('   User ID:', userId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

trustAdminDevice();
