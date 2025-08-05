import { AppBar } from 'react-admin';
import type { AppBarProps } from 'react-admin';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const AdminAppBar = (props: AppBarProps) => (
  <AppBar {...props}>
    <Box flex="1" />
    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
      Dank Deals Admin
    </Typography>
    <Box mr={2}>
      <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
        <Typography variant="body2">Back to Site</Typography>
      </Link>
    </Box>
  </AppBar>
);
