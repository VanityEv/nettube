import { createTheme } from "@mui/material";

declare module "@mui/material/styles" {
	interface BreakpointOverrides {
		xs: false;
		sm: false;
		md: false;
		lg: false;
		xl: false;
		mobile: true;
		desktop: true;
	}
	interface Theme {
		radius: {
			sm: number;
			md: number;
			lg: number;
			circle: string;
		};
	}
	interface ThemeOptions {
		radius?: {
			sm: number;
			md: number;
			lg: number;
			circle: string;
		};
	}
}

const theme = createTheme({
	breakpoints: {
		values: {
			mobile: 0,
			desktop: 1024,
		},
	},
	radius: {
		sm: 4,
		md: 8,
		lg: 16,
		circle: "50%",
	},
});

export default theme;
