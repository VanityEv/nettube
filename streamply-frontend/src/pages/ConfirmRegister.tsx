import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../constants';
import { HttpClient } from '../utils/httpClient';

const ConfirmRegister = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const sendConfirmRequest = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage('Invalid confirmation link - no token provided.');
          return;
        }

        const response = await HttpClient.post(`${api}/user/confirmRegister`, { token });

        if (response.data.result === 'SUCCESS') {
          setStatus('success');
          setMessage('Your email has been confirmed successfully! You can now sign in.');
        } else {
          setStatus('error');
          setMessage('Confirmation failed. Please try again or request a new confirmation email.');
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage('Confirmation failed. The token may be invalid or expired.');
      }
    };

    sendConfirmRequest();
  }, [searchParams]);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      {status === 'loading' && <p>Confirming your email...</p>}
      {status === 'success' && (
        <div>
          <h2 style={{ color: 'green' }}>✓ Email Confirmed!</h2>
          <p>{message}</p>
          <a href="/signin" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Go to Sign In
          </a>
        </div>
      )}
      {status === 'error' && (
        <div>
          <h2 style={{ color: 'red' }}>✗ Confirmation Failed</h2>
          <p style={{ color: 'white' }}>{message}</p>
          <a href="/signin" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Go to Sign In
          </a>
        </div>
      )}
    </div>
  );
};

export default ConfirmRegister;
