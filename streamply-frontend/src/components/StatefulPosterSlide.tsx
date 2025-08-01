import { ConditionalWrapper } from './ConditionalWrapper';
import { Poster } from './MainImage/Poster';
import { Video } from '../types/videos.types';
import { ButtonBase } from '@mui/material';

type StatefulPosterSlideProps = {
  movie: Video;
  isActive: boolean;
  setActive: (title: string) => void;
};

export const StatefulPosterSlide = ({ movie, isActive, setActive }: StatefulPosterSlideProps) => (
  <ConditionalWrapper
    condition={true}
    wrapper={children => <ButtonBase onClick={() => setActive(movie.title)}>{children}</ButtonBase>}
  >
    <Poster posterURL={movie.thumbnail} title={movie.title} variant={'caption'} active={isActive} />
  </ConditionalWrapper>
);
