import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { StripeCheckoutButton } from './StripeCheckoutButton';

const plans = [
  {
    name: 'Basic',
    price: '2 PLN',
    features: ['HD streaming', '1 device', 'Lifetime access'],
    priceId: 'price_1RxdnE2NdrzPV1Ezt9XXJDIy', // Basic - 2 PLN one-time
  },
  {
    name: 'Premium',
    price: '2 PLN',
    features: ['4K streaming', '4 devices', 'Lifetime access'],
    priceId: 'price_1RxdnE2NdrzPV1EzZMoGgY3R', // Premium - 2 PLN one-time
  },
];

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  videoTitle?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ open, onClose, videoTitle }) => {
  console.log('SubscriptionModal render - open:', open, 'videoTitle:', videoTitle);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'secondary.400',
          color: 'white',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', color: 'white' }}>
        <Lock sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h5" component="div">
          Subscription Required
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {videoTitle
              ? `To watch "${videoTitle}", you need an active subscription.`
              : 'You need an active subscription to access this content.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join thousands of viewers enjoying unlimited streaming!
          </Typography>
        </Box>{' '}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {plans.map(plan => (
            <Box key={plan.priceId} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="h5" color="primary.main" sx={{ mb: 2 }}>
                    {plan.price}
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {plan.features.map(feature => (
                      <li key={feature}>
                        <Typography variant="body2">{feature}</Typography>
                      </li>
                    ))}
                  </Box>
                </CardContent>{' '}
                <CardActions sx={{ p: 2 }}>
                  <StripeCheckoutButton priceId={plan.priceId} />
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          Maybe Later
        </Button>
      </DialogActions>
    </Dialog>
  );
};
