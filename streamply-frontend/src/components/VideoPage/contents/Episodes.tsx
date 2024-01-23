import { Box, Typography } from '@mui/material';
import { useGetEpisodes } from '../../../hooks/useGetEpisodes';
import { SingleEpisode } from './SingleEpisode';
import { Episode } from '../../../types/videos.types';

type GroupedEpisodes = {
  [season: number]: Episode[];
};

export const Episodes = ({ show_id }: { show_id: number }) => {
  const { data: episodes } = useGetEpisodes(show_id);

  if (!episodes || episodes.length === 0) {
    return (
      <Typography variant="h5" sx={{ color: 'white' }}>
        This show has no episodes yet.
      </Typography>
    );
  }

  // Group episodes by season
  const groupedEpisodes: GroupedEpisodes = episodes.reduce((acc, episode) => {
    const season = episode.season;
    acc[season] = acc[season] || [];
    acc[season].push(episode);
    return acc;
  }, {} as GroupedEpisodes);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {Object.entries(groupedEpisodes).map(([season, episodesInSeason]) => (
        <Box key={season}>
          <Typography variant="h5" sx={{ marginBottom: '1rem', color: 'white' }}>
            Episodes from Season {season}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '2rem' }}>
            {episodesInSeason.map(episode => (
              <SingleEpisode key={`${episode.show_name}-${episode.season}-${episode.episode}`} episode={episode} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
