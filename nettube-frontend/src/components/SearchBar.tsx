import { styled, useTheme } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import { useMediaQuery } from "@mui/material";

const Search = styled("div")(({ theme }) => ({
	[theme.breakpoints.up("desktop")]: {
		marginLeft: theme.spacing(3),
		width: "auto",
	},
	display: "flex",
	alignItems: "center",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
	height: "2.5rem",
	margin: "1rem",
	position: "absolute",
	pointerEvents: "none",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	zIndex: theme.zIndex.tooltip,
	[theme.breakpoints.down("desktop")]: {
		color: theme.palette.common.white,
	},
	[theme.breakpoints.up("desktop")]: {
		color: theme.palette.common.black,
	},
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
	textAlign: "center",
	borderRadius: theme.radius.sm,
	padding: "10px",
	backgroundColor: theme.palette.common.white,
	color: theme.palette.common.black,
	width: "100%",
	"& .MuiInputBase-input": {
		padding: theme.spacing(1, 1, 1, 0),
		// vertical padding + font size from searchIcon
		marginLeft: `calc(1em + ${theme.spacing(4)})`,
		transition: theme.transitions.create("width"),
		width: "100%",
		[theme.breakpoints.up("desktop")]: {
			width: "20ch",
		},
	},
}));

/**
 * TODO: Dodać warianty mobile i desktop - w mobile widoczna sama lupa, po której kliknięciu
 * pojawia się search na całym navbarze.
 * W desktop doszlifować wygląd - ustalić jakie radiusy chcemy
 */
function SearchBar() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));
	return (
		<Search>
			<SearchIconWrapper>
				<SearchIcon />
			</SearchIconWrapper>
			{!isMobile && (
				<StyledInputBase
					placeholder="Search videos..."
					inputProps={{ "aria-label": "search" }}
				/>
			)}
		</Search>
	);
}
export default SearchBar;
