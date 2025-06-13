import React from 'react';
import { Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Componente de alerta reutilizable.
 * Props:
 * - message: string o ReactNode (mensaje a mostrar)
 * - severity: 'error' | 'warning' | 'info' | 'success' (por defecto: error)
 * - onClose: función opcional para cerrar/descartar el mensaje
 * - sx: estilos adicionales opcionales
 */
const ErrorAlert = ({ message, severity = 'error', onClose, sx }) => {
  if (!message) return null;
  return (
    <Alert
      severity={severity}
      action={onClose && (
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={onClose}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
      sx={{ mb: 2, ...sx }}
    >
      {message}
    </Alert>
  );
};

export default ErrorAlert;
