import { Box, Typography, Chip, Rating, Divider } from '@mui/material';
import { Video } from '../../../types/videos.types';
import {
  Person as DirectorIcon,
  CalendarToday as CalendarIcon,
  Public as CountryIcon,
  Category as GenreIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';

export const MoreInformation = ({ video }: { video: Video }) => {
  const InfoItem = ({
    icon,
    label,
    value,
    isRating = false,
    isGenre = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    isRating?: boolean;
    isGenre?: boolean;
  }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Box sx={{ color: 'primary.600', fontSize: '1.2rem' }}>{icon}</Box>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.75rem',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ ml: '2rem' }}>
        {isRating ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Rating
              value={Number(value) / 2}
              precision={0.1}
              readOnly
              size="small"
              sx={{
                '& .MuiRating-iconFilled': { color: '#FFD700' },
                '& .MuiRating-iconEmpty': { color: 'rgba(255, 255, 255, 0.3)' },
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {Number(value).toFixed(1)}/10
            </Typography>
          </Box>
        ) : isGenre ? (
          <Chip
            label={value}
            sx={{
              backgroundColor: 'primary.600',
              color: 'white',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'primary.700' },
            }}
          />
        ) : (
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              fontWeight: 500,
              fontSize: '1rem',
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: '800px', mr: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: '2rem' }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
            mb: '0.5rem',
            background: 'linear-gradient(45deg, #ffffff, #e0e0e0)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {video.title}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontStyle: 'italic',
          }}
        >
          Detailed Information
        </Typography>
      </Box>

      {/* Main Information Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: '2rem',
          mb: '2rem',
        }}
      >
        <InfoItem icon={<DirectorIcon />} label="Director" value={video.director || 'Unknown'} />

        <InfoItem icon={<CalendarIcon />} label="Release Year" value={video.production_year || 'Unknown'} />

        <InfoItem icon={<CountryIcon />} label="Country" value={video.production_country || 'Unknown'} />

        <InfoItem icon={<GenreIcon />} label="Genre" value={video.genre || 'Unknown'} isGenre={true} />
      </Box>

      <Divider
        sx={{
          borderColor: 'rgba(255, 255, 255, 0.1)',
          my: '2rem',
        }}
      />

      {/* Rating and Reviews Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: '2rem',
        }}
      >
        <InfoItem icon={<StarIcon />} label="Average Rating" value={video.grade || 0} isRating={true} />

        <InfoItem icon={<ReviewIcon />} label="Total Reviews" value={video.reviews_count || 0} />
      </Box>
    </Box>
  );
};
