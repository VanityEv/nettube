import { useState } from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  Avatar,
  Box,
  FormControl,
  SelectChangeEvent,
  TextField,
  Radio,
  RadioGroup,
  FormLabel,
} from "@mui/material";
import useModal from "../hooks/useModal";
import UserInfoModal from "./UserInfoModal";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export type ProfileInfo = {
  uname: string;
  fullname: string;
  email: string;
  birthdate: string;
  subscriptiontype: number;
  confirmChange: (param: string, value: string) => Promise<void>;
};

export default function ProfileCard({
  uname,
  fullname,
  email,
  birthdate,
  subscriptiontype,
  confirmChange,
}: ProfileInfo) {
  const { isOpen, toggle } = useModal();
  const [selectedModal, setSelectedModal] = useState("");

  const [updateValue, setValue] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value as string);
  };

  const handleUserUpdate = () => {
    if (selectedModal === "fullname") {
      confirmChange(selectedModal, updateValue);
    }
  };

  const handleSelectedModal = (param: string) => {
    setSelectedModal(param);
    toggle();
  };

  return (
    <Card
      sx={{
        maxWidth: 275,
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Avatar>{uname.charAt(0)}</Avatar>
        </Box>
        <hr />
        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your username:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {uname}
        </Typography>
        <hr />
        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your real name:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {fullname}
        </Typography>
        <Button size="small" onClick={() => handleSelectedModal("fullname")}>
          Change name
        </Button>
        <hr />
        {selectedModal === "fullname" && (
          <UserInfoModal isOpen={isOpen} toggle={toggle}>
            <TextField
              required
              id="standard-required"
              label="Name"
              defaultValue=""
              placeholder="New name"
              variant="standard"
              onChange={handleChange}
            />
            <Button size="small" onClick={handleUserUpdate}>
              Confirm
            </Button>
          </UserInfoModal>
        )}

        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your email:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {email}
        </Typography>
        <Button size="small" onClick={() => handleSelectedModal("email")}>
          Change email
        </Button>
        <hr />
        {selectedModal === "email" && (
          <UserInfoModal isOpen={isOpen} toggle={toggle}>
            <TextField
              required
              id="standard-required"
              label="Email"
              placeholder="New email"
              variant="standard"
            />
            <Button size="small">Confirm</Button>
          </UserInfoModal>
        )}
        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your subscription type:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {subscriptiontype}
        </Typography>
        <Button
          size="small"
          onClick={() => handleSelectedModal("subscription")}
        >
          Change type of subscription
        </Button>
        <hr />
        {selectedModal === "subscription" && (
          <UserInfoModal isOpen={isOpen} toggle={toggle}>
            <FormControl fullWidth>
              <FormLabel id="radio-buttons-subscription-label">
                Choose subscription
              </FormLabel>
              <RadioGroup
                aria-labelledby="radio-buttons-subscription-label"
                defaultValue="standard"
                name="radio-buttons-subscription-label"
              >
                <FormControlLabel
                  value="standard"
                  control={<Radio />}
                  label="Standard"
                />
                <FormControlLabel
                  value="premium"
                  control={<Radio />}
                  label="Premium"
                />
                <FormControlLabel
                  value="ultimate"
                  control={<Radio />}
                  label="Ultimate"
                />
              </RadioGroup>
            </FormControl>
            <Typography sx={{ mb: 1 }} color="text.primary">
              Basic subscription plan: - - - Premium subscription plan: - - -
              Ultimate subscription plan: - - -
            </Typography>
            <Button size="small">Confirm</Button>
          </UserInfoModal>
        )}
        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your birthdate:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {birthdate}
        </Typography>
        <Button size="small" onClick={() => handleSelectedModal("birthdate")}>
          Change birthdate
        </Button>
        {selectedModal === "birthdate" && (
          <UserInfoModal isOpen={isOpen} toggle={toggle}>
            <TextField
              required
              id="standard-required"
              label="Birthdate"
              placeholder="New birthdate"
              variant="standard"
            />
            <Button size="small">Confirm</Button>
          </UserInfoModal>
        )}
      </CardContent>
      <CardActions></CardActions>
    </Card>
  );
}
