import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, FormControl, InputLabel, Select, MenuItem, Button, Stack } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';

const Settings = ({ savedSettings, onSave }) => {
    
    // Estado local para mantener los cambios antes de guardarlos
    const [localSettings, setLocalSettings] = useState(savedSettings);

    // Si la configuración principal cambia desde fuera, actualizar el estado local
    useEffect(() => {
        setLocalSettings(savedSettings);
    }, [savedSettings]);

    // Manejador para actualizar el estado local
    const handleChange = (key, value) => {
        setLocalSettings(prevSettings => ({
            ...prevSettings,
            [key]: value
        }));
    };

    // Función para restablecer los cambios a la última versión guardada
    const handleReset = () => {
        setLocalSettings(savedSettings);
    };

    // Función para guardar los cambios en el estado principal
    const handleSave = () => {
        onSave(localSettings);
    };

    // Comprobar si hay cambios sin guardar para activar/desactivar botones
    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(savedSettings);

    return (
        <Box>
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
