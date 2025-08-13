import { Box, Typography, Button, Card, CardContent, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';

export default function PaymentCancel() {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth={false}>
      <Box 
        sx={{ 
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Card 
          sx={{ 
            width: '100%',
            maxWidth: 500,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
            color: 'white',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <CancelIcon 
              sx={{ 
                fontSize: 80, 
                color: '#fca5a5',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(252, 165, 165, 0.3))'
              }} 
            />
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                color: '#fca5a5'
              }}
            >
              Payment Cancelled
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                opacity: 0.9,
                fontWeight: 300
              }}
            >
              No worries, you can try again anytime!
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                opacity: 0.8,
                lineHeight: 1.6
              }}
            >
              Your payment was cancelled. No charges were made to your account. 
              You can return to our subscription plans and try again whenever you're ready.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/subscription')}
                sx={{ 
                  backgroundColor: '#fca5a5',
                  color: '#7f1d1d',
                  '&:hover': { backgroundColor: '#f87171' },
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Back to Plans
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  },
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Go Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
