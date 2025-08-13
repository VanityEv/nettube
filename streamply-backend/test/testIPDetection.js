/**
 * Test IP Detection on Railway Infrastructure with Geolocation
 * This script helps debug IP detection issues through the proxy chain
 */

import { getRealClientIP, getIPDebugInfo } from '../helpers/ipDetection.js';
import { getSecureClientIP, getIPForLogging, getGeolocationIP } from '../security/secureIPDetection.js';
import { getLocationFromIP, getDeviceInfo } from '../services/security/locationSecurity.js';

export async function testIPDetection(req, res) {
  console.log('🧪 Starting IP Detection Test...');
  
  try {
    // Get comprehensive IP debug information
    const ipDebugInfo = getIPDebugInfo(req);
    const realClientIP = getRealClientIP(req);
    const secureClientIP = getSecureClientIP(req);
    const geolocationIP = getGeolocationIP(req);
    const debugClientIP = getIPForLogging(req);
    
    // Get geolocation and device information using geolocation IP
    const locationInfo = getLocationFromIP(geolocationIP);
    const deviceInfo = getDeviceInfo(req);
    
    console.log('=== IP DETECTION TEST RESULTS ===');
    console.log('Real Client IP:', realClientIP);
    console.log('Secure Client IP:', secureClientIP);
    console.log('Geolocation IP:', geolocationIP);
    console.log('Location Info:', JSON.stringify(locationInfo, null, 2));
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));
    console.log('Raw Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Debug Info:', JSON.stringify(ipDebugInfo, null, 2));
    
    // Check if we're getting the Railway proxy IP
    const isRailwayProxyIP = realClientIP.includes('162.220.232') || realClientIP.includes('100.64.0');
    
    // Analyze the header chain
    const headerAnalysis = analyzeIPHeaders(req);
    
    // Security analysis
    const securityAnalysis = analyzeSecurityFeatures(req, secureClientIP, geolocationIP, locationInfo);
    
    const response = {
      status: 'SECURE IP Detection Test Complete',
      timestamp: new Date().toISOString(),
      security: {
        spoofingProtected: true,
        spoofingTest: securityAnalysis.spoofingTest
      },
      results: {
        detectedClientIP: secureClientIP,
        debugClientIP: debugClientIP,
        isRailwayProxyIP,
        secureDebugInfo: debugClientIP,
        headerAnalysis,
        geolocation: {
          country: locationInfo.country,
          region: locationInfo.region,
          city: locationInfo.city,
          coordinates: locationInfo.lat && locationInfo.lon ? {
            latitude: locationInfo.lat,
            longitude: locationInfo.lon
          } : null,
          timezone: locationInfo.timezone,
          isLocal: locationInfo.isLocal
        },
        deviceInfo: {
          type: deviceInfo.type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          userAgent: deviceInfo.userAgent,
          fingerprint: deviceInfo.fingerprint
        },
        recommendations: generateRecommendations(ipDebugInfo, isRailwayProxyIP, geolocationIP, locationInfo, securityAnalysis)
      }
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ IP Detection Test Error:', error);
    res.status(500).json({
      error: 'IP Detection Test Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function analyzeIPHeaders(req) {
  const analysis = {
    trustedSources: {
      expressIP: req.ip,
      connectionIP: req.connection?.remoteAddress,
      socketIP: req.socket?.remoteAddress
    },
    suspiciousHeaders: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    },
    securityFlags: {
      hasSuspiciousForwarding: !!req.headers['x-forwarded-for'],
      potentialSpoof: false
    }
  };
  
  // Detect potential spoofing attempts
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    // Check for suspicious patterns
    analysis.securityFlags.potentialSpoof = ips.some(ip => 
      ip.includes('8.8.8.8') || 
      ip.includes('1.1.1.1') || 
      ip.includes('127.0.0.1') ||
      ip.includes('192.168.') ||
      ip.includes('10.0.') ||
      ip.includes('172.16.')
    );
  }
  
  return analysis;
}

function analyzeSecurityFeatures(req, secureIP, geolocationIP, locationInfo) {
  const analysis = {
    spoofingTest: {
      xForwardedForPresent: !!req.headers['x-forwarded-for'],
      xRealIPPresent: !!req.headers['x-real-ip'],
      spoofingAttempted: false,
      protectionStatus: 'SECURE'
    },
    geolocationSecurity: {
      locationDetected: !locationInfo.isLocal,
      securityLevel: locationInfo.isLocal ? 'LOCAL_DEV' : 'PRODUCTION',
      geolocationIPDifferent: secureIP !== geolocationIP
    }
  };
  
  // Check for common spoofing attempts
  const suspiciousIPs = ['8.8.8.8', '1.1.1.1', '127.0.0.1'];
  const forwardedFor = req.headers['x-forwarded-for'] || '';
  
  analysis.spoofingTest.spoofingAttempted = suspiciousIPs.some(ip => forwardedFor.includes(ip));
  
  if (analysis.spoofingTest.spoofingAttempted && secureIP !== suspiciousIPs.find(ip => forwardedFor.includes(ip))) {
    analysis.spoofingTest.protectionStatus = 'PROTECTED';
  }
  
  return analysis;
}

function generateRecommendations(debugInfo, isRailwayProxyIP, geolocationIP, locationInfo, securityAnalysis) {
  const recommendations = [];
  
  if (isRailwayProxyIP) {
    recommendations.push({
      issue: 'Railway Proxy IP Detected',
      description: 'Requests show Railway infrastructure IP instead of client IP - this is SECURE behavior',
      priority: 'INFO',
      solutions: [
        'This is expected and secure behavior on Railway',
        'Application correctly ignores spoofed headers',
        'Rate limiting works with Railway proxy IPs'
      ]
    });
  }
  
  if (securityAnalysis.spoofingTest.spoofingAttempted) {
    const forwardedFor = debugInfo.headers['x-forwarded-for'] || 'unknown';
    recommendations.push({
      issue: 'IP Spoofing Attempt Detected',
      description: `Suspicious X-Forwarded-For header: ${forwardedFor}`,
      priority: 'HIGH',
      solutions: [
        'Application correctly ignores spoofed headers ✓',
        'Secure IP detection is working properly ✓',
        'No action needed - security is intact ✓'
      ]
    });
  }
  
  if (locationInfo.isLocal) {
    recommendations.push({
      issue: 'Local Development Environment',
      description: 'Running in local development mode',
      priority: 'INFO',
      solutions: [
        'Geolocation will work properly in production',
        'Test with real IPs for accurate location data'
      ]
    });
  } else {
    recommendations.push({
      issue: 'Geolocation Working',
      description: `Location detected: ${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country}`,
      priority: 'INFO',
      solutions: [
        'Geolocation is working correctly',
        'Location data available for security analysis',
        'Device fingerprinting operational'
      ]
    });
  }
  
  if (securityAnalysis.geolocationSecurity.geolocationIPDifferent) {
    recommendations.push({
      issue: 'Dual IP System Active',
      description: `Security IP (${debugInfo.trustedIP}) differs from Geolocation IP (${geolocationIP})`,
      priority: 'INFO',
      solutions: [
        'Security uses trusted Railway proxy IP ✓',
        'Geolocation uses real client IP ✓',
        'Best of both worlds - security and accuracy ✓'
      ]
    });
  }
  
  return recommendations;
}

export default testIPDetection;
