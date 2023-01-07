export type Video = {
  id: number;
  title: string;
  type: "film" | "series";
  genre: string;
  production_year: number;
  production_country: string;
  director: string;
  age_restriction: number;
  tags: string;
  descr: string;
  thumbnail: string;
  alt: string;
  grade: number;
  tier: string;
  reviews_count: number;
  link: string;
};

export type VideoState = {
  videos: Video[];
};
