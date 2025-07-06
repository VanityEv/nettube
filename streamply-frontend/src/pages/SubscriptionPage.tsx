import { Box, Typography, Card, CardContent, CardActions } from '@mui/material';
import { StripeCheckoutButton } from '../components/StripeCheckoutButton';

// Example plans - replace priceId with your real Stripe price IDs
const plans = [
  {
    name: 'Basic',
    price: '$9.99/mo',
    features: ['HD streaming', '1 device', 'Cancel anytime'],
    priceId: 'price_basic_123',
  },
  {
    name: 'Premium',
    price: '$14.99/mo',
    features: ['4K streaming', '4 devices', 'Offline access'],
    priceId: 'price_premium_456',
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
