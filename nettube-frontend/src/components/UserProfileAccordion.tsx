import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";

function UserProfileAccordion() {
	return (
		<Box sx={{ flexGrow: 3 }}>
			<Accordion defaultExpanded>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel1a-content"
					id="panel1a-header"
				>
					<Typography>Liked shows</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid2>
						<Grid2 mobile={12} desktop={12} sx={{ mx: "auto", width: 200 }}>
							<Typography>Test</Typography>
						</Grid2>
					</Grid2>
				</AccordionDetails>
			</Accordion>
			<Accordion>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					aria-controls="panel2a-content"
					id="panel2a-header"
				>
					<Typography>Comments & Reviews</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid2>
						<Grid2 mobile={12} desktop={12}>
							<Typography>Test</Typography>
						</Grid2>
						<Grid2 mobile={12} desktop={12}>
							<Typography>Test</Typography>
						</Grid2>
					</Grid2>
				</AccordionDetails>
			</Accordion>
		</Box>
	);
}
export default UserProfileAccordion;
