import { Avatar, Box, Divider, Typography } from '@mui/material';
import { useFetchUser } from '../../../hooks/useGetUserInfo';
import { EditableInput } from '../../EditableInput/EditableInput';
import { useUserStore } from '../../../state/userStore';

export const PersonalData = () => {
  const { username } = useUserStore();
  const { data, isLoading, isError, error } = useFetchUser(username);

  if (isLoading) {
    return <Typography>'Loading...'</Typography>;
  }
  if (isError) {
    return <Typography>{error?.message}</Typography>;
  }

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
        <Box sx={{ '&>div': { my: 1 }, '&>div>p': { width: { mobile: '35%', desktop: '20%' } } }}>
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
            <EditableInput value={data?.username} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Birth date: </Typography>
            <EditableInput value={data?.birthdate.substring(0, 10)} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Full name:</Typography>
            <EditableInput value={data?.fullname} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Email: </Typography>
            <EditableInput value={data?.email} />
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h6">Avatar</Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Avatar sx={{ width: '8rem', height: '8rem', backgroundColor: 'primary.200', color: 'secondary.300' }} />
          <Typography sx={{ fontWeight: '600', width: '200px', textAlign: 'center' }}>
            To change your photo drag & drop it on your current avatar
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
