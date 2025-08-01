import { Link } from 'react-router-dom';
import { toKebabCase } from '../helpers/convertToKebabCase';
import { ConditionalWrapper } from './ConditionalWrapper';
import { CinematicPoster } from './MainImage/CinematicPoster';
import { Video } from '../types/videos.types';

type CinematicLinkedSlideProps = {
  movie: Video;
};

export const CinematicLinkedSlide = ({ movie }: CinematicLinkedSlideProps) => (
  <ConditionalWrapper
    condition={true}
    wrapper={children => (
      <Link style={{ textDecoration: 'none' }} to={`/video/${toKebabCase(movie.title)}`}>
        {children}
      </Link>
    )}
  >
    <CinematicPoster
      posterURL={movie.thumbnail}
      cinematicURL={movie.cinematic_thumbnail}
      title={movie.title}
      variant={'overlay'}
    />
  </ConditionalWrapper>
);
