import React, { useState } from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, TextField } from '@mui/material';
import FileDropzone from './shared/FileDropzone';
import VersionSelector from './shared/VersionSelector';
import Papa from 'papaparse';
import { useSnackbar } from '../hooks/useSnackbar';

const steps = ['Materiales', 'Descripción', 'Timestamps', 'Resumen'];

const versionsData = {
  '1.21': ['1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1'],
  '1.20': ['1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1'],
  '1.19': ['1.19.4', '1.19.3', '1.19.2', '1.19.1'],
  '1.18': ['1.18.2', '1.18.1'],
  '1.17': ['1.17.1']
};

const ExpressGenerator = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [materialsFile, setMaterialsFile] = useState(null);
  const [materialsData, setMaterialsData] = useState(null);

  const [selectedVersions, setSelectedVersions] = useState([]);
  const [platforms, setPlatforms] = useState({ java: false, bedrock: false });
  const [introText, setIntroText] = useState('');
  const [creator, setCreator] = useState('');
  const [musicUrls, setMusicUrls] = useState('');

  const { showSnackbar } = useSnackbar();

  const handleFileChange = async (file) => {
    setMaterialsFile(file);
    if (!file) {
      setMaterialsData(null);
      return;
    }
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      if (!parsed.meta.fields.includes('Item') || !parsed.meta.fields.includes('Total')) {
        setMaterialsData(null);
        showSnackbar(
          'El archivo CSV debe contener al menos las columnas "Item" y "Total". Verifica tu archivo e inténtalo de nuevo.',
          'error'
        );
        return;
      }
      setMaterialsData(parsed.data);
    } catch (error) {
      setMaterialsData(null);
      showSnackbar(
        'Error al leer o procesar el archivo. Asegúrate de subir un CSV válido.',
        'error'
      );
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);

  return (
    <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', mt: 6 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Paso 1: Subir materiales */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Subir lista de materiales
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Arrastra o selecciona tu archivo CSV de materiales para comenzar el proceso Express.
          </Typography>
          <FileDropzone
            file={materialsFile}
            onFileChange={handleFileChange}
            onRemove={() => {
              setMaterialsFile(null);
              setMaterialsData(null);
            }}
            label="Arrastra o haz clic para subir el archivo .csv de materiales"
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={!materialsFile || !materialsData}
            onClick={handleNext}
          >
            Siguiente
          </Button>
        </Paper>
      )}

      {/* Paso 2: Datos de descripción */}
      {activeStep === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Completa los datos de la descripción
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Selecciona las versiones compatibles, plataformas y agrega los datos que necesites. Solo lo justo y necesario.
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Versiones</Typography>
          <VersionSelector
            versionsData={versionsData}
            selectedSubversions={selectedVersions}
            onChange={setSelectedVersions}
          />

          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Plataformas</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box>
                <label>
                  <input
                    type="checkbox"
                    checked={platforms.java}
                    onChange={e => setPlatforms(prev => ({ ...prev, java: e.target.checked }))}
                  />
                  Java
                </label>
              </Box>
              <Box>
                <label>
                  <input
                    type="checkbox"
                    checked={platforms.bedrock}
                    onChange={e => setPlatforms(prev => ({ ...prev, bedrock: e.target.checked }))}
                  />
                  Bedrock
                </label>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600}>Introducción (opcional)</Typography>
            <TextField
              value={introText}
              onChange={e => setIntroText(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              sx={{ mt: 1 }}
              variant="outlined"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Creador (opcional)</Typography>
            <TextField
              value={creator}
              onChange={e => setCreator(e.target.value)}
              fullWidth
              sx={{ mt: 1 }}
              variant="outlined"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>URLs de música (opcional, una por línea)</Typography>
            <TextField
              value={musicUrls}
              onChange={e => setMusicUrls(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              sx={{ mt: 1 }}
              variant="outlined"
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 4 }}
            disabled={
              selectedVersions.length === 0 ||
              (!platforms.java && !platforms.bedrock)
            }
            onClick={handleNext}
          >
            Siguiente
          </Button>
        </Paper>
      )}
      {/* Los siguientes pasos irán aquí... */}
    </Box>
  );
};

export default ExpressGenerator;
