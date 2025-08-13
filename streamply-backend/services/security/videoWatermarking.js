// services/security/videoWatermarking.js
// Dynamic video watermarking for anti-piracy protection

import crypto from 'crypto';
import { logSecurityEvent } from './mongoLogger.js';

/**
 * Generate user-specific watermark data
 */
export function generateWatermarkData(userId, username, videoId, sessionId) {
  const timestamp = Date.now();
  const watermarkId = crypto.randomUUID();
  
  return {
    watermarkId,
    userId,
    username: username.substring(0, 8), // Truncate for display
    videoId,
    sessionId,
    timestamp,
    displayText: `${username.substring(0, 8)} • ${new Date().toISOString().split('T')[0]}`,
    hash: crypto.createHash('md5').update(`${userId}:${videoId}:${timestamp}`).digest('hex').substring(0, 8)
  };
}

/**
 * Generate watermark positioning rules
 */
export function generateWatermarkPosition(watermarkData) {
  // Use hash to determine semi-random but consistent positioning
  const hash = parseInt(watermarkData.hash, 16);
  
  const positions = [
    { top: '10%', left: '10%', opacity: 0.6 }, // Increased from 0.3
    { top: '10%', right: '10%', opacity: 0.6 }, // Increased from 0.3
    { bottom: '10%', left: '10%', opacity: 0.6 }, // Increased from 0.3
    { bottom: '10%', right: '10%', opacity: 0.6 }, // Increased from 0.3
    { top: '50%', left: '50%', opacity: 0.4, transform: 'translate(-50%, -50%)' } // Increased from 0.2
  ];
  
  const positionIndex = hash % positions.length;
  return positions[positionIndex];
}

/**
 * Create watermark configuration for frontend
 */
export function createWatermarkConfig(userId, username, videoId, sessionId, options = {}) {
  const watermarkData = generateWatermarkData(userId, username, videoId, sessionId);
  const position = generateWatermarkPosition(watermarkData);
  
  return {
    enabled: true,
    watermarkId: watermarkData.watermarkId,
    text: watermarkData.displayText,
    style: {
      ...position,
      fontSize: options.fontSize || '12px', // Smaller font
      color: options.color || 'rgba(255, 255, 255, 0.25)', // Much more subtle
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal', // Less bold
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', // Softer shadow
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 1000,
      position: 'absolute'
    },
    rotation: (parseInt(watermarkData.hash, 16) % 360) - 180, // -180 to 180 degrees
    updateInterval: options.updateInterval || 15000, // Update every 15 seconds instead of 30
    fadeTransition: options.fadeTransition || 1000 // 1 second fade instead of 2
  };
}

/**
 * Advanced forensic watermarking data
 */
export function generateForensicWatermark(userId, videoId, deviceFingerprint) {
  const forensicData = {
    userId,
    videoId,
    deviceFingerprint,
    timestamp: Date.now(),
    sessionSecret: crypto.randomBytes(16).toString('hex')
  };
  
  // Create invisible forensic marker
  const forensicHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(forensicData))
    .digest('hex');
    
  return {
    forensicId: forensicHash.substring(0, 16),
    invisibleMarker: Buffer.from(JSON.stringify(forensicData)).toString('base64'),
    pixelData: generateSteganographicData(forensicHash)
  };
}

/**
 * Generate steganographic data for embedding in video
 */
function generateSteganographicData(hash) {
  // Convert hash to binary pattern for embedding in video pixels
  const binaryData = hash.split('').map(char => 
    parseInt(char, 16).toString(2).padStart(4, '0')
  ).join('');
  
  return {
    pattern: binaryData,
    embedPoints: generateEmbedPoints(binaryData.length),
    checksum: crypto.createHash('md5').update(binaryData).digest('hex')
  };
}

/**
 * Generate pseudo-random embed points for steganography
 */
function generateEmbedPoints(dataLength) {
  const points = [];
  for (let i = 0; i < dataLength; i++) {
    points.push({
      x: Math.floor(Math.random() * 1920), // Assume max 1920 width
      y: Math.floor(Math.random() * 1080), // Assume max 1080 height
      frame: Math.floor(Math.random() * 1000) + i * 10 // Spread across frames
    });
  }
  return points;
}

/**
 * Log watermark generation for forensics
 */
export async function logWatermarkGeneration(watermarkConfig, forensicData, req) {
  try {
    await logSecurityEvent({
      type: 'watermark_generated',
      watermarkId: watermarkConfig.watermarkId,
      forensicId: forensicData.forensicId,
      userId: req.user?.id,
      username: req.user?.username,
      videoId: req.params.videoId || req.body.videoId,
      deviceFingerprint: req.deviceFingerprint,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging watermark generation:', error);
  }
}

/**
 * Detect watermark tampering attempts
 */
export function detectWatermarkTampering(originalConfig, receivedData) {
  const tamperingIndicators = [];
  
  if (!receivedData.watermarkId || receivedData.watermarkId !== originalConfig.watermarkId) {
    tamperingIndicators.push('watermark_id_mismatch');
  }
  
  if (receivedData.requestedDisable) {
    tamperingIndicators.push('disable_attempt');
  }
  
  if (receivedData.styleModifications) {
    tamperingIndicators.push('style_modification');
  }
  
  return {
    tampered: tamperingIndicators.length > 0,
    indicators: tamperingIndicators,
    riskLevel: tamperingIndicators.length > 2 ? 'high' : tamperingIndicators.length > 0 ? 'medium' : 'low'
  };
}
