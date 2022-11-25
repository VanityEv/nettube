import Flickity from "react-flickity-component";
import "../styles/flickity.css";
// https://github.com/yaodingyd/react-flickity-component

const flickityOptions = {
	initialIndex: 1,
};

type CarouselProps = {
  links:string[]
}

//NIE UMIEM PRZEKAZYWAĆ ŚCIEŻEK DO OBRAZKÓW HALP IM IN DANGER
const Carousel = ({links}: CarouselProps) => {
	return (
		<Flickity
			className={"carousel"} // default ''
			elementType={"div"} // default 'div'
			options={flickityOptions} // takes flickity options {}
			disableImagesLoaded={false} // default false
			reloadOnUpdate // default false
			static // default false
		>
			{links.map((link) => (
				<img src={link} />
			))}
		</Flickity>
	);
}

export default Carousel;