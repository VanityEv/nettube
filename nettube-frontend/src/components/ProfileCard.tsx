import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  Avatar,
  Box,
  FormControl,
  TextField,
  Radio,
  RadioGroup,
  FormLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import useModal from '../hooks/useModal';
import FormModal from './FormModal';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import useHttp from '../hooks/useHttp';
import { DesktopDatePicker, LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { EMAIL_REGEX } from '../constants';

//SET GLOBAL time_zone = '+0:00'; w bazie danych - fix do cofania birthdate o godzinę - z jakiegoś powodu React konwertuje to co dostaje z bazy na timezone 0:00

export type ProfileInfo = {
  uname: string;
  fullname: string;
  email: string;
  birthdate: string;
  subscriptiontype: number;
  confirmChange: (param: string, value: string) => Promise<void>;
};

const SUBSCRIPTION_ID_TO_SUBSCRIPTION_TYPE = ['Standard', 'Premium', 'Ultimate'];

export default function ProfileCard({
  uname,
  fullname,
  email,
  birthdate,
  subscriptiontype,
  confirmChange,
}: ProfileInfo) {
  const [alreadyExists, setAlreadyExists] = useState<boolean | null>(null);
  const [alreadyInUse, setAlreadyInUse] = useState({
    inUse: false,
    incorrect: false,
  });
  const { sendRequest } = useHttp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));

  const occurencyCheck = async (param: string, value: string) => {
    const response = await sendRequest({
      method: 'POST',
      body: {
        param: param,
        value: value,
      },
      endpoint: '/user/checkOccurency',
    });
    if (response.result === 'NOT EXISTS') {
      setAlreadyExists(false);
    } else {
      setAlreadyExists(true);
    }
  };

  const todayDate = dayjs();
  const { isOpen, toggle } = useModal();
  const [selectedModal, setSelectedModal] = useState('');

  const [updateValue, setValue] = useState('');
  const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs('2000-01-01', 'Europe/Warsaw'));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value as string);
  };
  const handleDateChange = (newDateValue: Dayjs | null) => {
    setDateValue(newDateValue);
  };

  const handleUserUpdate = () => {
    if (selectedModal === 'email') {
      occurencyCheck('email', updateValue);
    } else if (selectedModal === 'birthdate') {
      let newBirthdate = dateValue?.format('YYYY-MM-DD');
      confirmChange(selectedModal, newBirthdate as string);
    } else {
      confirmChange(selectedModal, updateValue);
    }
  };

  const handleSelectedModal = (param: string) => {
    setSelectedModal(param);
    toggle();
    setAlreadyInUse({ inUse: false, incorrect: false });
  };

  useEffect(() => {
    if (alreadyExists !== null && selectedModal === 'email') {
      if (alreadyExists) {
        setAlreadyInUse({ inUse: true, incorrect: false });
      } else if (!EMAIL_REGEX.test(updateValue)) {
        setAlreadyInUse({ inUse: false, incorrect: true });
      } else {
        confirmChange(selectedModal, updateValue);
      }
      setAlreadyExists(null);
    }
  }, [alreadyExists]);
  const username = localStorage.getItem("username");
  const avatarLetter = username?.charAt(0);

  return (
    <Card
      sx={{
        maxWidth: 275,
        flexGrow: 1,
        display: 'flex',
        alignItems: 'top',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Avatar>{avatarLetter}</Avatar>
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
        <Button size="small" onClick={() => handleSelectedModal('fullname')}>
          Change name
        </Button>
        <hr />
        {selectedModal === 'fullname' && (
          <FormModal isOpen={isOpen} toggle={toggle}>
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
          </FormModal>
        )}

        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your email:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {email}
        </Typography>
        <Button size="small" onClick={() => handleSelectedModal('email')}>
          Change email
        </Button>
        <hr />
        {selectedModal === 'email' && (
          <FormModal isOpen={isOpen} toggle={toggle}>
            <TextField
              error={alreadyInUse.inUse || alreadyInUse.incorrect}
              required
              id="standard-required"
              label="Email"
              placeholder="New email"
              variant="standard"
              onChange={handleChange}
              helperText={
                (alreadyInUse.inUse && 'This email is already in use!') ||
                (alreadyInUse.incorrect && 'This is not a valid email!')
              }
            />
            <Button size="small" onClick={handleUserUpdate}>
              Confirm
            </Button>
          </FormModal>
        )}
        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your subscription type:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {SUBSCRIPTION_ID_TO_SUBSCRIPTION_TYPE[subscriptiontype]}
        </Typography>
        <Button size="small" onClick={() => handleSelectedModal('subscription')}>
          Change type of subscription
        </Button>
        <hr />
        {selectedModal === 'subscription' && (
          <FormModal isOpen={isOpen} toggle={toggle}>
            <FormControl fullWidth>
              <FormLabel id="radio-buttons-subscription-label">Choose subscription</FormLabel>
              <RadioGroup
                aria-labelledby="radio-buttons-subscription-label"
                defaultValue="standard"
                name="radio-buttons-subscription-label"
              >
                <FormControlLabel value="standard" control={<Radio />} label="Standard" />
                <FormControlLabel value="premium" control={<Radio />} label="Premium" />
                <FormControlLabel value="ultimate" control={<Radio />} label="Ultimate" />
              </RadioGroup>
            </FormControl>
            <Typography sx={{ mb: 1 }} color="text.primary">
              Basic subscription plan: - - - Premium subscription plan: - - - Ultimate subscription plan: - - -
            </Typography>
            <Button size="small">Confirm</Button>
          </FormModal>
        )}
        <Typography sx={{ mb: 1 }} color="text.secondary">
          Your birthdate:
        </Typography>
        <Typography sx={{ mb: 1 }} color="text.primary">
          {birthdate.toString().substring(0, 10)}
        </Typography>
        <Button size="small" onClick={() => handleSelectedModal('birthdate')}>
          Change birthdate
        </Button>
        {selectedModal === 'birthdate' && (
          <FormModal isOpen={isOpen} toggle={toggle}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {!isMobile ? (
                <DesktopDatePicker
                  aria-label="birthdate-field"
                  label="Choose new birthdate"
                  inputFormat="YYYY/DD/MM"
                  value={dateValue}
                  maxDate={todayDate}
                  onChange={handleDateChange}
                  PopperProps={{ sx: { zIndex: 9999 } }}
                  renderInput={params => <TextField name="birthdate" {...params} />}
                />
              ) : (
                <MobileDatePicker
                  aria-label="birthdate-field"
                  label="Choose new birthdate"
                  inputFormat="YYYY/DD/MM"
                  value={dateValue}
                  maxDate={todayDate}
                  onChange={handleDateChange}
                  DialogProps={{ sx: { zIndex: 9999 } }}
                  renderInput={params => <TextField name="birthdate" {...params} />}
                />
              )}
            </LocalizationProvider>
            <Button size="small" onClick={handleUserUpdate}>
              Confirm
            </Button>
          </FormModal>
        )}
      </CardContent>
      <CardActions></CardActions>
    </Card>
  );
}
