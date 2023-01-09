import { Stack, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Signout() {
  const navigate = useNavigate();
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("account_type");
  const returnToSignIn = () => {
    navigate("/signin");
  };
  return (
    <>
      <Container
        component="main"
        maxWidth="desktop"
        sx={{ display: "flex", flexDirection: "column", mt: 15, mb: 15 }}
      >
        <Stack spacing={3}>
          <Typography sx={{ textAlign: "center", fontSize: "16px" }}>
            You were succesfully logged out.
          </Typography>
          <Button
            size="large"
            variant="contained"
            onClick={() => {
              returnToSignIn();
            }}
          >
            Continue
          </Button>
        </Stack>
      </Container>
    </>
  );
}

export default Signout;
