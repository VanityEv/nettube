import { Box } from "@mui/material";
import ProfileCard, { ProfileInfo } from "../components/ProfileCard";
import UserProfileAccordion from "../components/UserProfileAccordion";

const testUser: ProfileInfo = {
	uname: "Tester",
	rname: "Tester Testowy",
	email: "test@test",
	birthdate: "12.01.1999",
	subscriptiontype: "basic",
};

function Profile() {
	return (
		<>
			<Box sx={{ display: "flex", flexDirection: "row" }}>
				<ProfileCard {...testUser} />
				<UserProfileAccordion />
			</Box>
		</>
	);
}
export default Profile;
