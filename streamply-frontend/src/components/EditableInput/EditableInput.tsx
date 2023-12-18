import { Edit } from '@mui/icons-material';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { HTMLInputTypeAttribute, useState } from 'react';

export const EditableInput = ({ value, type }: { value?: string | number; type?: HTMLInputTypeAttribute }) => {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      {editMode ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <TextField
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
            type={type ? type : 'string'}
            value={value}
          />
          <IconButton onClick={() => setEditMode(prev => !prev)}>
            <Edit sx={{ color: 'primary.300' }} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <Typography>{value}</Typography>
          <IconButton onClick={() => setEditMode(prev => !prev)}>
            <Edit sx={{ color: 'primary.300' }} />
          </IconButton>
        </Box>
      )}
    </>
  );
};
