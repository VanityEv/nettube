import { useState } from "react";
import { Box, Modal, Fade, Typography } from "@mui/material";
import { PlayCircle } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MediaCardProps } from "./MediaCard";

//style nie działają dla img :( (linia 41)
//zgaduje że dlatego że modal ma pozycje absolute ale już nie mam siły dzisiaj tego poprawiać xD

export default function TransitionsModal({ title, alt, description, thumbnail }: MediaCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const handleIsOpen = () => setIsOpen(true);
	const handleClose = () => setIsOpen(false);

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("desktop"));

	const style = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: isMobile ? "90%" : "70%",
		height: isMobile ? "90%" : "70%",
		bgcolor: "background.paper",
		border: "2px solid #000",
		boxShadow: 24,
		p: isMobile ? 2 : 4,
		objectFit: "contain",
		display: "flex",
		flexDirection: isMobile ? "column" : "row",
	};

	return (
		<>
			<PlayCircle onClick={handleIsOpen} />
			<Modal
				aria-labelledby="transition-modal-title"
				aria-describedby="transition-modal-description"
				open={isOpen}
				onClose={handleClose}
				closeAfterTransition
			>
				<Fade in={isOpen}>
					<Box sx={style}>
						<img
							style={{ flexGrow: 1, height: isMobile ? "50%" : "auto" }}
							src={thumbnail}
							alt={alt}
						/>
						<Box
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								flexGrow: 1,
								padding: "1rem",
								overflowY: "auto",
							}}
						>
							<Typography
								id="transition-modal-title"
								variant="h3"
								component="h2"
								textAlign="center"
							>
								{title}
							</Typography>
							<Typography
								id="transition-modal-description"
								sx={{ mt: 2 }}
								textAlign="center"
							>
								{description}
							</Typography>
						</Box>
					</Box>
				</Fade>
			</Modal>
		</>
	);
}
