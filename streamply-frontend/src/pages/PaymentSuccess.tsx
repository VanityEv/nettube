import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" color="success.main" gutterBottom>
        Payment Successful!
      </Typography>
      <Typography color="white" sx={{ mb: 2 }}>
        Thank you for subscribing. Enjoy unlimited streaming!
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Go to Home
      </Button>
    </Box>
  );
}
