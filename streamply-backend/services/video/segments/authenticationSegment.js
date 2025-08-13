// SEGMENT 1: Authentication & User Validation
// Handles user authentication, JWT verification, and user data fetching

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function authenticateStreamingUser(req, res) {
  try {
    // Get user ID from username (since JWT only contains username)
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: req.user.username,
          mode: 'insensitive'
        }
      },
      select: { id: true, username: true, account_type: true }
    });
    
    if (!user) {
      return {
        success: false,
        status: 401,
        error: 'User not found'
      };
    }
    
    // Add user ID to req.user for use in streaming functions
    req.user.id = user.id;
    
    // User authenticated for streaming - no spam logging
    
    return {
      success: true,
      user: user
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      status: 500,
      error: 'Authentication failed'
    };
  }
}
