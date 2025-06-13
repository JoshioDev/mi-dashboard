import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton, Paper, Switch, Autocomplete, TextField, FormControlLabel, Alert } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import JSZip from 'jszip';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Generador de imágenes de materiales con soporte para entidades adicionales.
 * Permite cargar un CSV, añadir entidades manualmente, generar vistas previas y descargar imágenes.
 */
const MaterialsImageGenerator = ({ buildingBlockId, downloadResolution, imageTitle, imageSubtitle }) => {
    // Estados principales del componente
    const [materialsFile, setMaterialsFile] = useState(null);
    const [entities, setEntities] = useState([]);
    const [itemsMap, setItemsMap] = useState(new Map());
    const [entitiesMap, setEntitiesMap] = useState(new Map());
    const [showEntitiesSelector, setShowEntitiesSelector] = useState(false);
    const [selectedEntities, setSelectedEntities] = useState([]); // { entity, quantity }
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    // Cargar mapas de items y entidades al montar
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

    // Dropzone para carga de archivo .csv
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) setMaterialsFile(acceptedFiles[0]);
        setErrorMsg(null);
    }, []);

    // Eliminar el archivo de materiales y limpiar vistas previas
    const handleRemoveFile = (event) => {
        event.stopPropagation();
        setMaterialsFile(null);
        setPreviewImages([]);
        setErrorMsg(null);
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] }
    });

    // Actualizar entidades seleccionadas
    const handleEntitySelectionChange = (event, newValue) => {
        const newSelected = newValue.map(entity => {
            const existing = selectedEntities.find(se => se.entity['Registry name'] === entity['Registry name']);
            return existing ? existing : { entity: entity, quantity: 1 };
        });
        setSelectedEntities(newSelected);
    };

    // Cambiar cantidad de una entidad seleccionada
    const handleEntityQuantityChange = (registryName, quantity) => {
        setSelectedEntities(prev =>
            prev.map(item =>
                item.entity['Registry name'] === registryName
                    ? { ...item, quantity: Math.max(1, Number(quantity)) }
                    : item
            )
        );
    };

    /**
     * Función principal para generar las imágenes
     * Si isDownload es true, descarga; si no, solo actualiza las vistas previas
     */
    const generateImage = async (isDownload = false) => {
        setErrorMsg(null);

        // Validación: archivo de materiales obligatorio
        if (!materialsFile) {
            setErrorMsg("Por favor, sube un archivo de materiales.");
            return;
        }

        setIsGenerating(true);
        if (!isDownload) setPreviewImages([]);

        try {
            // Cargar fuentes si están disponibles (no bloquear si falla)
            try {
                await document.fonts.load('900 10px Poppins');
                await document.fonts.load('600 10px Poppins');
                await document.fonts.load('500 10px Poppins');
            } catch (err) {
                // No hacer nada si falla la carga de fuentes
                console.warn('No se pudo cargar la fuente Poppins', err);
            }

            // Leer y validar el CSV de materiales
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

            // Incluir entidades si es necesario
            if (showEntitiesSelector && selectedEntities.length > 0) {
                const entityData = selectedEntities.map(sel => ({
                    Item: sel.entity['Registry name'],
                    Total: sel.quantity,
                    type: 'entity'
                }));
                combinedList.push(...entityData);
            }

            // Siempre agregar bloques temporales al final
            combinedList.push({
                Item: 'Bloques temporales',
                Total: 64,
                type: 'custom',
                imagePath: '/items/dirt.png'
            });

            // Paginación de items (18 por página)
            const ITEMS_PER_PAGE = 18;
            const pages = [];
            for (let i = 0; i < combinedList.length; i += ITEMS_PER_PAGE) {
                pages.push(combinedList.slice(i, i + ITEMS_PER_PAGE));
            }

            // Generar imágenes por página
            const generatedImages = [];
            for (let i = 0; i < pages.length; i++) {
                try {
                    const canvas = await drawSingleImage(pages[i], i + 1, pages.length, isDownload);
                    generatedImages.push(canvas);
                } catch (err) {
                    setErrorMsg("Error al generar la imagen de materiales. Verifica que los datos sean válidos.");
                    console.error(err);
                    break;
                }
            }

            // Descargar o mostrar vistas previas
            if (isDownload) {
                if (generatedImages.length === 0) {
                    setErrorMsg("No se pudo generar ninguna imagen para descargar.");
                    setIsGenerating(false);
                    return;
                }
                if (generatedImages.length === 1) {
                    // Descargar una sola imagen
                    const link = document.createElement('a');
                    link.download = 'lista_de_materiales.png';
                    link.href = generatedImages[0].toDataURL('image/png');
                    link.click();
                } else {
                    // Descargar ZIP de imágenes
                    const zip = new JSZip();
                    const imagePromises = generatedImages.map((canvas, index) =>
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
                // Actualizar vistas previas
                setPreviewImages(generatedImages.map(canvas => canvas.toDataURL('image/png')));
            }

        } catch (error) {
            setErrorMsg("Error inesperado al procesar la imagen: " + error.message);
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * Dibuja una página de la imagen en un canvas, usando los datos de materiales
     * Maneja fallos en carga de imágenes y calcula nombres amigables
     */
    const drawSingleImage = async (pageItems, pageNum, totalPages, isDownload) => {
        // Elegir resolución en base a si es preview o descarga
        const canvas = document.createElement('canvas');
        const [width, height] = (isDownload ? downloadResolution : '1280x720').split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / 1920;

        // Función para cargar imágenes de items o entidades con fallback
        const loadImage = (src) => new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                // Imágenes que fallan mostrarán un icono genérico
                resolve(null);
            };
            img.src = src;
        });

        // Pre-cargar todas las imágenes para rendimiento óptimo
        const imagePromises = pageItems.map(item => {
            if (item.type === 'custom') {
                return loadImage(item.imagePath);
            }
            const mapEntry = item.type === 'item' ? itemsMap.get(item.Item) : entitiesMap.get(item.Item);
            const itemId = mapEntry ? (item.type === 'item' ? mapEntry.ItemID : mapEntry['Registry name'].replace('minecraft:', '')) : item.Item.replace('minecraft:', '');
            const folder = item.type === 'item' ? 'items' : 'entities';
            return loadImage(`/${folder}/${itemId}.png`);
        });

        const loadedImages = await Promise.all(imagePromises);

        // Fondo y estilos
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, [20 * scale]);
        ctx.clip();
        ctx.fillStyle = 'rgba(17, 17, 17, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(200, 200, 220, 0.9)';
        ctx.font = `900 ${90 * scale}px Poppins`;
        ctx.textAlign = 'center';
        ctx.fillText(imageTitle.toUpperCase(), canvas.width / 2, 160 * scale);

        ctx.fillStyle = 'rgba(187, 187, 187, 0.8)';
        ctx.font = `600 ${35 * scale}px Poppins`;
        ctx.fillText(imageSubtitle.toUpperCase(), canvas.width / 2, 215 * scale);

        // Layout de ítems (3 columnas, 6 filas por defecto)
        const columns = 3;
        const gridPadding = 100 * scale;
        const columnWidth = (canvas.width - (gridPadding * 2)) / columns;
        const startY = 280 * scale;
        const itemPadding = 30 * scale;
        const itemBoxHeight = 100 * scale;

        pageItems.forEach((item, index) => {
            const img = loadedImages[index];
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = gridPadding + (col * columnWidth);
            const y = startY + (row * (itemBoxHeight + itemPadding));

            // Fondo detrás del ícono
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            const iconBgSize = 80 * scale;
            ctx.beginPath();
            ctx.roundRect(x, y + (itemBoxHeight - iconBgSize) / 2, iconBgSize, iconBgSize, [12 * scale]);
            ctx.fill();

            // Dibuja el ícono o fallback si no se cargó
            const iconSize = 56 * scale;
            if (img) {
                ctx.drawImage(img, x + (iconBgSize - iconSize) / 2, y + (itemBoxHeight - iconSize) / 2, iconSize, iconSize);
            } else {
                ctx.font = `900 ${24 * scale}px Poppins`;
                ctx.fillStyle = '#AAA';
                ctx.textAlign = 'center';
                ctx.fillText('?', x + iconBgSize / 2, y + (itemBoxHeight / 2) + 12 * scale);
            }

            // Cálculo del nombre a mostrar
            let name = "Desconocido";
            if (item.type === 'custom') {
                name = item.Item;
            } else if (item.type === 'entity') {
                const entityMapEntry = entitiesMap.get(item.Item);
                name = entityMapEntry?.NameEsp || item.Item.replace('minecraft:', '');
            } else {
                const mapEntry = itemsMap.get(item.Item);
                name = mapEntry?.NameEsp || item.Item.replace('minecraft:', '');
                if (mapEntry?.ItemID === buildingBlockId) name = 'Bloques de construcción';
            }

            // Ajuste de nombre largo a varias líneas
            const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
                const words = text.split(' '); let line = '';
                for(let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    if (context.measureText(testLine).width > maxWidth && n > 0) {
                        context.fillText(line, x, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    } else { line = testLine; }
                }
                context.fillText(line, x, y);
            };
            const textX = x + iconBgSize + (25 * scale);
            const textWidth = columnWidth - iconBgSize - (50 * scale);
            ctx.fillStyle = '#ffffff';
            ctx.font = `600 ${35 * scale}px Poppins`;
            ctx.textAlign = 'left';
            wrapText(ctx, name, textX, y + (38 * scale), textWidth, 38 * scale);

            // Mostrar la cantidad excepto en ítems 'custom'
            if (item.type !== 'custom') {
                ctx.fillStyle = '#94A3B8';
                ctx.font = `500 ${30 * scale}px Poppins`;
                ctx.textAlign = 'right';
                ctx.fillText(`x${item.Total}`, x + columnWidth - (itemPadding * 1.5), y + itemBoxHeight - (10 * scale));
            }
        });

        // Pie de página
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = `500 ${22 * scale}px Poppins`;
        ctx.textAlign = 'left';
        ctx.fillText('youtube.com/@inordap', gridPadding, canvas.height - (30 * scale));

        // Paginador si hay varias páginas
        if (totalPages > 1) {
            ctx.textAlign = 'right';
            ctx.fillText(`${pageNum}/${totalPages}`, canvas.width - gridPadding, canvas.height - (30 * scale));
        }
        return canvas;
    };

    return (
        <Box>
            {/* Alerta de error global */}
            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMsg}
                </Alert>
            )}

            {/* Paso 1: Cargar archivo de materiales */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">1. Cargar Archivo</Typography>
                <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: 'text.secondary', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer', my: 2 }}>
                    <input {...getInputProps()} />
                    {materialsFile ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleOutlineIcon color="success" />
                            <Typography sx={{ flexGrow: 1, textAlign: 'left', ml: 1 }}>{materialsFile.name}</Typography>
                            <IconButton onClick={handleRemoveFile}><DeleteIcon /></IconButton>
                        </Box>
                    ) : (<UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />)}
                </Box>
            </Paper>

            {/* Paso 2: Opciones adicionales de entidades */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">2. Opciones Adicionales</Typography>
                <FormControlLabel control={<Switch checked={showEntitiesSelector} onChange={(e) => setShowEntitiesSelector(e.target.checked)} />} label="Añadir Entidades" />
                {showEntitiesSelector && (
                    <Box>
                        <Autocomplete
                            multiple
                            options={entities}
                            value={selectedEntities.map(se => se.entity)}
                            getOptionLabel={(option) => option.NameEsp || (option['Registry name']?.replace('minecraft:', '') || '')}
                            onChange={handleEntitySelectionChange}
                            isOptionEqualToValue={(option, value) => option['Registry name'] === value['Registry name']}
                            renderInput={(params) => <TextField {...params} variant="outlined" label="Buscar y añadir entidades" />}
                            sx={{ mt: 2 }}
                        />
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {selectedEntities.map((item, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography sx={{ flexGrow: 1 }}>{item.entity.NameEsp || item.entity['Registry name']}</Typography>
                                    <TextField
                                        type="number"
                                        label="Cantidad"
                                        size="small"
                                        value={item.quantity}
                                        onChange={(e) => handleEntityQuantityChange(item.entity['Registry name'], e.target.value)}
                                        inputProps={{ min: 1, style: { width: '60px' } }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Paper>
            {/* Paso 3: Generar imagen y mostrar vistas previas */}
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
