import React, { useState } from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, Button } from '@mui/material';
import FileDropzone from './shared/FileDropzone';
import Papa from 'papaparse';
import { useSnackbar } from '../hooks/useSnackbar';

const steps = ['Materiales', 'Descripción', 'Timestamps', 'Resumen'];

const ExpressGenerator = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [materialsFile, setMaterialsFile] = useState(null);
  const [materialsData, setMaterialsData] = useState(null);

  const { showSnackbar } = useSnackbar();

  // Procesa el archivo y valida las columnas requeridas
  const handleFileChange = async (file) => {
    setMaterialsFile(file);
    if (!file) {
      setMaterialsData(null);
      return;
    }
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      // Valida columnas mínimas
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

  // Siguiente paso
  const handleNext = () => setActiveStep((prev) => prev + 1);

  return (
    <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', mt: 6 }}>
      {/* Stepper visual */}
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

      {/* Aquí irán los siguientes pasos... */}
    </Box>
  );
};

export default ExpressGenerator;
