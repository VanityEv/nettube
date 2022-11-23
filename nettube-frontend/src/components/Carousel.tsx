import Flickity from 'react-flickity-component'
import { SelectedVideos } from '../App'
import '../styles/flickity.css'
// https://github.com/yaodingyd/react-flickity-component


const flickityOptions = {
    initialIndex: 1
}
//NIE UMIEM PRZEKAZYWAĆ ŚCIEŻEK DO OBRAZKÓW HALP IM IN DANGER
export default function Carousel({videos}: SelectedVideos) {
  return (
    <Flickity
      className={'carousel'} // default ''
      elementType={'div'} // default 'div'
      options={flickityOptions} // takes flickity options {}
      disableImagesLoaded={false} // default false
      reloadOnUpdate // default false
      static // default false
    >
    {
    videos.map(video=> <img src={video}/>)
    }
    </Flickity>
  )
}