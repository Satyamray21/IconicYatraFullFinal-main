import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Tooltip,
  Stack
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

const CalendarPopup = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const Click = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{mt:3}}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title="Open Calendar">
          <IconButton
            color="primary"
            onClick={Click}
            sx={{
              border: '1px solid #ccc',
              bgcolor: '#fff',
              '&:hover': { bgcolor: '#f0f0f0' },
            }}
          >
            <EventIcon />
          </IconButton>
        </Tooltip>

        <Typography
          variant="body1"
          onClick={Click}
          sx={{
            cursor: 'pointer',
            color: '#1976d2',
            fontWeight: 600,
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Calendar
        </Typography>
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { borderRadius: 2, p: 1, mt: 3 },
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            sx={{
              '& .MuiPickersCalendarHeader-root': {
                backgroundColor: '#1976d2',
                color: '#fff',
                borderRadius: 1,
                py: 1,
              },
              '& .MuiPickersCalendarHeader-label': {
                fontWeight: 'bold',
              },
              '& .MuiDayCalendar-weekDayLabel': {
                fontSize: '11px',
                color: '#1976d2',
                fontWeight: 600,
              },
              '& .MuiPickersDay-root': {
                width: 30,
                height: 30,
                fontSize: '11px',
                '&.Mui-selected': {
                  backgroundColor: '#ff5722',
                },
                '&.MuiPickersDay-today': {
                  border: '2px solid #4caf50',
                  backgroundColor: '#e8f5e9',
                },
              },
              '& .MuiTypography-caption': {
                fontSize: '12px',
              },
            }}
          />
        </LocalizationProvider>
      </Popover>
    </Box>
  );
};

export default CalendarPopup;
