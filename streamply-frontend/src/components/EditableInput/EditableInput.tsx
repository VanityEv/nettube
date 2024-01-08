import { CancelOutlined, Done, Edit } from '@mui/icons-material';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { HTMLInputTypeAttribute, useContext, useState } from 'react';
import { api } from '../../constants';
import { useUserStore } from '../../state/userStore';
import { getCookie } from 'typescript-cookie';
import { SnackbarContext } from '../../App';

type UpdateResponse = {
  result: string;
};

type OccurencyCheckResult = {
  result: 'NOT_EXISTS' | 'ALREADY_EXISTS';
};

type EditableInputProps = {
  param: string;
  value?: string | number | Dayjs | null;
  type?: HTMLInputTypeAttribute;
  onSuccess: () => void;
};

export const EditableInput = ({ param, value, type, onSuccess }: EditableInputProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const { username } = useUserStore();
  const { showSnackbar } = useContext(SnackbarContext);

  const handleInputValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedValue(event.target.value);
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    setEditedValue(newDate);
  };

  const handleCancel = () => {
    setEditedValue(value);
    setEditMode(prev => !prev);
  };

  //handles update for certain user field
  const handleAccept = async () => {
    try {
      let valueToUpdate: typeof value | Date = editedValue;
      if (dayjs.isDayjs(editedValue)) {
        valueToUpdate = editedValue.format('YYYY-MM-DD');
      }
      if (param === 'username' || param === 'email') {
        const occurencyCheckResult = await axios.post<OccurencyCheckResult>(
          `${api}/user/checkOccurency`,
          { param: param, value: valueToUpdate },
          { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
        );
        if (occurencyCheckResult.data.result === 'ALREADY_EXISTS') {
          showSnackbar('This email or password are already in use!', 'error');
          return;
        }
      }
      const response = await axios.post<UpdateResponse>(
        `${api}/user/updateUser`,
        {
          param: param,
          value: valueToUpdate,
          username: username,
        },
        { headers: { Authorization: `Bearer ${getCookie('userToken')}` } }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar('Updated Information', 'success');
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    }
    setEditMode(prev => !prev);
  };

  return (
    <>
      {editMode ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {type == 'date' ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                views={['year', 'month', 'day']}
                format="YYYY-MM-DD"
                maxDate={dayjs()}
                minDate={dayjs('1900-01-01')}
                value={dayjs(editedValue)}
                onChange={handleDateChange}
                sx={{
                  input: { color: 'white', px: 2, py: 1 },
                  width: {
                    mobile: '75%',
                    desktop: '80%',
                  },
                  '& .MuiOutlinedInput-root:hover': {
                    '& > fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    '& > fieldset': {
                      borderColor: '#e51445',
                    },
                  },
                }}
                slotProps={{
                  inputAdornment: {
                    sx: {
                      '.MuiSvgIcon-root': {
                        color: 'white',
                      },
                    },
                  },
                  layout: {
                    sx: {
                      '.MuiDateCalendar-root': {
                        color: '#e51445',
                        borderRadius: '40px',
                        border: '1px solid #e51445',
                        mt: 1,
                      },
                      '.MuiPickersDay-root': {
                        color: 'white',
                      },
                      '.MuiPickersDay-root:focus': {
                        backgroundColor: '#e51445',
                      },
                      '.MuiPickersLayout-root': {
                        p: 2,
                      },
                      '.Mui-selected:hover': {
                        backgroundColor: '#e51445',
                      },
                      '.Mui-selected': {
                        backgroundColor: '#e51445',
                      },
                      '.MuiSvgIcon-root': {
                        color: 'white',
                      },
                      '.MuiTypography-root': {
                        color: 'white',
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          ) : (
            <TextField
              onChange={handleInputValueChange}
              sx={{
                input: { color: 'white', px: 2, py: 1 },
                width: {
                  mobile: '75%',
                  desktop: '80%',
                  '& .MuiOutlinedInput-root:hover': {
                    '& > fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    '& > fieldset': {
                      borderColor: '#e51445',
                    },
                  },
                },
              }}
              type={type ? type : 'text'}
              value={editedValue}
            />
          )}
          <IconButton onClick={handleAccept}>
            <Done sx={{ color: 'lime' }} />
          </IconButton>
          <IconButton onClick={handleCancel}>
            <CancelOutlined sx={{ color: 'red' }} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '18px' }}>{value?.toString()}</Typography>
          <IconButton onClick={() => setEditMode(prev => !prev)}>
            <Edit sx={{ color: 'primary.300' }} />
          </IconButton>
        </Box>
      )}
    </>
  );
};
