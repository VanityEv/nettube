export type Video = {
  id: number;
  title: string;
  type: 'film' | 'series';
  seasons: number;
  genre: string;
  production_year: number;
  production_country: string;
  director: string;
  tags: string;
  descr: string;
  thumbnail: string;
  alt: string;
  video_length: number;
  grade: number;
  tier: string;
  reviews_count: number;
  link: string;
  views: number;
  blocked_reviews: number;
};

export type ProgressedVideo = Pick<Video,'id' | 'title' | 'type' | 'thumbnail' | 'video_length'> & {
  season: number;
  episode: number | null;
  time_watched: number;
}

export type Episode = {
  show_id: number;
  season: number;
  episode: number;
  episode_name: string;
  description: string;
  thumbnail: string;
  show_name: string;
};
