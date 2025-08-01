#!/usr/bin/env node

/**
 * Script to apply video statistics triggers to the StreamPly database
 * This script will create triggers for automatic updates of:
 * - reviews_count when reviews are added/updated/deleted
 * - average grade when reviews with grades are modified
 * - views count when videos are played (with spam prevention)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './services/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== StreamPly Database Triggers Setup ===\n');

async function applyTriggers() {
  try {
    console.log('📖 Reading trigger SQL file...');
    const sqlFile = path.join(__dirname, 'database-triggers-video-stats.sql');
    const triggerSQL = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('🔗 Connecting to database...');
    
    // Split the SQL into individual statements
    const statements = triggerSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute raw SQL through Prisma
        await prisma.$executeRawUnsafe(statement);
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Error in statement ${i + 1}:`, error.message);
        errorCount++;
        
        // Continue with other statements even if one fails
        if (error.message.includes('already exists')) {
          console.log('   (This is expected if triggers already exist)');
        }
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All database triggers installed successfully!');
    } else {
      console.log('\n⚠️  Some statements failed, but core functionality should work');
    }
    
    // Test the triggers
    console.log('\n🧪 Testing trigger functionality...');
    await testTriggers();
    
  } catch (error) {
    console.error('💥 Fatal error setting up triggers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testTriggers() {
  try {
    console.log('1. Testing recalculate_all_video_stats function...');
    
    // Test the recalculate function
    const result = await prisma.$queryRaw`SELECT recalculate_all_video_stats() as updated_count`;
    console.log(`   ✅ Recalculated stats for ${result[0]?.updated_count || 0} videos`);
    
    console.log('2. Testing increment_video_views function...');
    
    // Get a sample video ID
    const sampleVideo = await prisma.video.findFirst({
      select: { id: true, title: true, views: true }
    });
    
    if (sampleVideo) {
      console.log(`   📹 Testing with video: "${sampleVideo.title}"`);
      console.log(`   📊 Current views: ${sampleVideo.views || 0}`);
      
      // Test the view increment function
      const viewResult = await prisma.$queryRaw`
        SELECT increment_video_views(
          ${sampleVideo.id}::UUID, 
          NULL, 
          '127.0.0.1'::INET, 
          'Test User Agent'
        ) as incremented
      `;
      
      const wasIncremented = viewResult[0]?.incremented;
      console.log(`   ✅ View increment test: ${wasIncremented ? 'SUCCESS' : 'SKIPPED (recent view exists)'}`);
      
      // Check updated view count
      const updatedVideo = await prisma.video.findUnique({
        where: { id: sampleVideo.id },
        select: { views: true }
      });
      
      console.log(`   📊 Updated views: ${updatedVideo?.views || 0}`);
      
    } else {
      console.log('   ⚠️  No videos found to test with');
    }
    
    console.log('\n✅ Trigger tests completed!');
    
  } catch (error) {
    console.log('❌ Error testing triggers:', error.message);
  }
}

// Run the setup
applyTriggers().catch(console.error);
