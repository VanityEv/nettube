import { Button } from '@mui/material';
import axios from 'axios';
import { api } from '../constants';
import { useState } from 'react';
import { getCookie } from 'typescript-cookie';

interface StripeCheckoutButtonProps {
  priceId: string; // Stripe price ID for the subscription
}

export const StripeCheckoutButton = ({ priceId }: StripeCheckoutButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const userId = getCookie('userId'); // Get actual userId from cookie
      if (!userId) {
        alert('Please log in to subscribe.');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${api}/user/stripe/session`, {
        userId,
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
    <Button
      variant="outlined"
      sx={{
        color: 'white',
        backgroundColor: '#e51445',
        borderColor: 'white',
        '&:hover': {
          borderColor: 'primary.main',
          color: 'primary.main',
        },
      }}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? 'Redirecting...' : 'Subscribe with Stripe'}
    </Button>
  );
};
