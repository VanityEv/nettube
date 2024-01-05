export type Review = {
  id: number;
  comment: string;
  grade: number;
  comment_date: string;
  show_id: number;
  user_id: number;
  username: string;
  title?: string;
};

export type ReviewState = {
  reviews: Review[];
};
