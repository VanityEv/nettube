import * as React from "react";
import { Box, Modal, Fade, Typography } from "@mui/material";
import { PlayCircle } from "@mui/icons-material";
import { TestCardProps } from "../pages/HomePage";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

//style nie działają dla img :( (linia 41)
//zgaduje że dlatego że modal ma pozycje absolute ale już nie mam siły dzisiaj tego poprawiać xD

export default function TransitionsModal({ title, alt, description, thumbnail }: TestCardProps) {
	const [open, setOpen] = React.useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));

	const style = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: isMobile ? "90%" : "70%",
		bgcolor: "background.paper",
		border: "2px solid #000",
		boxShadow: 24,
		p: isMobile ? 2 : 4,
		objectFit: "contain",
	};

	return (
		<>
			<PlayCircle onClick={handleOpen} />
			<Modal
				aria-labelledby="transition-modal-title"
				aria-describedby="transition-modal-description"
				open={open}
				onClose={handleClose}
				closeAfterTransition
			>
				<Fade in={open}>
					<Box sx={style}>
						<picture>
							<img src={thumbnail} style={{ width: "100%" }} alt="temporary alt" />
						</picture>
						<Typography id="transition-modal-title" variant="h3" component="h2">
							{title}
						</Typography>
						<Typography id="transition-modal-description" sx={{ mt: 2 }}>
							{description}
						</Typography>
					</Box>
				</Fade>
			</Modal>
		</>
	);
}
