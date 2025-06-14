import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, Switch, FormControlLabel, Alert } from '@mui/material';
import Papa from 'papaparse';
import JSZip from 'jszip';

import FileDropzone from './shared/FileDropzone';
import EntitySelector from './shared/EntitySelector';
import { generateMaterialsImages } from '../utils/generateMaterialsImages';

const MaterialsImageGenerator = ({
  buildingBlockId,
  downloadResolution,
  imageTitle,
  imageSubtitle,
  gridRows,
  gridCols,
  showGridDebug
}) => {
    const [materialsFile, setMaterialsFile] = useState(null);
    const [entities, setEntities] = useState([]);
    const [itemsMap, setItemsMap] = useState(new Map());
    const [entitiesMap, setEntitiesMap] = useState(new Map());
    const [showEntitiesSelector, setShowEntitiesSelector] = useState(false);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        try {
            Papa.parse('/items_map.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (result) => setItemsMap(new Map(result.data.map(item => [item.Name, item])))
            });
            Papa.parse('/entities_map.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    setEntities(result.data);
                    setEntitiesMap(new Map(result.data.map(ent => [ent['Registry name'], ent])));
                }
            });
        } catch (err) {
            setErrorMsg("Error al cargar los archivos de mapeo de items/entidades.");
            console.error(err);
        }
    }, []);

    const generateImage = async (isDownload = false) => {
        setErrorMsg(null);

        if (!materialsFile) {
            setErrorMsg("Por favor, sube un archivo de materiales.");
            return;
        }
        setIsGenerating(true);
        if (!isDownload) setPreviewImages([]);

        try {
            try {
                await document.fonts.load('900 10px Poppins');
                await document.fonts.load('600 10px Poppins');
                await document.fonts.load('500 10px Poppins');
            } catch (err) {
                console.warn('No se pudo cargar la fuente Poppins', err);
            }

            const materialsText = await materialsFile.text();
            const parsed = Papa.parse(materialsText, { header: true, skipEmptyLines: true });
            if (!parsed.data || !Array.isArray(parsed.data) || parsed.data.length === 0) {
                setErrorMsg("El archivo de materiales está vacío o mal formateado.");
                setIsGenerating(false);
                return;
            }
            let combinedList = parsed.data
                .filter(row => row.Item && row.Item.trim() !== '' && !isNaN(Number(row.Total)))
                .map(mat => ({ ...mat, type: 'item' }));

            if (showEntitiesSelector && selectedEntities.length > 0) {
                const entityData = selectedEntities.map(sel => ({
                    Item: sel.entity['Registry name'],
                    Total: sel.quantity,
                    type: 'entity'
                }));
                combinedList.push(...entityData);
            }

            combinedList.push({
                Item: 'Bloques temporales',
                Total: 64,
                type: 'custom',
                imagePath: '/items/dirt.png'
            });

            const itemsPerPage = (gridRows || 6) * (gridCols || 3);

            const canvases = await generateMaterialsImages(
                combinedList,
                {
                    downloadResolution,
                    imageTitle,
                    imageSubtitle,
                    itemsPerPage,
                    buildingBlockId,
                    gridRows,
                    gridCols,
                    showGridDebug: !!showGridDebug
                },
                itemsMap,
                entitiesMap
            );

            if (isDownload) {
                if (canvases.length === 1) {
                    const link = document.createElement('a');
                    link.download = 'lista_de_materiales.png';
                    link.href = canvases[0].toDataURL('image/png');
                    link.click();
                } else {
                    const zip = new JSZip();
                    const imagePromises = canvases.map((canvas, index) =>
                        new Promise(resolve => canvas.toBlob(blob => {
                            zip.file(`materiales_p${index + 1}.png`, blob);
                            resolve();
                        }))
                    );
                    await Promise.all(imagePromises);
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    const link = document.createElement('a');
                    link.download = 'lista_de_materiales.zip';
                    link.href = URL.createObjectURL(zipBlob);
                    link.click();
                }
            } else {
                setPreviewImages(canvases.map(canvas => canvas.toDataURL('image/png')));
            }
        } catch (error) {
            setErrorMsg("Error inesperado al procesar la imagen: " + error.message);
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Box>
            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMsg}
                </Alert>
            )}

            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">1. Cargar Archivo</Typography>
                <FileDropzone
                  file={materialsFile}
                  onFileChange={setMaterialsFile}
                  onRemove={() => { setMaterialsFile(null); setPreviewImages([]); }}
                  label="Arrastra o haz clic para subir el .csv de materiales"
                />
            </Paper>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">2. Opciones Adicionales</Typography>
                <FormControlLabel control={<Switch checked={showEntitiesSelector} onChange={(e) => setShowEntitiesSelector(e.target.checked)} />} label="Añadir Entidades" />
                {showEntitiesSelector && (
                  <EntitySelector
                    entities={entities}
                    selectedEntities={selectedEntities}
                    onChange={setSelectedEntities}
                    label="Buscar y añadir entidades"
                  />
                )}
            </Paper>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">3. Generar Imagen</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" onClick={() => generateImage(false)} disabled={isGenerating || !materialsFile}>
                        {isGenerating ? <CircularProgress size={24} /> : 'Generar Vista Previa'}
                    </Button>
                    <Button variant="outlined" onClick={() => generateImage(true)} disabled={previewImages.length === 0 || isGenerating}>
                        Descargar
                    </Button>
                </Box>
                {previewImages.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, overflowX: 'auto', p: 1 }}>
                        {previewImages.map((imgSrc, index) => (
                            <Box key={index} sx={{ flexShrink: 0, width: '50%', aspectRatio: '16 / 9', bgcolor: 'action.hover', borderRadius: 1 }}>
                                <img src={imgSrc} alt={`Vista previa ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default MaterialsImageGenerator;
