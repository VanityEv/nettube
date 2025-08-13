import { Box, Typography, Button, Card, CardContent, Container, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import MovieIcon from '@mui/icons-material/Movie';

export default function PaymentSuccess() {
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
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: '#10b981',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3))'
              }} 
            />
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Payment Successful!
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3,
                opacity: 0.9,
                fontWeight: 300
              }}
            >
              Thank you for your purchase!
            </Typography>
            
            <Chip 
              label="Lifetime Premium Access Activated"
              sx={{ 
                mb: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontWeight: 'bold',
                fontSize: '1rem',
                py: 2,
                px: 1
              }}
            />
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                opacity: 0.8,
                lineHeight: 1.6
              }}
            >
              Your payment has been processed successfully. You now have <strong>lifetime access</strong> to our premium streaming content. 
              No recurring charges, no expiration date - enjoy unlimited HD/4K streaming forever!
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                sx={{ 
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Go to Home
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<MovieIcon />}
                onClick={() => navigate('/browse')}
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
                Start Watching
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
