import React from 'react';
import { Typography } from '@mui/material';

const Placeholder = ({ title }) => {
    return (
        <Typography paragraph color="text.secondary">
            Esta es la sección de {title}. La funcionalidad se añadirá próximamente.
        </Typography>
    );
};

export default Placeholder;
