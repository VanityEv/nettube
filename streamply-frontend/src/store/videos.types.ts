export type Video = {
  id: number;
  title: string;
  type: 'film' | 'series';
  genre: string;
  production_year: number;
  production_country: string;
  director: string;
  tags: string;
  descr: string;
  thumbnail: string;
  alt: string;
  grade: number;
  tier: string;
  reviews_count: number;
  link: string;
  blocked_reviews: number;
};

export type VideoState = {
  videos: Video[];
};
