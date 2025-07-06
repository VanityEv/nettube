import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" color="error.main" gutterBottom>
        Payment Cancelled
      </Typography>
      <Typography color="white" sx={{ mb: 2 }}>
        Your payment was cancelled. You can try again at any time.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/subscription')}>
        Back to Plans
      </Button>
    </Box>
  );
}
