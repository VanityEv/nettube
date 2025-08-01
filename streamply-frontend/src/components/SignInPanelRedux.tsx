import { Box, Typography, Stack, TextField, Button, Link } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
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
  account_type: number;
  confirmed: number;
  result?: string;
  tempToken?: string;
  alertType?: string;
  locationInfo?: any;
  deviceInfo?: any;
  message?: string;
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
  const [twoFactorCode, setTwoFactorCode] = useState('');
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
    try {
      const loginResponse = await axios.post<
        LoginResponse & { mfaRequired?: boolean; email?: string; userId?: string }
      >(`${api}/user/signin`, {
        ...data,
      });

      console.log('🚀 REDUX FULL LOGIN RESPONSE:', {
        status: loginResponse.status,
        data: loginResponse.data,
        result: loginResponse.data?.result,
      });

      // Handle new 2FA verification system
      if (loginResponse.data.result === 'VERIFICATION_REQUIRED') {
        setTwoFactorData({
          tempToken: loginResponse.data.tempToken!,
          alertType: loginResponse.data.alertType! as 'new_device' | 'suspicious_location',
          locationInfo: loginResponse.data.locationInfo,
          deviceInfo: loginResponse.data.deviceInfo,
        });
        setShowTwoFactor(true);
        showSnackbar(loginResponse.data.message || 'Security verification required', 'info');
        setIsLoading(false);
        return;
      }

      // If MFA is required, trigger MFA step (legacy system)
      if (loginResponse.data.mfaRequired) {
        setPendingUser({
          username: data.username,
          email: loginResponse.data.email || '',
          userId: loginResponse.data.userId || data.username,
        });
        // Request OTP
        await axios.post(`${api}/user/mfa/request`, {
          email: loginResponse.data.email,
          userId: loginResponse.data.userId || data.username,
        });
        setMfaStep('pending');
        showSnackbar('MFA code sent to your email.', 'info');
        setIsLoading(false);
        return;
      }
      await dispatch(fetchAllVideosData());
      if (loginResponse.status === 200) {
        // Check confirmed status - all users must have confirmed email
        const isConfirmed = Boolean(loginResponse.data.confirmed);

        console.log('🔍 REDUX LOGIN DEBUG:', {
          confirmed: loginResponse.data.confirmed,
          isConfirmed,
          accountType: loginResponse.data.account_type,
        });

        if (!isConfirmed) {
          showSnackbar('Email not confirmed! Please check your email and click the confirmation link.', 'error');
        } else {
          showSnackbar('Logged in!', 'success');
          await dispatch(setUserData(loginResponse.data.username));
          setCookie('userToken', loginResponse.data.token);
          setCookie('userAccountType', loginResponse.data.account_type);
          navigate('/');
        }
      }
    } catch (error) {
      showSnackbar('Incorrect username / password', 'error');
    }
    setIsLoading(false);
  };

  // MFA OTP verification handler
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setMfaStep('verifying');
    try {
      const verifyRes = await axios.post(`${api}/user/mfa/verify`, {
        userId: pendingUser.userId,
        code: otp,
      });
      if (verifyRes.data.result === 'SUCCESS') {
        // Now fetch the real login token (simulate or re-login, depending on backend design)
        // For demo, assume backend returns token in original response or you need to re-login
        // Here, re-login to get token
        const loginResponse = await axios.post<LoginResponse>(`${api}/user/signin`, {
          username: pendingUser.username,
          password: form.getValues('password'),
        });

        // Check confirmed status with admin bypass
        const isConfirmed = Boolean(loginResponse.data.confirmed);
        const isAdmin = loginResponse.data.account_type === 3;

        if (loginResponse.status === 200 && (isConfirmed || isAdmin)) {
          showSnackbar('Logged in!', 'success');
          await dispatch(setUserData(loginResponse.data.username));
          setCookie('userToken', loginResponse.data.token);
          setCookie('userAccountType', loginResponse.data.account_type);
          navigate('/');
        } else {
          showSnackbar('Email not confirmed!', 'error');
        }
      } else {
        showSnackbar('Invalid or expired OTP code.', 'error');
      }
    } catch (err) {
      showSnackbar('Invalid or expired OTP code.', 'error');
    }
    setMfaStep('pending');
  };

  // Handle 2FA verification success
  const handle2FASuccess = async (token: string, userInfo: any) => {
    try {
      showSnackbar('Login verified successfully!', 'success');
      await dispatch(setUserData(userInfo.username));
      setCookie('userToken', token);
      setCookie('userAccountType', userInfo.account_type.toString());
      await dispatch(fetchAllVideosData());
      setShowTwoFactor(false);
      navigate('/');
    } catch (error) {
      console.error('Error completing login:', error);
      showSnackbar('Login completion failed', 'error');
    }
  };

  // Handle 2FA verification cancel
  const handle2FACancel = () => {
    setShowTwoFactor(false);
    setTwoFactorData(null);
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
                  await axios.post(`${api}/user/mfa/request`, { email: pendingUser.email, userId: pendingUser.userId });
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
