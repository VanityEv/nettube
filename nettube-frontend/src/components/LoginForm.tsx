import { useState } from "react";
import { Link, Box, Typography, Container, CssBaseline, TextField, Button } from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { Stack } from "@mui/material";
import { useAppDispatch } from "../hooks/reduxHooks";
import { userLogin } from "../store/user-actions";
import { UserCredentials } from "../store/user.types";
import { useNavigate } from "react-router-dom";
/**
 * TODO: Wywalenie Bad Request z logowania za pomocą błędnych danych
 * TODO: Dodanie jakiegoś poczekania na zakończenie dispatcha?
 * Wywala error że usera nie ma w bazie za pierwszym kliknięciem sign in (userToken ma wartość undefined), za drugim klikiem przechodzi normalnie
 *
 */

function SignIn() {
	const [isUser, setIsUser] = useState(true);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const userCredentials: UserCredentials = {
			username: data.get("username") as string,
			password: data.get("password") as string,
		};
		dispatch(userLogin(userCredentials));
		localStorage.getItem("userToken") === null ||
		localStorage.getItem("userToken") === "undefined"
			? setIsUser(false)
			: navigate("/");
	};
	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="desktop">
				<CssBaseline />
				<Box
					sx={{
						marginTop: 8,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<img src="logo.svg" width="150px" height="auto" />
					<Typography component="h1" variant="h5">
						Sign in
					</Typography>
					<Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3, pb: 2 }}>
						<Stack spacing={3}>
							<TextField
								aria-label="username-field"
								name="username"
								required
								fullWidth
								id="username"
								label="Username"
								autoFocus
							/>
							<TextField
								aria-label="password-field"
								required
								fullWidth
								name="password"
								label="Password"
								type="password"
								id="password"
								autoComplete="new-password"
							/>
							<Button
								type="submit"
								fullWidth
								variant="contained"
								sx={{ mt: 3, mb: 2 }}
							>
								Sign In
							</Button>
							<Link href="/Rescue" variant="body1">
								Forgot password?
							</Link>
							<Link href="/Register" variant="body1">
								Not a member? Register now!
							</Link>
						</Stack>
					</Box>
				</Box>
			</Container>
		</ThemeProvider>
	);
}
export default SignIn;
