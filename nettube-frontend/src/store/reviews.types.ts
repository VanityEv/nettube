export type Review = {
	id: number;
	comment: string;
	grade: number;
	show_id: number;
	user_id: number;
};

export type ReviewState = {
	reviews: Review[];
};
