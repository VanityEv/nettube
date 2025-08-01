import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
dotenv.config();

// DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { 
  SENDGRID_API_KEY, 
  SENDGRID_FROM_EMAIL, 
  SENDGRID_FROM_NAME = 'StreamPly',
  SENDGRID_TO_EMAIL, // For testing
  FRONTEND_URL = 'http://localhost:3000'
} = process.env;

// Log mail configuration status (without exposing credentials)
console.log('📧 SendGrid Mail Configuration:', {
  SENDGRID_API_KEY: SENDGRID_API_KEY ? '✅ Configured' : '❌ Missing',
  SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL ? '✅ Configured' : '❌ Missing',
  SENDGRID_FROM_NAME: SENDGRID_FROM_NAME ? '✅ Configured' : '❌ Missing'
});

// Configure SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid configured successfully');
} else {
  console.error('❌ SendGrid API key not found in environment variables');
}

// Validate configuration
const isConfigured = () => {
  return !!(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL);
};

// Test function to send a simple email
const sendTestEmail = async (to) => {
  if (!isConfigured()) {
    return { success: false, error: 'SendGrid not configured' };
  }

  const testEmail = to || SENDGRID_TO_EMAIL;
  if (!testEmail) {
    return { success: false, error: 'No test email address provided' };
  }

  const msg = {
    to: testEmail,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME
    },
    subject: '🎬 StreamPly Email Test - Working!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #007bff; margin: 0;">🎬 StreamPly</h2>
            <h3 style="color: #28a745; margin: 10px 0;">✅ Email System Test</h3>
          </div>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #155724; text-align: center;">
              <strong>🚀 Success! Your SendGrid email system is working perfectly!</strong>
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="color: #333; font-size: 16px; margin: 0;">
              This test email confirms that StreamPly can now send emails through SendGrid's reliable infrastructure.
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">📊 SendGrid Benefits:</h4>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li style="margin: 5px 0;">✅ 99.9% delivery rate</li>
              <li style="margin: 5px 0;">✅ Professional email infrastructure</li>
              <li style="margin: 5px 0;">✅ 40,000 free emails per month</li>
              <li style="margin: 5px 0;">✅ Email analytics and tracking</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Sent via SendGrid's reliable email infrastructure<br>
              Timestamp: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Test email sent successfully:', {
      to: testEmail,
      messageId: response[0]?.headers?.['x-message-id']
    });
    return { 
      success: true, 
      info: {
        messageId: response[0]?.headers?.['x-message-id'],
        statusCode: response[0]?.statusCode
      }
    };
  } catch (error) {
    console.error('❌ Test email failed:', error.response?.body || error.message);
    return { success: false, error: error.response?.body || error.message };
  }
};

const sendConfirmationEmail = async (email, registerToken) => {
  // Validate inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    console.error('sendConfirmationEmail: Invalid email address provided:', email);
    return { success: false, error: 'Invalid email address' };
  }
  
  if (!registerToken || typeof registerToken !== 'string') {
    console.error('sendConfirmationEmail: Invalid register token provided:', registerToken);
    return { success: false, error: 'Invalid register token' };
  }

  // Check if SendGrid is configured
  if (!isConfigured()) {
    console.error('sendConfirmationEmail: SendGrid not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const confirmationUrl = `${FRONTEND_URL}/confirm-register?token=${registerToken}`;

  const msg = {
    to: email.trim(),
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME
    },
    subject: '🎉 Welcome to StreamPly - Confirm Your Account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #007bff; margin: 0;">🎬 Welcome to StreamPly!</h2>
            <h3 style="color: #333; margin: 10px 0 0 0;">You're almost ready to start streaming</h3>
          </div>
         
          <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 5px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #1976d2; text-align: center;"><strong>🔐 Account Activation Required</strong></p>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              Thank you for joining StreamPly! To complete your registration and start enjoying unlimited streaming, please confirm your email address.
            </p>
            
            <a href="${confirmationUrl}" 
               style="display: inline-block; background: linear-gradient(45deg, #007bff, #0056b3); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 3px 10px rgba(0,123,255,0.3); transition: all 0.3s ease;">
              ✅ Confirm My Account
            </a>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">🚀 What's Next?</h4>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Browse thousands of movies and TV shows</li>
              <li style="margin: 5px 0;">Create your personalized watchlist</li>
              <li style="margin: 5px 0;">Enjoy high-quality streaming on any device</li>
              <li style="margin: 5px 0;">Rate and review your favorite content</li>
            </ul>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; text-align: center;"><strong>⏰ This link expires in 24 hours</strong></p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't create this account, please ignore this email.<br>
              Need help? Contact us at support@streamply.com
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              This email was sent via SendGrid's secure infrastructure.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    // Optional: Add tracking
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };
  
  try {
    const response = await sgMail.send(msg);
    console.log('✅ Confirmation email sent:', {
      to: email,
      messageId: response[0]?.headers?.['x-message-id']
    });
    return { 
      success: true, 
      info: {
        messageId: response[0]?.headers?.['x-message-id'],
        statusCode: response[0]?.statusCode
      }
    };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error.response?.body || error.message);
    return { success: false, error: error.response?.body || error.message };
  }
};

