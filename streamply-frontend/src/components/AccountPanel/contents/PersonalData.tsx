import { Avatar, Box, Divider, IconButton, Typography } from '@mui/material';
import { useFetchUser } from '../../../hooks/useGetUserInfo';
import { EditableInput } from '../../EditableInput/EditableInput';
import { useUserStore } from '../../../state/userStore';
import { useRef } from 'react';
import axios from 'axios';
import { SERVER_ADDR, SERVER_PORT } from '../../../constants';
import { getCookie } from 'typescript-cookie';

export const PersonalData = () => {
  const { username } = useUserStore();
  const { userData, isLoading, isError, error, refetch } = useFetchUser(username);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <Typography>'Loading...'</Typography>;
  }
  if (isError) {
    return <Typography>{error?.message}</Typography>;
  }

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        await axios.post(`${SERVER_ADDR}:${SERVER_PORT}/user/uploadAvatar/${username}`, formData, {
          headers: { Authorization: `Bearer ${getCookie('userToken')}` },
        });

        // Refetch user data to get updated avatar URL
        refetch();
      } catch (error) {
        console.error('Error uploading avatar:', error);
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: { mobile: 'column', desktop: 'row' },
        backgroundColor: 'secondary.400',
        color: 'white',
        gap: 2,
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Typography variant="h6">Personal Information</Typography>
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            '&>div': { my: 1 },
            '&>div>p': { width: { mobile: '35%', desktop: '20%' } },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Typography fontWeight={600}>Username:</Typography>
            <EditableInput param="username" value={username} onSuccess={refetch} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Birth date: </Typography>
            <EditableInput
              param="birthdate"
              type="date"
              value={userData?.user.birthdate.substring(0, 10)}
              onSuccess={refetch}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Full name:</Typography>
            <EditableInput param="fullname" value={userData?.user.fullname} onSuccess={refetch} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Email: </Typography>
            <EditableInput param="email" value={userData?.user.email} onSuccess={refetch} />
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h6">Avatar</Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <IconButton onClick={openFilePicker}>
            <Avatar
              sx={{ width: '8rem', height: '8rem', backgroundColor: 'primary.200', color: 'secondary.300' }}
              src={`${SERVER_ADDR}:${SERVER_PORT}${userData?.avatarUrl}`}
            />
            <input type="file" ref={fileInputRef} accept="image/*" hidden onChange={handleAvatarUpload} />
          </IconButton>
          <Typography sx={{ fontWeight: '600', width: '200px', textAlign: 'center' }}>
            To change your photo click on your current avatar and choose file. NOTE: Available formats are: .JPG, .PNG,
            .JPEG
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
