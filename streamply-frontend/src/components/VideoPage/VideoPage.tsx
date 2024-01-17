import { Box, Button, Grid, Tab, Tabs, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { PlayCircleOutline } from '@mui/icons-material';
import { toKebabCase } from '../../helpers/convertToKebabCase';
import { useState } from 'react';
import { TabPanel } from '../TabPanel';
import { MoreInformation } from './contents/MoreInformation';
import { ShowReviewList } from './contents/ShowReviewList';
import { Episodes } from './contents/Episodes';
import { useGetVideos } from '../../hooks/useGetVideos';
import { api } from '../../constants';

export const VideoPage = () => {
  const { data: videos } = useGetVideos();
  const { title } = useParams();
  const [tabValue, setTabValue] = useState(1);

  if (!videos) {
    return <></>;
  }

  const video = videos.find(video => toKebabCase(video.title) === title);

  if (!video) {
    return <></>;
  }

  const isSeries = video?.type === 'series';

  const destinationRoute = isSeries
    ? `/series/${toKebabCase(video.title)}/season/1/episode/1`
    : `/movie/${toKebabCase(video.title)}`;

  const queryParams = new URLSearchParams();
  queryParams.append('id', video.id.toString());
  const routeWithParams = `${destinationRoute}?${queryParams.toString()}`;

  const thumbnailURL = video.thumbnail.includes('http')
    ? video.thumbnail
    : `${api}/images/thumbnails/${toKebabCase(video.thumbnail)}`;

  return (
    <Box sx={{ height: 'calc(100vh - 4.5rem)' }}>
      <Box
        sx={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.20), rgba(11, 8, 21, 0.99)), url(${thumbnailURL})`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundSize: 'cover',
          backgroundPosition: { desktop: 'center center', mobile: 'top center' },
          height: { desktop: '100%', mobile: '35%' },
          width: '100%',
        }}
      >
        <Grid container direction="row" sx={{ alignItems: 'center', height: '80%' }}>
          <Grid item sx={{ width: { desktop: '40%', mobile: '100%' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', ml: '4rem', gap: '3rem' }}>
              <Typography variant="h3" color="white">
                {video.title}
              </Typography>
              <Button
                disabled={isSeries && video.seasons === 0}
                startIcon={<PlayCircleOutline />}
                href={routeWithParams}
                variant="contained"
                sx={{ backgroundColor: 'primary.600', width: { desktop: '20%', mobile: '75%' } }}
              >
                Play
              </Button>
              <Typography
                variant="body1"
                sx={{ fontSize: '1rem', width: '75%', display: { desktop: 'block', mobile: 'none' } }}
                color="white"
              >
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
