import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Favorite from "@mui/icons-material/Favorite";
import IconButton from "@mui/material/IconButton";
import TransitionsModal from "./TransitionsModal";
import { useMediaQuery, useTheme } from "@mui/material";

export type MediaCardProps = {
	title: string;
	alt: string;
	description: string;
	thumbnail: string;
};

export default function MediaCard({ title, alt, description, thumbnail }: MediaCardProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));

	return (
		<Card
			sx={{ maxWidth: 345, display: "flex", flexDirection: "column", alignItems: "center" }}
		>
			<CardMedia component="img" image={thumbnail} alt={alt} sx={{ objectFit: "contain" }} />
			<CardContent>
				<Typography gutterBottom variant="h5" component="div" textAlign="center">
					{title}
				</Typography>
				{!isMobile && (
					<Typography variant="body2" color="text.secondary">
						{description}
					</Typography>
				)}
			</CardContent>
			<CardActions>
				<IconButton aria-label="add to favorites">
					<Favorite />
				</IconButton>
				<IconButton aria-label="play">
					<TransitionsModal
						title={title}
						alt={alt}
						description={description}
						thumbnail={thumbnail}
					/>
				</IconButton>
			</CardActions>
		</Card>
	);
}
