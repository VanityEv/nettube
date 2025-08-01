import { ConditionalWrapper } from './ConditionalWrapper';
import { CinematicPoster } from './MainImage/CinematicPoster';
import { Video } from '../types/videos.types';
import { ButtonBase } from '@mui/material';

type StatefulCinematicSlideProps = {
  movie: Video;
  isActive: boolean;
  setActive: (title: string) => void;
};

export const StatefulCinematicSlide = ({ movie, isActive, setActive }: StatefulCinematicSlideProps) => (
  <ConditionalWrapper
    condition={true}
    wrapper={children => <ButtonBase onClick={() => setActive(movie.title)}>{children}</ButtonBase>}
  >
    <CinematicPoster
      posterURL={movie.thumbnail}
      cinematicURL={movie.cinematic_thumbnail}
      title={movie.title}
      variant={'caption'}
      active={isActive}
    />
  </ConditionalWrapper>
);
