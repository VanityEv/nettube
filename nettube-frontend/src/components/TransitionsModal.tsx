import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { PlayCircle } from '@mui/icons-material';
import { TestCardProps } from '../pages/HomePage';

//style nie działają dla img :( (linia 41)
//zgaduje że dlatego że modal ma pozycje absolute ale już nie mam siły dzisiaj tego poprawiać xD

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '50%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  padding: "1em 1em 0 1em",
  p: 4,
  objectFit: "contain",
};
export default function TransitionsModal({title,alt,description,thumbnail}: TestCardProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <PlayCircle onClick={handleOpen}/>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition>
        <Fade in={open}>
          <Box sx={style}>
            <picture>
              <img src={thumbnail} style={{objectFit: 'contain'}}/>
            </picture>
            <Typography id="transition-modal-title" variant="h3" component="h2">
              {title}
            </Typography>
            <Typography id="transition-modal-description" sx={{ mt: 2 }}>
              {description}
            </Typography>
          </Box>
        </Fade>
      </Modal>
      </>
  );
}