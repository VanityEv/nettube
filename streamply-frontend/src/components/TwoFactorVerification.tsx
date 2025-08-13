import React, { useState } from 'react';
import { api } from '../constants';
import { HttpClient } from '../utils/httpClient';

interface TwoFactorVerificationProps {
  tempToken: string;
  alertType: 'new_device' | 'suspicious_location';
  locationInfo: any;
  deviceInfo: any;
  onVerificationSuccess: (token: string, userInfo: any) => void;
  onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  tempToken,
  alertType,
  locationInfo,
  deviceInfo,
  onVerificationSuccess,
  onCancel,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await HttpClient.post(`${api}/user/verifyLoginCode`, {
        tempToken,
        verificationCode,
      });

      if (response.result === 'SUCCESS') {
        onVerificationSuccess(response.accessToken, response);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.data?.error || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const getAlertIcon = () => {
    return alertType === 'new_device' ? '🔒' : '🚨';
  };

  const getAlertTitle = () => {
    return alertType === 'new_device' ? 'New Device Detected' : 'Suspicious Location Detected';
  };

  const getAlertDescription = () => {
    return alertType === 'new_device'
      ? 'We detected a login from a new device. Please verify your identity to continue.'
      : 'We detected a login from an unusual location. Please verify your identity to continue.';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#161616',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '460px',
          width: '90%',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '40px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            {getAlertIcon()}
          </div>
          <h2
            style={{
              color: '#ffffff',
              margin: '0 0 12px 0',
              fontSize: '22px',
              fontWeight: '600',
              letterSpacing: '-0.5px',
            }}
          >
            {getAlertTitle()}
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              lineHeight: '1.5',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            {getAlertDescription()}
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '18px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '13px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h4
            style={{
              margin: '0 0 12px 0',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Login Details:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p
              style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', display: 'flex', justifyContent: 'space-between' }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Location:</span>
              <span>
                {locationInfo?.city || 'Unknown'}, {locationInfo?.country || 'Unknown'}
              </span>
            </p>
            <p
              style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', display: 'flex', justifyContent: 'space-between' }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Device:</span>
              <span>
                {deviceInfo?.type || 'Unknown'} - {deviceInfo?.browser || 'Unknown'}
              </span>
            </p>
            <p
              style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', display: 'flex', justifyContent: 'space-between' }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Time:</span>
              <span>{new Date().toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3
            style={{
              color: '#ffffff',
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Enter Verification Code
          </h3>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              margin: '0 0 20px 0',
              lineHeight: '1.4',
            }}
          >
            We've sent a 6-digit code to your email address.
          </p>

          <form onSubmit={handleVerification}>
            <input
              type="text"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={{
                fontSize: '24px',
                letterSpacing: '8px',
                textAlign: 'center',
                padding: '16px 20px',
                width: '180px',
                border: verificationCode.length === 6 ? '2px solid #e51445' : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                marginBottom: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                fontFamily: 'monospace',
              }}
              maxLength={6}
              autoComplete="off"
              onFocus={e => {
                e.target.style.borderColor = '#e51445';
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
              }}
              onBlur={e => {
                e.target.style.borderColor = verificationCode.length === 6 ? '#e51445' : 'rgba(255, 255, 255, 0.2)';
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
              }}
            />

            {error && (
              <div
                style={{
                  color: '#ff5252',
                  fontSize: '13px',
                  marginBottom: '20px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 82, 82, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 82, 82, 0.2)',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                style={{
                  backgroundColor: verificationCode.length === 6 ? '#e51445' : 'rgba(229, 20, 69, 0.3)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '40px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: verificationCode.length === 6 && !isVerifying ? 'pointer' : 'not-allowed',
                  transition:
                    'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                  minWidth: '64px',
                  textTransform: 'capitalize',
                  letterSpacing: '0.02857em',
                  height: '3rem',
                  display: 'flex',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow:
                    verificationCode.length === 6
                      ? 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px'
                      : 'none',
                }}
              >
                {isVerifying ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={onCancel}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid #e51445',
                  padding: '5px 15px',
                  borderRadius: '40px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition:
                    'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                  minWidth: '64px',
                  textTransform: 'capitalize',
                  height: '3rem',
                  display: 'flex',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#e51445';
                }}
                onMouseOut={e => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            lineHeight: '1.4',
          }}
        >
          Code expires in 10 minutes. Check your spam folder if you don't see the email.
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;
