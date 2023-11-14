import { Box, Button, Typography } from '@mui/material';
import { Video } from '../../store/videos.types';
import { Bookmark, PlayArrow, PlayCircle } from '@mui/icons-material';
import React from 'react';
import { useGetMockData } from '../../hooks/useGetMockData';

type CategoryPreviewProps = {
  name: string;
  title: string;
  background: string;
  description?: string;
  videos: Video[];
};

export const CategoryPreview = ({ name, title, description, background, videos }: CategoryPreviewProps) => {
  const { data } = useGetMockData();
  console.log(data);

  return (
    <>
      <Typography variant="h4" color="text.secondary" sx={{ p: 3 }}>
        {name}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Box
          sx={{
            width: '90%',
            height: '90%',
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 90%), url(${background})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <Box sx={{ pl: '50%', mt: '15%', mr: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h2" color="text.secondary" fontWeight={600}>
              {title.toUpperCase()}
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineClamp: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {description}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 4, justifyContent: 'center' }}>
              <Button
                variant="contained"
                sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2, p: 2 }}
              >
                <PlayCircle />
                Watch now
              </Button>
              <Button variant="contained">
                <Bookmark />
                Save for later
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};
