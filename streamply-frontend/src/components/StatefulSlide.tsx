import { Link } from 'react-router-dom';
import { toKebabCase } from '../helpers/convertToKebabCase';
import { ConditionalWrapper } from './ConditionalWrapper';
import { Poster } from './MainImage/Poster';
import { Video } from '../store/videos.types';
import { ButtonBase } from '@mui/material';

type StatefulSlideProps = {
  movie: Video;
  isActive: boolean;
  setActive: (title: string) => void;
};

export const StatefulSlide = ({ movie, isActive, setActive }: StatefulSlideProps) => (
  <ConditionalWrapper
    condition={true}
    wrapper={children => <ButtonBase onClick={() => setActive(movie.title)}>{children}</ButtonBase>}
  >
    <Poster posterURL={movie.thumbnail} title={movie.title} variant={'caption'} active={isActive} />
  </ConditionalWrapper>
);
