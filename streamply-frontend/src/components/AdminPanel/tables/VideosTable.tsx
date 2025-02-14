import { Search } from '@mui/icons-material';
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
} from '@mui/material';
import { useState } from 'react';
import { filterDataFromKeys } from '../../../helpers/filterDataFromKeys';
import { Video } from '../../../types/videos.types';
import { TableConfig, VideoActionsConfigType } from './VideoTableConfig';
import { api } from '../../../constants';

export const VideosTable = ({ columnNames, data, actions }: TableConfig) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const filterableFields: string[] = ['title', 'genre'];
  const rowsPerPage = 5;
  const indexedPage = currentPage - 1;

  const filteredData = filterDataFromKeys(data, filterableFields as (keyof Video)[], filter);

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

  const handleAction = (action: VideoActionsConfigType, video: Video) => {
    if (action.action.length === 1) {
      (action.action as (title: string) => void)(video.title);
    } else {
      (action.action as (id: number, targetStatus: number) => void)(video.id, video.blocked_reviews);
    }
  };

  return (
    <TableContainer component={'div'}>
      <InputBase
        placeholder="Search videos..."
        sx={{
          py: 1,
          pl: '12px',
          m: 2,
          backgroundColor: 'transparent',
          borderRadius: '60px',
          color: 'white',
          border: '1px solid #e51445',
        }}
        startAdornment={
          <InputAdornment position="start">
            <Search color="primary" />
          </InputAdornment>
        }
        value={filter}
        onChange={handleFilterChange}
      />
      <Table aria-label="videos-table">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'primary.400', '&>th': { color: 'white' } }}>
            {columnNames.map(columnName => (
              <TableCell key={`video-column-${columnName}`} sx={{ fontWeight: 'bold', position: 'sticky' }}>
                {columnName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody sx={{ borderBottom: 0 }}>
          {pagedData.map(video => (
            <TableRow key={video.id} sx={{ '&>th,td': { color: 'white' } }}>
              <TableCell component="th" scope="row">
                <img
                  alt={`table-thumbnail-${video.title}`}
                  src={
                    video.thumbnail.includes('http') ? video.thumbnail : `${api}/images/thumbnails${video.thumbnail}`
                  }
                  style={{ height: 'auto', width: 'auto', maxHeight: '100px' }}
                />
              </TableCell>
              <TableCell align="left">{video.title}</TableCell>
              <TableCell align="left">{video.genre}</TableCell>
              <TableCell align="left">
                {video.grade}/10 ({video.reviews_count} reviews)
              </TableCell>
              <TableCell align="left">
                {actions.map((action, idx) => (
                  <IconButton
                    key={`action-${idx}`}
                    disableRipple
                    sx={{
                      fontSize: '12px',
                      display: 'flex',
                      gap: 1,
                    }}
                    onClick={() => handleAction(action, video)}
                  >
                    {action.icon}
                    <Typography variant="caption" sx={{ color: 'white' }}>
                      {video.blocked_reviews && action.actionDescription === 'Block Reviews'
                        ? 'Unblock Reviews'
                        : action.actionDescription}
                    </Typography>
                  </IconButton>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography sx={{ my: 1, ml: 1, color: 'white' }}>Page:</Typography>
      <Pagination
        sx={{ '&>ul>li>button': { color: 'white' } }}
        color="secondary"
        count={getPageCount()}
        page={currentPage}
        onChange={handleChangePage}
      />
    </TableContainer>
  );
};

export default VideosTable;
