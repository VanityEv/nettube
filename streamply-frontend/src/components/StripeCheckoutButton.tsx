import { Button } from '@mui/material';
import axios from 'axios';
import { api } from '../constants';
import { useAppSelector } from '../store/hooks';
import { useState } from 'react';

interface StripeCheckoutButtonProps {
  priceId: string; // Stripe price ID for the subscription
}

export const StripeCheckoutButton = ({ priceId }: StripeCheckoutButtonProps) => {
  const { username } = useAppSelector(state => state.user);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // You may want to fetch userId from backend or state
      const response = await axios.post(`${api}/user/stripe/session`, {
        userId: username,
        priceId,
      });
      if (response.data.result === 'SUCCESS' && response.data.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to start payment session.');
      }
    } catch (err) {
      alert('Payment error.');
    }
    setLoading(false);
  };

  return (
    <Button variant="contained" color="primary" onClick={handleCheckout} disabled={loading}>
      {loading ? 'Redirecting...' : 'Subscribe with Stripe'}
    </Button>
  );
};
