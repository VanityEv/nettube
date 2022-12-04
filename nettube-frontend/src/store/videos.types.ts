export type Video = {
	id: number;
	title: string;
	type: "film" | "series";
	genre: string;
	production_year: number;
	production_country: string;
	age_restriction: number;
	descr: string;
	thumbnail: string;
	alt: string;
	grade: number;
	tier: string;
	reviews_count: number;
};

export type VideoState = {
	videos: Video[];
};
