// src/components/SearchBar.jsx
import React from 'react';
import {
  Box,
  InputBase,
  IconButton,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const SearchBar = () => {
  const [query, setQuery] = React.useState('');

  return (
    <Paper
      component="form"
      sx={{
        p: '2px 6px',
        display: 'flex',
        alignItems: 'center',
        width: { xs: '100%', sm: 400 },
        height: 40,
        borderRadius: '999px',
        boxShadow: 2,
      }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search..."
        inputProps={{ 'aria-label': 'search' }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && (
        <IconButton size="small" onClick={() => setQuery('')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderLeft: '1px solid #ccc',
          pl: 1,
          ml: 1,
        }}
      >
        <IconButton size="small">
          <MicIcon fontSize="small" />
        </IconButton>
        <IconButton size="small">
          <CameraAltIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" type="submit">
          <SearchIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default SearchBar;
