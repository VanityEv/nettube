import Flickity from 'react-flickity-component'
import { SelectedVideos } from '../App'
import '../styles/flickity.css'
// https://github.com/yaodingyd/react-flickity-component


const flickityOptions = {
    initialIndex: 1
}
//NIE UMIEM PRZEKAZYWAĆ ŚCIEŻEK DO OBRAZKÓW HELP ME KURWA
export default function Carousel({vid1src,vid2src,vid3src,vid4src}: SelectedVideos) {
  return (
    <Flickity
      className={'carousel'} // default ''
      elementType={'div'} // default 'div'
      options={flickityOptions} // takes flickity options {}
      disableImagesLoaded={false} // default false
      reloadOnUpdate // default false
      static // default false
    >
    <img src="https://placeimg.com/640/480/animals" />
    <img src="https://placeimg.com/640/480/nature" />
    <img src="https://placeimg.com/640/480/architecture" />
    </Flickity>
  )
}