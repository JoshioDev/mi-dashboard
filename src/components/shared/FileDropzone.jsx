import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const FileDropzone = ({ file, onFileChange, onRemove, accept = { 'text/csv': ['.csv'] }, label = "Archivo", ...rest }) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onFileChange(acceptedFiles[0]);
    },
    accept
  });

  return (
    <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: 'text.secondary', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer', my: 2, ...rest.sx }}>
      <input {...getInputProps()} />
      {file ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon color="success" />
          <Typography sx={{ flexGrow: 1, textAlign: 'left', ml: 1 }}>{file.name}</Typography>
          <IconButton onClick={e => { e.stopPropagation(); onRemove && onRemove(); }}><DeleteIcon /></IconButton>
        </Box>
      ) : (
        <>
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography color="text.secondary">{label}</Typography>
        </>
      )}
    </Box>
  );
};

export default FileDropzone;
