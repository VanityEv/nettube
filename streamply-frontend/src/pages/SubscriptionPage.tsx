import { Box, Typography, Card, CardContent, CardActions } from '@mui/material';
import { StripeCheckoutButton } from '../components/StripeCheckoutButton';

// Test plans - $1 each for easy testing
const plans = [
  {
    name: 'Basic',
    price: '$1.00/mo',
    features: ['HD streaming', '1 device', 'Cancel anytime'],
    priceId: 'price_1QZCBh2NdrzPV1EzGkVXDGmV', // Replace with your actual Stripe price ID
  },
  {
    name: 'Premium',
    price: '$1.00/mo',
    features: ['4K streaming', '4 devices', 'Offline access'],
    priceId: 'price_1QZCCl2NdrzPV1EzwZpQDctJ', // Replace with your actual Stripe price ID
  },
];

export default function SubscriptionPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" color="white" gutterBottom>
        Choose your subscription
      </Typography>{' '}
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {plans.map(plan => (
          <Box key={plan.priceId} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Card sx={{ backgroundColor: 'secondary.400', color: 'white' }}>
              <CardContent>
                <Typography variant="h5">{plan.name}</Typography>
                <Typography variant="h6" sx={{ my: 2 }}>
                  {plan.price}
                </Typography>
                <ul>
                  {plan.features.map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </CardContent>
              <CardActions>
                <StripeCheckoutButton priceId={plan.priceId} />{' '}
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
