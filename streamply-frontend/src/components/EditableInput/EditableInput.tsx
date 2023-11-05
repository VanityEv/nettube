import { Edit } from '@mui/icons-material';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { HTMLInputTypeAttribute, useState } from 'react';

export const EditableInput = ({ value, type }: { value?: string | number; type?: HTMLInputTypeAttribute }) => {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      {editMode ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <TextField type={type ? type : 'string'} value={value} />
          <IconButton onClick={() => setEditMode(prev => !prev)}>
            <Edit />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Typography>{value}</Typography>
          <IconButton onClick={() => setEditMode(prev => !prev)}>
            <Edit />
          </IconButton>
        </Box>
      )}
    </>
  );
};
