export type Review = {
	id: number;
	comment: string;
	grade: number;
	show_id: number;
	user_id: number;
	username: string;
};

export type ReviewState = {
	reviews: Review[];
};
