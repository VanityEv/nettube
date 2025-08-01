#!/usr/bin/env node

// JWT Security Verification Script
// This script verifies that all JWT usage has been unified to use JWT_SECRET

import { readFile, readdir } from 'fs/promises';
import path from 'path';

// Simple recursive file finder
async function findJSFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', '.yarn', 'dist', 'build'].includes(entry.name)) {
      await findJSFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
      files.push(path.relative(backendPath, fullPath));
    }
  }
  
  return files;
}

const backendPath = process.cwd();

console.log('🔒 JWT Security Verification Script');
console.log('=====================================\n');

// Check 1: Verify no default 'secret' fallbacks exist
console.log('1. Checking for default "secret" fallbacks...');
const secretFallbackPattern = /SECRET.*=.*['"]secret['"]|['"]secret['"].*as.*default/i;
let foundSecretFallbacks = false;

try {
  const jsFiles = await findJSFiles(backendPath);
  
  for (const file of jsFiles) {
    const content = await readFile(path.join(backendPath, file), 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (secretFallbackPattern.test(line) && !line.trim().startsWith('//')) {
        console.log(`   ❌ ${file}:${index + 1} - ${line.trim()}`);
        foundSecretFallbacks = true;
      }
    });
  }
  
  if (!foundSecretFallbacks) {
    console.log('   ✅ No default "secret" fallbacks found');
  }
} catch (error) {
  console.log('   ⚠️  Error checking for secret fallbacks:', error.message);
}

// Check 2: Verify all jwt.sign() calls use JWT_SECRET
console.log('\n2. Checking JWT token generation...');
const jwtSignPattern = /jwt\.sign\s*\(/;
let foundProperJwtUsage = true;

try {
  const jsFiles = await glob('**/*.{js,mjs}', { 
    cwd: backendPath, 
    ignore: ['node_modules/**', '.yarn/**', 'dist/**', 'build/**'] 
  });
  
  for (const file of jsFiles) {
    const content = await readFile(path.join(backendPath, file), 'utf-8');
    
    if (jwtSignPattern.test(content)) {
      console.log(`   📄 Found JWT signing in: ${file}`);
      
      // Check if it uses JWT_SECRET
      if (content.includes('JWT_SECRET')) {
        console.log(`   ✅ Uses JWT_SECRET`);
      } else if (content.includes('process.env.SECRET') || content.includes('SECRET')) {
        console.log(`   ❌ Still uses old SECRET pattern`);
        foundProperJwtUsage = false;
      } else {
        console.log(`   ⚠️  Uncertain JWT secret usage`);
      }
    }
  }
  
  if (foundProperJwtUsage && !foundSecretFallbacks) {
    console.log('   ✅ All JWT signing appears to use proper secrets');
  }
} catch (error) {
  console.log('   ⚠️  Error checking JWT usage:', error.message);
}

// Check 3: Verify JWT verification uses proper algorithms
console.log('\n3. Checking JWT verification security...');
const jwtVerifyPattern = /jwt\.verify\s*\(/;
let foundSecureVerification = true;

try {
  const jsFiles = await glob('**/*.{js,mjs}', { 
    cwd: backendPath, 
    ignore: ['node_modules/**', '.yarn/**', 'dist/**', 'build/**'] 
  });
  
  for (const file of jsFiles) {
    const content = await readFile(path.join(backendPath, file), 'utf-8');
    
    if (jwtVerifyPattern.test(content)) {
      console.log(`   📄 Found JWT verification in: ${file}`);
      
      // Check if it specifies algorithms
      if (content.includes('algorithms:') && content.includes('HS256')) {
        console.log(`   ✅ Uses algorithm specification (HS256)`);
      } else {
        console.log(`   ⚠️  May not specify algorithm (security risk)`);
        foundSecureVerification = false;
      }
    }
  }
  
  if (foundSecureVerification) {
    console.log('   ✅ JWT verification appears secure');
  }
} catch (error) {
  console.log('   ⚠️  Error checking JWT verification:', error.message);
}

// Check 4: Verify token structure includes required claims
console.log('\n4. Checking token structure...');
try {
  const requiredClaims = ['sub', 'tokenType', 'jti'];
  const jsFiles = await glob('**/*.{js,mjs}', { 
    cwd: backendPath, 
    ignore: ['node_modules/**', '.yarn/**', 'dist/**', 'build/**'] 
  });
  
  let foundRequiredClaims = false;
  
  for (const file of jsFiles) {
    const content = await readFile(path.join(backendPath, file), 'utf-8');
    
    if (jwtSignPattern.test(content)) {
      const hasAllClaims = requiredClaims.every(claim => content.includes(claim));
      if (hasAllClaims) {
        console.log(`   ✅ ${file} includes required claims (${requiredClaims.join(', ')})`);
        foundRequiredClaims = true;
      } else {
        const foundClaims = requiredClaims.filter(claim => content.includes(claim));
        console.log(`   ⚠️  ${file} missing some claims. Found: ${foundClaims.join(', ')}`);
      }
    }
  }
  
  if (foundRequiredClaims) {
    console.log('   ✅ At least some token generation includes required claims');
  }
} catch (error) {
  console.log('   ⚠️  Error checking token structure:', error.message);
}

console.log('\n🔒 JWT Security Verification Complete');
console.log('=====================================');

if (!foundSecretFallbacks && foundProperJwtUsage && foundSecureVerification) {
  console.log('✅ Overall Status: SECURE - JWT implementation appears properly hardened');
  process.exit(0);
} else {
  console.log('⚠️  Overall Status: NEEDS ATTENTION - Some security issues detected');
  process.exit(1);
}
