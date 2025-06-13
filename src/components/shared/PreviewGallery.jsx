import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente galería de previews de imágenes.
 * Props:
 * - images: array de src/base64 de imágenes
 * - aspectRatio: string (default: '16 / 9')
 * - width: string (default: '50%')
 * - sx: estilos adicionales opcionales
 */
const PreviewGallery = ({ images, aspectRatio = '16 / 9', width = '50%', sx }) => {
  if (!images || images.length === 0) return null;
  return (
    <Box sx={{ mt: 2, display: 'flex', gap: 2, overflowX: 'auto', p: 1, ...sx }}>
      {images.map((imgSrc, index) => (
        <Box
          key={index}
          sx={{
            flexShrink: 0,
            width: width,
            aspectRatio: aspectRatio,
            bgcolor: 'action.hover',
            borderRadius: 1,
            ...sx
          }}
        >
          <img
            src={imgSrc}
            alt={`Vista previa ${index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default PreviewGallery;
