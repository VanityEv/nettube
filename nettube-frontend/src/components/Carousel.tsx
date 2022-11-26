import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import { Navigation, Scrollbar, Autoplay } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import styled from "styled-components";

type CarouselProps = {
	links: string[];
};
/**
 * TODO: ustalić konwencję dodawania obrazków - rozdzielczość i obsługa rozmiarów obrazków w CSS
 */
const SwiperImage = styled("img")`
	width: 100vw;
	height: 25vh;
	object-fit: cover;
`;

const Carousel = ({ links }: CarouselProps) => {
	return (
		<Swiper
			modules={[Navigation, Scrollbar, Autoplay]}
			slidesPerView={1}
			navigation
			pagination={{ clickable: true }}
			scrollbar={{ draggable: true }}
			onSlideChange={() => console.log("slide change")}
			autoHeight
			autoplay={{ delay: 5000 }}
		>
			{links.map((itemLink, key) => (
				<SwiperSlide key={key}>
					<SwiperImage src={itemLink} alt="temporary" />
				</SwiperSlide>
			))}
		</Swiper>
	);
};

export default Carousel;
