import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, FormControl, InputLabel, Select, MenuItem, 
  Button, Stack, Alert 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';

/**
 * Componente de configuración global de la aplicación.
 * Permite modificar parámetros del datapack y de la imagen de materiales.
 */
const Settings = ({ savedSettings, onSave }) => {
  // Estado local para edición temporal de los settings antes de guardar
  const [localSettings, setLocalSettings] = useState(savedSettings);

  // Estado de error para validaciones y feedback
  const [errorMsg, setErrorMsg] = useState(null);

  // Actualiza el estado local si la configuración global cambia desde fuera
  useEffect(() => {
    setLocalSettings(savedSettings);
    setErrorMsg(null);
  }, [savedSettings]);

  /**
   * Cambia un valor del settings local
   * Incluye validación básica para prevenir valores inválidos
   */
  const handleChange = (key, value) => {
    // Validaciones simples de campos numéricos (puedes extenderlas)
    if (key === 'packFormat' && (isNaN(value) || value <= 0)) {
      setErrorMsg('El pack format debe ser un número positivo.');
      return;
    }
    setLocalSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
    setErrorMsg(null);
  };

  // Restaura los valores a la última configuración guardada
  const handleReset = () => {
    setLocalSettings(savedSettings);
    setErrorMsg(null);
  };

  /**
   * Guarda los cambios y los propaga hacia el componente padre
   * Incluye validación antes de guardar
   */
  const handleSave = () => {
    if (!localSettings.packFormat || localSettings.packFormat <= 0) {
      setErrorMsg('El pack format debe ser un número positivo.');
      return;
    }
    if (!localSettings.downloadResolution) {
      setErrorMsg('Debes seleccionar una resolución.');
      return;
    }
    onSave(localSettings);
    setErrorMsg(null);
  };

  // Detecta si existen cambios pendientes
  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(savedSettings);

  return (
    <Box>
      {/* Mensaje de error global */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Configuración de Datapack */}
      <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>Datapack</Typography>
        <TextField 
          type="number" 
          label="Pack Format" 
          variant="outlined" 
          value={localSettings.packFormat} 
          onChange={(e) => handleChange('packFormat', Number(e.target.value))} 
          fullWidth
        />
      </Paper>
      {/* Configuración de imagen de materiales */}
      <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>Imagen de Materiales</Typography>
        <TextField 
          label="Título Principal" 
          variant="outlined" 
          value={localSettings.imageTitle} 
          onChange={(e) => handleChange('imageTitle', e.target.value)} 
          fullWidth sx={{mb: 2}}
        />
        <TextField 
          label="Subtítulo" 
          variant="outlined" 
          value={localSettings.imageSubtitle} 
          onChange={(e) => handleChange('imageSubtitle', e.target.value)} 
          fullWidth sx={{mb: 2}}
        />
        <TextField 
          label="ItemID del Bloque de Construcción" 
          variant="outlined" 
          value={localSettings.buildingBlockId} 
          onChange={(e) => handleChange('buildingBlockId', e.target.value)} 
          fullWidth 
          sx={{mb: 2}}
        />
        <FormControl fullWidth>
          <InputLabel id="resolution-select-label">Resolución de Descarga</InputLabel>
          <Select 
            labelId="resolution-select-label" 
            value={localSettings.downloadResolution} 
            label="Resolución de Descarga" 
            onChange={(e) => handleChange('downloadResolution', e.target.value)}
          >
            <MenuItem value={'1280x720'}>1280x720 (720p)</MenuItem>
            <MenuItem value={'1920x1080'}>1920x1080 (1080p)</MenuItem>
            <MenuItem value={'2560x1440'}>2560x1440 (1440p)</MenuItem>
            <MenuItem value={'3840x2160'}>3840x2160 (4K)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Botones de acciones */}
      <Paper elevation={0} sx={{p: 2, backgroundColor: 'transparent' }}>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Guardar Cambios
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Restablecer
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Settings;