const sendPasswordResetMail = async (email, resetToken) => {
  // Validate inputs
  if (!email || typeof email !== 'string' || !email.trim()) {
    console.error('sendPasswordResetMail: Invalid email address provided:', email);
    return { success: false, error: 'Invalid email address' };
  }
  
  if (!resetToken || typeof resetToken !== 'string') {
    console.error('sendPasswordResetMail: Invalid reset token provided:', resetToken);
    return { success: false, error: 'Invalid reset token' };
  }

  // Check if SendGrid is configured
  if (!isConfigured()) {
    console.error('sendPasswordResetMail: SendGrid not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const msg = {
    to: email.trim(),
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME
    },
    subject: '🔒 Reset Your StreamPly Password',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ff6b6b; margin: 0;">🔒 Password Reset Request</h2>
            <h3 style="color: #007bff; margin: 10px 0;">StreamPly</h3>
          </div>
         
          <div style="background: #ffebee; border: 1px solid #ffcdd2; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #c62828; text-align: center;"><strong>🚨 Password Reset Requested</strong></p>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              We received a request to reset your StreamPly account password. If this was you, click the button below to set a new password.
            </p>
            
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(45deg, #ff6b6b, #d32f2f); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 3px 10px rgba(255,107,107,0.3); transition: all 0.3s ease;">
              🔑 Reset My Password
            </a>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; text-align: center;"><strong>⏰ This link expires in 30 minutes</strong></p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">🛡️ Security Tips:</h4>
            <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Choose a strong, unique password</li>
              <li style="margin: 5px 0;">Use a combination of letters, numbers, and symbols</li>
              <li style="margin: 5px 0;">Never share your password with anyone</li>
              <li style="margin: 5px 0;">Enable two-factor authentication if available</li>
            </ul>
          </div>

          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;"><strong>🛡️ Security Notice:</strong> If you didn't request this password reset, your account may be compromised. Please contact our support team immediately at support@streamply.com</p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this password reset, please ignore this email.<br>
              Need help? Contact us at support@streamply.com
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
              This email was sent via SendGrid's secure infrastructure.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `,
    // Optional: Add tracking
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Password reset email sent:', {
      to: email,
      messageId: response[0]?.headers?.['x-message-id']
    });
    return { 
      success: true, 
      info: {
        messageId: response[0]?.headers?.['x-message-id'],
        statusCode: response[0]?.statusCode
      }
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.response?.body || error.message);
    return { success: false, error: error.response?.body || error.message };
  }
};

// Enhanced OTP email function (if used elsewhere)
const sendOtpEmail = async (email, otp, expirationTime = 10) => {
  if (!isConfigured()) {
    console.error('sendOtpEmail: SendGrid not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const msg = {
    to: email.trim(),
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME
    },
    subject: '🔐 Your StreamPly Verification Code',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #007bff; margin: 0;">🎬 StreamPly</h2>
            <h3 style="color: #333; margin: 10px 0;">🔐 Verification Code</h3>
          </div>
         
          <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 5px; padding: 20px; margin-bottom: 25px; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #1976d2; font-size: 16px;"><strong>Your verification code is:</strong></p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; background: white; padding: 15px; border-radius: 8px; border: 2px solid #007bff;">
              ${otp}
            </div>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; text-align: center;"><strong>⏰ This code expires in ${expirationTime} minutes</strong></p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't request this code, please ignore this email.<br>
              Need help? Contact us at support@streamply.com
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ OTP email sent:', {
      to: email,
      messageId: response[0]?.headers?.['x-message-id']
    });
    return { 
      success: true, 
      info: {
        messageId: response[0]?.headers?.['x-message-id'],
        statusCode: response[0]?.statusCode
      }
    };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.response?.body || error.message);
    return { success: false, error: error.response?.body || error.message };
  }
};

// Configuration check function
const checkConfiguration = () => {
  return {
    configured: isConfigured(),
    apiKey: !!SENDGRID_API_KEY,
    fromEmail: !!SENDGRID_FROM_EMAIL,
    fromName: !!SENDGRID_FROM_NAME
  };
};

export { 
  sendConfirmationEmail, 
  sendPasswordResetMail, 
  sendOtpEmail,
  sendTestEmail,
  checkConfiguration 
};
