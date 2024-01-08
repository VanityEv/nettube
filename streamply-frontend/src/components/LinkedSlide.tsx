import { Link } from 'react-router-dom';
import { toKebabCase } from '../helpers/convertToKebabCase';
import { ConditionalWrapper } from './ConditionalWrapper';
import { Poster } from './MainImage/Poster';
import { Video } from '../types/videos.types';

type LinkedSlideProps = {
  movie: Video;
};

export const LinkedSlide = ({ movie }: LinkedSlideProps) => (
  <ConditionalWrapper
    condition={true}
    wrapper={children => (
      <Link
        style={{ textDecoration: 'none' }}
        to={`/${movie.type === 'film' ? 'movies' : 'series'}/${toKebabCase(movie.title)}`}
      >
        {children}
      </Link>
    )}
  >
    <Poster posterURL={movie.thumbnail} title={movie.title} variant={'overlay'} />
  </ConditionalWrapper>
);
