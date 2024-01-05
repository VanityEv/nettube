import { Box, Button, Grid, Tab, Tabs, Typography } from '@mui/material';
import { useVideosStore } from '../../state/videosStore';
import { useParams } from 'react-router-dom';
import { PlayCircleOutline } from '@mui/icons-material';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { useState } from 'react';
import { TabPanel } from '../TabPanel';
import { MoreInformation } from './contents/MoreInformation';
import { ShowReviewList } from './contents/ShowReviewList';
import { Episodes } from './contents/Episodes';

export const VideoPage = () => {
  const { videos } = useVideosStore();
  const { title } = useParams();
  const [tabValue, setTabValue] = useState(1);
  const video = videos.find(video => toKebabCase(video.title) === title);
  const isSeries = video?.type === 'series';

  if (!video) {
    return <></>;
  }

  return (
    <Box sx={{ height: 'calc(100vh - 4.5rem)' }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(11, 8, 21, 0.99)), url(${video.thumbnail})`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundSize: 'cover',
          height: '100%',
          width: '100%',
        }}
      >
        <Grid container direction="row" sx={{ alignItems: 'center', height: '80%' }}>
          <Grid item sx={{ width: '40%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', ml: '4rem', gap: '3rem' }}>
              <Typography variant="h3" color="white">
                {video.title}
              </Typography>
              <Button
                startIcon={<PlayCircleOutline />}
                href={`/video/${video.id}`}
                variant="contained"
                sx={{ backgroundColor: 'primary.600', width: '20%' }}
              >
                Play
              </Button>
              <Typography variant="body1" sx={{ fontSize: '1rem', width: '75%' }} color="white">
                {video.descr}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Tabs
          value={tabValue}
          onChange={(event, newValue: number) => setTabValue(newValue)}
          indicatorColor={undefined}
          textColor="secondary"
          sx={{
            p: 3,
            '&>div>div': { gap: 2 },
            '.MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          {isSeries && <Tab label="Episodes" value={0} />}
          <Tab label="More Information" value={1} />
          <Tab label="Comments & Reviews" value={2} />
        </Tabs>
        <TabPanel index={0} value={tabValue}>
          <Episodes show_id={video.id} />
        </TabPanel>
        <TabPanel index={1} value={tabValue}>
          <MoreInformation video={video} />
        </TabPanel>
        <TabPanel index={2} value={tabValue}>
          <ShowReviewList video={video} />
        </TabPanel>
      </Box>
    </Box>
  );
};
