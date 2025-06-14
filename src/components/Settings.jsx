import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Stack, Alert } from '@mui/material';
import { FormControlLabel, Switch as MuiSwitch } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import Autocomplete from '@mui/material/Autocomplete';
import useCSVMap from '../hooks/useCSVMap'; // Importa el custom hook

const Settings = ({ savedSettings, onSave }) => {
  // Cargar el CSV de items y obtener el array
  const { data: items, error: itemsError } = useCSVMap('/items_map.csv', 'Name');

  // Estado local para edición temporal de settings antes de guardar
  const [localSettings, setLocalSettings] = useState(savedSettings);
  const [errorMsg, setErrorMsg] = useState(null);

  // Actualiza estado local si cambian los settings externos
  useEffect(() => {
    setLocalSettings(savedSettings);
    setErrorMsg(null);
  }, [savedSettings]);

  // Si hay error cargando items, muestra alerta
  useEffect(() => {
    if (itemsError) setErrorMsg('Error al cargar items: ' + itemsError.message);
  }, [itemsError]);

  // Cambia un valor del settings local (con validación)
  const handleChange = (key, value) => {
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

  // Restaura valores a la última config guardada
  const handleReset = () => {
    setLocalSettings(savedSettings);
    setErrorMsg(null);
  };

  // Guarda los cambios y propaga hacia el componente padre
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
          fullWidth sx={{ mb: 2 }}
        />
        <TextField
          label="Subtítulo"
          variant="outlined"
          value={localSettings.imageSubtitle}
          onChange={(e) => handleChange('imageSubtitle', e.target.value)}
          fullWidth sx={{ mb: 2 }}
        />
        <TextField
          type="number"
          label="Filas"
          variant="outlined"
          value={localSettings.gridRows || 6}
          onChange={e => handleChange('gridRows', Number(e.target.value))}
          fullWidth sx={{ mb: 2 }}
        />
        <TextField
          type="number"
          label="Columnas"
          variant="outlined"
          value={localSettings.gridCols || 3}
          onChange={e => handleChange('gridCols', Number(e.target.value))}
          fullWidth sx={{ mb: 2 }}
        />
        
        {/* Autocomplete para seleccionar el bloque de construcción */}
        <Autocomplete
          options={items}
          getOptionLabel={item => item?.NameEsp ? `${item.NameEsp} (${item.ItemID})` : (item?.ItemID || '')}
          value={items.find(item => item.ItemID === localSettings.buildingBlockId) || null}
          onChange={(e, newValue) => handleChange('buildingBlockId', newValue ? newValue.ItemID : '')}
          renderInput={params => (
            <TextField {...params} label="Bloque de Construcción" variant="outlined" fullWidth sx={{ mb: 2 }} />
          )}
        />

        <TextField
          label="Resolución de descarga"
          variant="outlined"
          value={localSettings.downloadResolution}
          onChange={(e) => handleChange('downloadResolution', e.target.value)}
          fullWidth sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <MuiSwitch
              checked={!!localSettings.showGridDebug}
              onChange={e => handleChange('showGridDebug', e.target.checked)}
            />
          }
          label="Mostrar límites de grid en la imagen (Debug)"
          sx={{ mb: 2 }}
        />
      </Paper>

      {/* Botones de acciones */}
      <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent' }}>
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
