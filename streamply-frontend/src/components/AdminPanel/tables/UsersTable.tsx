import { ArrowCircleDown, ArrowCircleUp, HighlightOff, Search } from '@mui/icons-material';
import {
  IconButton,
  InputAdornment,
  InputBase,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useContext, useState } from 'react';
import { filterDataFromKeys } from '../../../helpers/filterDataFromKeys';
import { UserEntry } from '../../../types/user.types';
import axios from 'axios';
import { SignalResponse } from '../../../types/response.types';
import { api } from '../../../constants';
import { SnackbarContext } from '../../../App';
import { getCookie } from 'typescript-cookie';

export const UsersTable = ({ users, onDelete, refetch }: { users: UserEntry[]; onDelete: (id: number) => void, refetch: () => void }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const filterableFields: string[] = ['username', 'email'];
  const rowsPerPage = 5;
  const indexedPage = currentPage - 1;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  const { showSnackbar } = useContext(SnackbarContext);

  const filteredData = filterDataFromKeys(users, filterableFields as (keyof UserEntry)[], filter);

  // Paginate filtered data
  const pagedData = filteredData.slice(indexedPage * rowsPerPage, indexedPage * rowsPerPage + rowsPerPage);

  // Check how many pages there are
  const getPageCount = () => Math.ceil(filteredData.length / rowsPerPage);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setCurrentPage(newPage);
  };

  const onDemote = async (username: string) => {
    try {
      const response = await axios.post<SignalResponse>(
        `${api}/user/demoteModerator`,
        { username: username },
        {
          headers: {
            Authorization: `Bearer ${getCookie('userToken')}`,
          },
        }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar('User demoted', 'info');
        refetch();
      }
    } catch (error) {
      console.log(error)
      showSnackbar('Error while demoting user', 'error');
    }
  };

  const onPromote = async (username: string) => {
    try {
      const response = await axios.post<SignalResponse>(
        `${api}/user/promoteToModerator`,
        { username: username },
        {
          headers: {
            Authorization: `Bearer ${getCookie('userToken')}`,
          },
        }
      );
      if (response.data.result === 'SUCCESS') {
        showSnackbar('User promoted', 'info');
        refetch();
      }
    } catch (error) {
      console.log(error)
      showSnackbar('Error while promoting user', 'error');
    }
  };

  return (
    <TableContainer component={'div'}>
      <InputBase
        placeholder="Search users..."
        sx={{
          backgroundColor: 'transparent',
          borderRadius: '60px',
          color: 'white',
          border: '1px solid #e51445',
          py: 1,
          pl: '12px',
          m: 2,
        }}
        startAdornment={
          <InputAdornment position="start">
            <Search color="primary" />
          </InputAdornment>
        }
        value={filter}
        onChange={handleFilterChange}
      />
      <Table aria-label="users-table">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.400', '&>th': { color: 'white' } }}>
            <TableCell sx={{ fontWeight: 'bold', position: 'sticky' }}>Username</TableCell>
            <TableCell align="left" sx={{ fontWeight: 'bold', position: 'sticky' }}>
              Email
            </TableCell>
            <TableCell align="left" sx={{ fontWeight: 'bold', position: 'sticky' }}>
              Last login date&nbsp;
            </TableCell>
            <TableCell align="left" sx={{ fontWeight: 'bold', position: 'sticky' }}>
              Action&nbsp;
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ borderBottom: 0 }}>
          {pagedData.map(user => (
            <TableRow key={user.id} sx={{ '&>th,td': { color: 'white' } }}>
              <TableCell component="th" scope="row">
                {user.username}
              </TableCell>
              <TableCell align="left">{user.email}</TableCell>
              <TableCell align="left">{user.last_login.substring(0, 10)}</TableCell>
              <TableCell align="left">
                {user.account_type === 3 ? (
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    Admin Account
                  </Typography>
                ) : (
                  <IconButton
                    disableRipple
                    sx={{ fontSize: '12px', display: 'flex', gap: 1 }}
                    onClick={() => {
                      if (user.account_type === 2) {
                        onDemote(user.username);
                      } else {
                        onPromote(user.username);
                      }
                    }}
                  >
                    {user.account_type === 2 ? (
                      <ArrowCircleDown sx={{ color: 'orange' }} />
                    ) : (
                      <ArrowCircleUp sx={{ color: 'green' }} />
                    )}
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {user.account_type === 2
                        ? isMobile
                          ? 'Demote'
                          : 'Demote to User'
                        : isMobile
                        ? 'Promote'
                        : 'Promote to Moderator'}
                    </Typography>
                  </IconButton>
                )}

                {user.account_type === 3 ? null : (
                  <IconButton
                    disableRipple
                    sx={{ fontSize: '12px', display: 'flex', gap: 1 }}
                    onClick={() => {
                      onDelete(user.id);
                    }}
                  >
                    <HighlightOff sx={{ color: 'red' }} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      Ban
                    </Typography>
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography sx={{ my: 1, ml: 1, color: 'white' }}>Page:</Typography>
      <Pagination
        count={getPageCount()}
        page={currentPage}
        onChange={handleChangePage}
        sx={{ '&>ul>li>button': { color: 'white' } }}
        color="secondary"
      />
    </TableContainer>
  );
};
