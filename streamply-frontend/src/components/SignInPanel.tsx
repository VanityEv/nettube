import { Box, Typography, Stack, TextField, Button, Link } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HttpClient } from '../utils/httpClient';
import { api } from '../constants';
import { useAppDispatch } from '../store/hooks';
import { setUserData } from '../store/slices/userSlice';
import { fetchAllVideosData } from '../store/slices/videosSlice';
import { setCookie } from 'typescript-cookie';
import { useNavigate } from 'react-router-dom';
import { SnackbarContext } from '../App';
import { useContext, useState } from 'react';
import { ResendConfirmationModal } from './ResendConfirmation';
import { PasswordResetLinkModal } from './PasswordResetLinkModal';
import TwoFactorVerification from './TwoFactorVerification';

type LoginResponse = {
  username: string;
  token: string;
  accessToken: string;
  account_type: number;
  confirmed: number;
  result?: string;
  tempToken?: string;
  alertType?: string;
  locationInfo?: any;
  deviceInfo?: any;
  message?: string;
  mfaRequired?: boolean;
  email?: string;
  userId?: string;
  data?: {
    userId?: string;
  };
};

export const SignInPanel = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();
  const [mfaStep, setMfaStep] = useState<'none' | 'pending' | 'verifying'>('none');
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<{ username: string; email: string; userId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New 2FA verification states
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{
    tempToken: string;
    alertType: 'new_device' | 'suspicious_location';
    locationInfo?: any;
    deviceInfo?: any;
  } | null>(null);

  const FormSchema = z.object({
    username: z.string().min(2, {
      message: 'Please enter valid username.',
    }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  });

  type Schema = z.infer<typeof FormSchema>;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Schema) => {
    setIsLoading(true);
    console.log('🔄 Starting login attempt...');
    try {
      const loginResponse = await HttpClient.post(`${api}/user/signin`, {
        ...data,
      }) as LoginResponse;

      console.log('✅ Login response received:', loginResponse);

      // Handle new 2FA verification system
      if (loginResponse.result === 'VERIFICATION_REQUIRED') {
        console.log('🔐 2FA verification required');
        setTwoFactorData({
          tempToken: loginResponse.tempToken!,
          alertType: loginResponse.alertType! as 'new_device' | 'suspicious_location',
          locationInfo: loginResponse.locationInfo,
          deviceInfo: loginResponse.deviceInfo,
        });
        setShowTwoFactor(true);
        showSnackbar(loginResponse.message || 'Security verification required', 'info');
        return;
      }

      // If MFA is required, trigger MFA step (legacy system)
      if (loginResponse.mfaRequired) {
        console.log('📱 MFA required');
        setPendingUser({
          username: data.username,
          email: loginResponse.email || '',
          userId: loginResponse.userId || data.username,
        });
        // Request OTP
        await HttpClient.post(`${api}/user/mfa/request`, {
          email: loginResponse.email,
          userId: loginResponse.data?.userId || data.username,
        });
        setMfaStep('pending');
        showSnackbar('MFA code sent to your email.', 'info');
        return;
      }

      if (loginResponse.result === 'SUCCESS') {
        console.log('✅ Login successful, checking confirmation status');
        // Check confirmed status - all users must have confirmed email
        const isConfirmed = Boolean(loginResponse.confirmed);
        console.log('📧 Confirmation status:', isConfirmed);

        if (!isConfirmed) {
          console.log('❌ Email not confirmed');
          showSnackbar('Email not confirmed! Please check your email and click the confirmation link.', 'error');
        } else {
          console.log('🎉 Login completed successfully');
          showSnackbar('Logged in!', 'success');

          // First set cookies and user data
          setCookie('userToken', loginResponse.accessToken);
          setCookie('userId', loginResponse.userId);  // Store userId
          setCookie('userAccountType', loginResponse.account_type);
          await dispatch(setUserData(loginResponse.username));

          // Then fetch videos with the token
          await dispatch(fetchAllVideosData());

          // Finally navigate to home
          navigate('/');
        }
      } else {
        console.log('❌ Login failed - unexpected result:', loginResponse.result);
        showSnackbar('Login failed - please try again', 'error');
      }
    } catch (error) {
      console.error('❌ Login error caught:', error);
      
      // Enhanced error handling with status codes
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        console.log('🔍 Error status:', status);
        
        if (status === 401) {
          showSnackbar('Invalid username or password', 'error');
        } else if (status === 429) {
          showSnackbar('Too many login attempts. Please try again later.', 'error');
        } else if (status >= 500) {
          showSnackbar('Server error. Please try again later.', 'error');
        } else {
          showSnackbar('Login failed. Please try again.', 'error');
        }
      } else {
        console.log('🔍 Network or unknown error');
        showSnackbar('Network error. Please check your connection.', 'error');
      }
    } finally {
      // Always reset loading state
      console.log('🔄 Resetting loading state');
      setIsLoading(false);
    }
  };

  // MFA OTP verification handler
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setMfaStep('verifying');
    try {
      const verifyRes = await HttpClient.post(`${api}/user/mfa/verify`, {
        userId: pendingUser.userId,
        code: otp,
      });
      if (verifyRes.result === 'SUCCESS') {
        // Now fetch the real login token (simulate or re-login, depending on backend design)
        // For demo, assume backend returns token in original response or you need to re-login
        // Here, re-login to get token
        const loginResponse = await HttpClient.post(`${api}/user/signin`, {
          username: pendingUser.username,
          password: form.getValues('password'),
        });

        // Check confirmed status with admin bypass
        const isConfirmed = Boolean(loginResponse.confirmed);
        const isAdmin = loginResponse.account_type === 3;

        if (loginResponse.result === 'SUCCESS' && (isConfirmed || isAdmin)) {
          showSnackbar('Logged in!', 'success');
          await dispatch(setUserData(loginResponse.username));
          setCookie('userToken', loginResponse.accessToken || loginResponse.token);
          setCookie('userAccountType', loginResponse.data.account_type);
          navigate('/');
        } else {
          showSnackbar('Email not confirmed!', 'error');
        }
      } else {
        showSnackbar('Invalid or expired OTP code.', 'error');
        setMfaStep('pending');
      }
    } catch (err) {
      showSnackbar('Invalid or expired OTP code.', 'error');
      setMfaStep('pending');
    }
  };

  // Handle 2FA verification success
  const handle2FASuccess = async (token: string, userInfo: any) => {
    // Close modal immediately
    setShowTwoFactor(false);
    setTwoFactorData(null);

    try {
      showSnackbar('Login verified successfully!', 'success');
      await dispatch(setUserData(userInfo.username));
      setCookie('userToken', token);
      setCookie('userAccountType', userInfo.account_type.toString());

      // Try to fetch videos but don't let it block navigation
      try {
        await dispatch(fetchAllVideosData());
      } catch (videoError) {
        console.warn('Failed to fetch videos during login:', videoError);
      }

      navigate('/');
    } catch (error) {
      console.error('Error completing login:', error);
      showSnackbar('Login completion failed', 'error');
      // Still navigate even if there's an error
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA verification cancel
  const handle2FACancel = () => {
    setShowTwoFactor(false);
    setTwoFactorData(null);
    setIsLoading(false);
    showSnackbar('Login cancelled', 'info');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img alt="logo" src="logo-text-dark.svg" width="300px" height="auto" style={{ marginBottom: '1rem' }} />
      <Typography component="h1" variant="h5" color="white">
        Sign in
      </Typography>
      {mfaStep === 'pending' ? (
        <Box
          component="form"
          onSubmit={handleOtpSubmit}
          sx={{ mt: 3, pb: 2, width: { mobile: '100%', tablet: '50%', desktop: '75%' } }}
        >
          <Stack
            spacing={3}
            width="100%"
            sx={{
              input: { color: 'white' },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              '&>div>div>fieldset': { borderColor: 'primary.600' },
            }}
          >
            <Typography color="white">Enter the 6-digit code sent to your email</Typography>
            <TextField
              label="OTP Code"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              sx={{ width: { mobile: '75%', desktop: '50%' } }}
              tabIndex={1}
              autoFocus
              required
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3, mb: 2, px: 8, backgroundColor: 'primary.600' }}
              disabled={mfaStep === 'pending' || isLoading}
            >
              {mfaStep === 'pending' ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button
              onClick={async () => {
                if (pendingUser) {
                  await HttpClient.post(`${api}/user/mfa/request`, {
                    email: pendingUser.email,
                    userId: pendingUser.userId,
                  });
                  showSnackbar('OTP resent to your email.', 'info');
                }
              }}
              sx={{ color: 'white' }}
            >
              Resend Code
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box
          component="form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          sx={{ mt: 3, pb: 2, width: { mobile: '100%', tablet: '50%', desktop: '75%' } }}
        >
          <Stack
            spacing={3}
            width="100%"
            sx={{
              input: { color: 'white' },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              '&>div>div>fieldset': { borderColor: 'primary.600' },
            }}
          >
            <Controller
              name="username"
              control={form.control}
              defaultValue=""
              render={({ field: { ref, ...field } }) => (
                <TextField
                  aria-label="username-field"
                  required
                  error={Boolean(form.formState.errors.username)}
                  id="username"
                  label="Username"
                  autoFocus
                  tabIndex={1}
                  sx={{
                    input: { color: 'white' },
                    width: {
                      mobile: '75%',
                      desktop: '50%',
                      '& .MuiOutlinedInput-root:hover': {
                        '& > fieldset': {
                          borderColor: 'white',
                        },
                      },
                    },
                  }}
                  inputRef={ref}
                  {...field}
                />
              )}
            />
            <Controller
              name="password"
              control={form.control}
              defaultValue=""
              render={({ field: { ref, ...field } }) => (
                <TextField
                  aria-label="password-field"
                  required
                  label="Password"
                  type="password"
                  id="password"
                  tabIndex={2}
                  sx={{
                    width: {
                      mobile: '75%',
                      desktop: '50%',
                      '& .MuiOutlinedInput-root:hover': {
                        '& > fieldset': {
                          borderColor: 'white',
                        },
                      },
                    },
                  }}
                  inputRef={ref}
                  {...field}
                  variant="outlined"
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              tabIndex={3}
              sx={{ mt: 3, mb: 2, px: 8, backgroundColor: 'primary.600' }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <PasswordResetLinkModal />
            <Link href="/signup" variant="body1">
              Not a member? Register now!
            </Link>
            <ResendConfirmationModal />
          </Stack>
        </Box>
      )}

      {/* 2FA Verification Modal */}
      {showTwoFactor && twoFactorData && (
        <TwoFactorVerification
          tempToken={twoFactorData.tempToken}
          alertType={twoFactorData.alertType}
          locationInfo={twoFactorData.locationInfo}
          deviceInfo={twoFactorData.deviceInfo}
          onVerificationSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      )}
    </Box>
  );
};
