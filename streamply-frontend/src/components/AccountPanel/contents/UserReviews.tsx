import { Box, Typography, Card, CardContent, Divider, Chip } from '@mui/material';
import { Movie, Star, RateReview, TrendingUp } from '@mui/icons-material';
import { useGetUserReviews } from '../../../hooks/useGetUserReviews';
import { useAppSelector } from '../../../store/hooks';

export const UserReviews = () => {
  const { username } = useAppSelector(state => state.user);
  const { data, isLoading, error } = useGetUserReviews(username);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography color="white" fontSize="1.1rem">
          Loading your reviews...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography color="error.main" fontSize="1.1rem">
          Error: {error.message}
        </Typography>
      </Box>
    );
  }

  if (data?.reviews.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 12,
          gap: 4,
          maxWidth: '600px',
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(255, 87, 34, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <RateReview sx={{ fontSize: '4rem', color: '#f44336' }} />
        </Box>

        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 600,
            textAlign: 'center',
            mb: 2,
          }}
        >
          No reviews yet
        </Typography>

        <Typography
          color="rgba(255, 255, 255, 0.7)"
          textAlign="center"
          fontSize="1.2rem"
          lineHeight={1.6}
          maxWidth="450px"
        >
          Start your movie journey! Watch some content and share your thoughts with the community.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mt: 3,
          }}
        >
          <Chip
            icon={<Movie />}
            label="Browse Movies"
            sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.15)',
              color: '#f44336',
              fontWeight: 600,
              py: 2,
              px: 1,
              '& .MuiChip-icon': { color: '#f44336' },
            }}
          />
          <Chip
            icon={<Star />}
            label="Rate & Review"
            sx={{
              backgroundColor: 'rgba(255, 193, 7, 0.15)',
              color: '#ffb300',
              fontWeight: 600,
              py: 2,
              px: 1,
              '& .MuiChip-icon': { color: '#ffb300' },
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: '1400px', mx: 'auto' }}>
      {/* Header Section with Stats */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <RateReview sx={{ color: '#f44336', fontSize: '2rem' }} />
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #f44336, #ff5722)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your Reviews & Comments
          </Typography>
        </Box>

        {/* Statistics Row */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Chip
            icon={<Movie />}
            label={`${data?.reviews.length || 0} Reviews`}
            sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.15)',
              color: '#f44336',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#f44336' },
            }}
          />
          <Chip
            icon={<Star />}
            label={`${
              data?.reviews
                ? (
                    data.reviews.reduce((sum, review) => sum + (review.grade || 0), 0) /
                    Math.max(data.reviews.length, 1)
                  ).toFixed(1)
                : '0.0'
            } Avg Rating`}
            sx={{
              backgroundColor: 'rgba(255, 193, 7, 0.15)',
              color: '#ffb300',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#ffb300' },
            }}
          />
          <Chip
            icon={<TrendingUp />}
            label="Active Reviewer"
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              color: '#4caf50',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#4caf50' },
            }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
      </Box>

      {/* Reviews Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(auto-fit, minmax(420px, 1fr))',
          },
          gap: 4,
          alignItems: 'start',
        }}
      >
        {data?.reviews.map((review, idx) => (
          <Card
            key={`${username}-review-${review.title}-${idx}`}
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: review.grade
                  ? `linear-gradient(90deg, #f44336, #ff5722)`
                  : 'linear-gradient(90deg, #666, #999)',
                opacity: 0.8,
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderColor: 'rgba(244, 67, 54, 0.3)',
                transform: 'translateY(-4px) scale(1.02)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(244, 67, 54, 0.1)',
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Movie Title with Rating Badge */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1.3rem',
                      mb: 1,
                      background: 'linear-gradient(45deg, #ffffff, #e3f2fd)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {'title' in review ? review.title : 'Unknown Title'}
                  </Typography>
                </Box>

                {review.grade && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backgroundColor: 'rgba(244, 67, 54, 0.15)',
                      borderRadius: '12px',
                      p: 1.5,
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                    }}
                  >
                    <Star sx={{ color: '#ffb300', fontSize: '1.2rem' }} />
                    <Typography
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      {Number(review.grade).toFixed(1)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Review Content */}
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  borderLeft: '4px solid #f44336',
                }}
              >
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.7,
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    position: 'relative',
                    pl: 2,
                  }}
                >
                  {review.comment}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
