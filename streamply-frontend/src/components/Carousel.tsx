import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import { Navigation, Scrollbar, Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import styled from 'styled-components';

type CarouselProps = {
  links: string[];
};
/**
 * TODO: ustalić konwencję dodawania obrazków - rozdzielczość i obsługa rozmiarów obrazków w CSS
 */
const SwiperImage = styled('div')`
  width: 100vw;
  height: calc(100vh - 4.5rem);
  background-size: cover;
`;

const Carousel = ({ links }: CarouselProps) => {
  return (
    <Swiper
      modules={[Navigation, Scrollbar, Autoplay]}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      scrollbar={{ draggable: true }}
      autoHeight
      autoplay={{ delay: 5000 }}
    >
      {links.map((itemLink, key) => (
        <SwiperSlide key={key}>
          <SwiperImage
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75)), url(${itemLink})`,
            }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default Carousel;
