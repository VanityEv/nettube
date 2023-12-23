import { Box, IconButton, InputAdornment, InputBase, Modal, Zoom } from '@mui/material';
import { useVideosStore } from '../../state/videosStore';
import { SingleVideo } from '../VideoViews/SingleVideo';
import { useState } from 'react';
import { Close, Search, SearchOutlined } from '@mui/icons-material';

export const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { videos } = useVideosStore();
  const [searchValue, setSearchValue] = useState('');
  const videosToDisplay = videos.filter(video => video.title.toLowerCase().includes(searchValue));

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  return (
    <>
      <IconButton onClick={onClose}>
        <SearchOutlined sx={{ color: 'white', mr: '1rem', fontSize: '1.5rem' }} />
      </IconButton>
      <Modal
        open={open}
        sx={{
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'secondary.400',
          alignItems: 'center',
          p: 4,
        }}
      >
        <>
          <InputBase
            placeholder="Search videos..."
            sx={{
              backgroundColor: 'secondary.400',
              border: '2px solid #e51445',
              borderRadius: '40px',
              color: 'white',
              py: 1,
              pl: '12px',
              width: '75%',
              mr: { mobile: 0, desktop: 2 },
              opacity: 0.9,
              mb: '2rem',
            }}
            startAdornment={
              <InputAdornment position="start">
                <Search color="primary" />
              </InputAdornment>
            }
            value={searchValue}
            onChange={handleSearchChange}
          />
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 0, right: 0, mr: 4, mt: 3 }}>
            <Close sx={{ color: 'white', fontSize: '2.5rem' }} />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: '2rem',
              height: '100%',
              width: '100%',
              flexWrap: 'wrap',
              p: 3,
              justifyContent: 'center',
              overflowY: 'auto',
            }}
          >
            {videosToDisplay.map(video => (
              <SingleVideo video={video} key={`searchVideo-${video.id}`} />
            ))}
          </Box>
        </>
      </Modal>
    </>
  );
};
