# 📧 SendGrid Single Sender Setup Guide
# Quick setup for StreamPly email functionality

## Step-by-Step Single Sender Verification

### 1. Login to SendGrid Dashboard
Go to: https://app.sendgrid.com/

### 2. Navigate to Sender Authentication
- Click "Settings" in left sidebar
- Click "Sender Authentication"
- Click "Create Single Sender" (blue button)

### 3. Fill Out Sender Information
```
From Name: StreamPly
From Email Address: your-email@gmail.com (or any email you own)
Reply To: your-email@gmail.com (same as above)
Company Address: Your address
City: Your city
State: Your state
Zip Code: Your zip
Country: Your country
```

### 4. Verify Your Email
- SendGrid will send a verification email to your address
- Click the verification link in the email
- Your sender is now verified!

### 5. Update Your Environment Variables
```env
# In your .env file:
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=your-email@gmail.com  # Same email you verified
SENDGRID_FROM_NAME=StreamPly
```

## Important Notes:

✅ **You can use Gmail**: your-email@gmail.com works perfectly
✅ **Professional look**: Recipients see "StreamPly <your-email@gmail.com>"
✅ **No domain required**: Works immediately with any email you own
✅ **Free forever**: No additional costs

❌ **Limitations**: 
- Recipients see your personal email in technical headers
- Not as professional as custom domain

## Testing Your Setup:
```bash
# Test email sending
node -e "import('./services/mail/MailSendGrid.js').then(mail => mail.sendTestEmail('test@example.com'));"
```

## 🚀 Result:
Your StreamPly app can now send professional emails through SendGrid using your personal email as the sender!
