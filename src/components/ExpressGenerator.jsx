import React, { useState } from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, TextField, CircularProgress } from '@mui/material';
import FileDropzone from './shared/FileDropzone';
import VersionSelector from './shared/VersionSelector';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { useSnackbar } from '../hooks/useSnackbar';
import { usePyodide } from '../hooks/usePyodide';
import { generateMaterialsImages } from '../utils/generateMaterialsImages';
import { generateDescriptionText } from '../utils/generateDescriptionText';
import { formatTimestampsWithPyodide } from '../utils/formatTimestampsWithPyodide';
import { formatMaterialsListWithPyodide } from '../utils/formatMaterialsListWithPyodide';

const steps = ['Materiales', 'Descripción', 'Timestamps', 'Resumen'];

const versionsData = {
  '1.21': ['1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1'],
  '1.20': ['1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1'],
  '1.19': ['1.19.4', '1.19.3', '1.19.2', '1.19.1'],
  '1.18': ['1.18.2', '1.18.1'],
  '1.17': ['1.17.1']
};

const ExpressGenerator = ({
  settings = {}, itemsMap, entitiesMap
}) => {
  const [activeStep, setActiveStep] = useState(0);

  // Paso 1: Materiales
  const [materialsFile, setMaterialsFile] = useState(null);
  const [materialsData, setMaterialsData] = useState(null);

  // Paso 2: Descripción
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [platforms, setPlatforms] = useState({ java: false, bedrock: false });
  const [introText, setIntroText] = useState('');
  const [creator, setCreator] = useState('');
  const [musicUrls, setMusicUrls] = useState('');

  // Paso 3: Timestamps
  const [timestampsFile, setTimestampsFile] = useState(null);

  // Paso 4: Resultados finales
  const [isProcessing, setIsProcessing] = useState(false);
  const [materialsImages, setMaterialsImages] = useState([]);
  const [materialsListText, setMaterialsListText] = useState('');
  const [timestampsText, setTimestampsText] = useState('');
  const [finalDescription, setFinalDescription] = useState('');

  const { showSnackbar } = useSnackbar();
  const { loadPyodide } = usePyodide();

  // Paso 1: Procesa el archivo y valida columnas requeridas
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

  // Paso 4: Generación de resultados (se ejecuta solo cuando pasas al paso 4)
  const handleGenerateResults = async () => {
  setIsProcessing(true);
  try {
    // 1. Esperar a que la fuente Poppins esté lista (idéntico a MaterialsImageGenerator)
    try {
      await document.fonts.load('900 10px Poppins');
      await document.fonts.load('600 10px Poppins');
      await document.fonts.load('500 10px Poppins');
    } catch (err) {
      console.warn('No se pudo cargar la fuente Poppins', err);
    }

    // 2. Procesar archivo CSV igual que en MaterialsImageGenerator
    const materialsText = await materialsFile.text();
    const parsed = Papa.parse(materialsText, { header: true, skipEmptyLines: true });
    if (!parsed.data || !Array.isArray(parsed.data) || parsed.data.length === 0) {
      showSnackbar("El archivo de materiales está vacío o mal formateado.", 'error');
      setIsProcessing(false);
      return;
    }
    let combinedList = parsed.data
      .filter(row => row.Item && row.Item.trim() !== '' && !isNaN(Number(row.Total)))
      .map(mat => ({ ...mat, type: 'item' }));

    // 3. Agrega "Bloques temporales" al final igual que en Materiales
    combinedList.push({
      Item: 'Bloques temporales',
      Total: 64,
      type: 'custom',
      imagePath: '/items/dirt.png'
    });

    const itemsPerPage = (settings.gridRows || 6) * (settings.gridCols || 3);

    // 4. Generar imágenes de materiales
    const imgs = await generateMaterialsImages(
      combinedList,
      {
        downloadResolution: settings.downloadResolution || '1920x1080',
        imageTitle: settings.imageTitle || 'MATERIALES',
        imageSubtitle: settings.imageSubtitle || 'La cantidad puede variar ligeramente',
        itemsPerPage,
        buildingBlockId: settings.buildingBlockId || 'smooth_stone',
        gridRows: settings.gridRows || 6,
        gridCols: settings.gridCols || 3,
        showGridDebug: settings.showGridDebug || false
      },
      itemsMap,
      entitiesMap
    );
    setMaterialsImages(imgs.map(canvas => canvas.toDataURL('image/png')));

    // 5. Generar lista de materiales para la descripción
    const pyodide = await loadPyodide();
    const itemsMapText = await fetch('/items_map.csv').then(r => r.text());
    const materialsListTextResult = await formatMaterialsListWithPyodide(
      materialsText,
      itemsMapText,
      settings.buildingBlockId || 'smooth_stone',
      '/generate_description_list.py',
      pyodide
    );
    setMaterialsListText(materialsListTextResult);

    // 6. Formatear timestamps (si hay)
    let timestampsTextResult = '';
    if (timestampsFile) {
      const rawTimestamps = await timestampsFile.text();
      timestampsTextResult = await formatTimestampsWithPyodide(
        rawTimestamps,
        '/generate_timestamps.py',
        pyodide
      );
      setTimestampsText(timestampsTextResult);
    }

    // 7. Generar descripción final
    const descriptionResult = generateDescriptionText({
      introText,
      materialsListText: materialsListTextResult,
      versions: selectedVersions,
      platforms,
      creator,
      musicSegment: musicUrls,
      timestampsText: timestampsTextResult
    });
    setFinalDescription(descriptionResult);

    showSnackbar('¡Proceso finalizado! Todo listo para descargar.', 'success');
  } catch (error) {
    showSnackbar('Error generando los resultados: ' + error.message, 'error');
  }
  setIsProcessing(false);
};


  // Paso 4: Descargar ZIP
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    // Imágenes de materiales
    materialsImages.forEach((img, idx) => {
      zip.file(`materiales_${idx + 1}.png`, img.split(',')[1], { base64: true });
    });
    // Descripción
    zip.file('descripcion.txt', finalDescription);
    // Timestamps
    if (timestampsText) zip.file('timestamps.txt', timestampsText);

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'descarga_express.zip';
    link.click();
  };

  // Avanzar pasos
  const handleNext = async () => {
    // Si es el último paso antes del resumen, genera los resultados
    if (activeStep === 3 - 1) { // en el paso 3 (índice 2) => siguiente es paso 4
      await handleGenerateResults();
    }
    setActiveStep((prev) => prev + 1);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', mt: 6, mb: 10 }}>
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

      {/* Paso 3: Subir timestamps */}
      {activeStep === 2 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Sube tu archivo de timestamps
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Arrastra o selecciona el archivo de timestamps (puede ser CSV o TXT) que quieres añadir al final de la descripción.
          </Typography>
          <FileDropzone
            file={timestampsFile}
            onFileChange={setTimestampsFile}
            onRemove={() => setTimestampsFile(null)}
            label="Arrastra o haz clic para subir el archivo de timestamps"
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={!timestampsFile}
            onClick={handleNext}
          >
            Siguiente
          </Button>
        </Paper>
      )}

      {/* Paso 4: Resumen y descarga */}
      {activeStep === 3 && (
        <Paper sx={{ p: 4, mb: 6 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            ¡Listo! Descarga todo tu contenido
          </Typography>
          {isProcessing ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={40} sx={{ mb: 3 }} />
              <Typography>Generando materiales, imágenes y descripción...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Imágenes generadas:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                {materialsImages.map((img, idx) => (
                  <img key={idx} src={img} alt={`Materiales ${idx + 1}`} style={{ maxWidth: 220, borderRadius: 10, boxShadow: '0 1px 6px #0003' }} />
                ))}
              </Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>Descripción generada:</Typography>
              <Box sx={{
                background: '#1a1a1a',
                color: '#f1f1f1',
                borderRadius: 4,
                p: 2,
                textAlign: 'left',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{finalDescription}</pre>
              </Box>
              {timestampsText && (
                <>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>Timestamps:</Typography>
                  <Box sx={{
                    background: '#1a1a1a',
                    color: '#f1f1f1',
                    borderRadius: 4,
                    p: 2,
                    textAlign: 'left',
                    overflowX: 'auto',
                    fontFamily: 'monospace'
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{timestampsText}</pre>
                  </Box>
                </>
              )}
              <Button
                variant="contained"
                color="success"
                sx={{ mt: 4 }}
                onClick={handleDownloadZip}
              >
                Descargar todo en ZIP
              </Button>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ExpressGenerator;
