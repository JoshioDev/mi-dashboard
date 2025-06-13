import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, Switch, FormControlLabel } from '@mui/material';
import JSZip from 'jszip';
import FileDropzone from './shared/FileDropzone';
import EntitySelector from './shared/EntitySelector';
import ErrorAlert from './shared/ErrorAlert';
import PreviewGallery from './shared/PreviewGallery';
import useCSVMap from '../hooks/useCSVMap';
import { useSnackbar } from '../hooks/useSnackbar'; // Importa el hook

const MaterialsImageGenerator = ({ buildingBlockId, downloadResolution, imageTitle, imageSubtitle }) => {
    // Usar el custom hook para cargar items y entidades
    const { map: itemsMap, data: itemsData, error: itemsError } = useCSVMap('/items_map.csv', 'Name');
    const { map: entitiesMap, data: entities, error: entitiesError } = useCSVMap('/entities_map.csv', 'Registry name');

    const [materialsFile, setMaterialsFile] = useState(null);
    const [showEntitiesSelector, setShowEntitiesSelector] = useState(false);
    const [selectedEntities, setSelectedEntities] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewImages, setPreviewImages] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    const { showSnackbar } = useSnackbar(); // Inicializa el hook

    // Manejo de errores de carga de CSVs
    useEffect(() => {
      if (itemsError) setErrorMsg('Error al cargar items: ' + itemsError.message);
      else if (entitiesError) setErrorMsg('Error al cargar entidades: ' + entitiesError.message);
    }, [itemsError, entitiesError]);

    // Función principal para generar imágenes (descarga o preview)
    const generateImage = async (isDownload = false) => {
        setErrorMsg(null);
        if (!materialsFile) {
            setErrorMsg("Por favor, sube un archivo de materiales.");
            showSnackbar("Por favor, sube un archivo de materiales.", "error");
            return;
        }
        setIsGenerating(true);
        if (!isDownload) setPreviewImages([]);
        try {
            try {
                await document.fonts.load('900 10px Poppins');
                await document.fonts.load('600 10px Poppins');
                await document.fonts.load('500 10px Poppins');
            } catch (err) {}

            const materialsText = await materialsFile.text();
            // CSV de materiales a array de objetos
            const lines = materialsText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((h, i) => obj[h] = values[i]);
                return obj;
            }).filter(obj => obj.Item && obj.Item !== '' && !isNaN(Number(obj.Total)));

            if (!data || !Array.isArray(data) || data.length === 0) {
                setErrorMsg("El archivo de materiales está vacío o mal formateado.");
                showSnackbar("El archivo de materiales está vacío o mal formateado.", "error");
                setIsGenerating(false);
                return;
            }
            let combinedList = data.map(mat => ({ ...mat, type: 'item' }));

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

            const ITEMS_PER_PAGE = 18;
            const pages = [];
            for (let i = 0; i < combinedList.length; i += ITEMS_PER_PAGE) {
                pages.push(combinedList.slice(i, i + ITEMS_PER_PAGE));
            }

            const generatedImages = [];
            for (let i = 0; i < pages.length; i++) {
                try {
                    const canvas = await drawSingleImage(pages[i], i + 1, pages.length, isDownload);
                    generatedImages.push(canvas);
                } catch (err) {
                    setErrorMsg("Error al generar la imagen de materiales. Verifica que los datos sean válidos.");
                    showSnackbar("Error al generar la imagen de materiales.", "error");
                    console.error(err);
                    break;
                }
            }

            if (isDownload) {
                if (generatedImages.length === 0) {
                    setErrorMsg("No se pudo generar ninguna imagen para descargar.");
                    showSnackbar("No se pudo generar ninguna imagen para descargar.", "error");
                    setIsGenerating(false);
                    return;
                }
                if (generatedImages.length === 1) {
                    const link = document.createElement('a');
                    link.download = 'lista_de_materiales.png';
                    link.href = generatedImages[0].toDataURL('image/png');
                    link.click();
                    showSnackbar("¡Imagen descargada correctamente!", "success");
                } else {
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
                    showSnackbar("¡Imágenes descargadas correctamente!", "success");
                }
            } else {
                setPreviewImages(generatedImages.map(canvas => canvas.toDataURL('image/png')));
                showSnackbar("¡Vista previa generada con éxito!", "success");
            }
        } catch (error) {
            setErrorMsg("Error inesperado al procesar la imagen: " + error.message);
            showSnackbar("Error inesperado al procesar la imagen.", "error");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Función de renderizado de imagen individual (igual que antes)
    const drawSingleImage = async (pageItems, pageNum, totalPages, isDownload) => {
        const canvas = document.createElement('canvas');
        const [width, height] = (isDownload ? downloadResolution : '1280x720').split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / 1920;

        const loadImage = (src) => new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

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

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            const iconBgSize = 80 * scale;
            ctx.beginPath();
            ctx.roundRect(x, y + (itemBoxHeight - iconBgSize) / 2, iconBgSize, iconBgSize, [12 * scale]);
            ctx.fill();

            const iconSize = 56 * scale;
            if (img) {
                ctx.drawImage(img, x + (iconBgSize - iconSize) / 2, y + (itemBoxHeight - iconSize) / 2, iconSize, iconSize);
            } else {
                ctx.font = `900 ${24 * scale}px Poppins`;
                ctx.fillStyle = '#AAA';
                ctx.textAlign = 'center';
                ctx.fillText('?', x + iconBgSize / 2, y + (itemBoxHeight / 2) + 12 * scale);
            }

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

            if (item.type !== 'custom') {
                ctx.fillStyle = '#94A3B8';
                ctx.font = `500 ${30 * scale}px Poppins`;
                ctx.textAlign = 'right';
                ctx.fillText(`x${item.Total}`, x + columnWidth - (itemPadding * 1.5), y + itemBoxHeight - (10 * scale));
            }
        });

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = `500 ${22 * scale}px Poppins`;
        ctx.textAlign = 'left';
        ctx.fillText('youtube.com/@inordap', gridPadding, canvas.height - (30 * scale));

        if (totalPages > 1) {
            ctx.textAlign = 'right';
            ctx.fillText(`${pageNum}/${totalPages}`, canvas.width - gridPadding, canvas.height - (30 * scale));
        }
        return canvas;
    };

    return (
        <Box>
            <ErrorAlert message={errorMsg} onClose={() => setErrorMsg(null)} />
            {/* Paso 1: Cargar archivo de materiales */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">1. Cargar Archivo</Typography>
                <FileDropzone
                  file={materialsFile}
                  onFileChange={setMaterialsFile}
                  onRemove={() => { setMaterialsFile(null); setPreviewImages([]); }}
                  label="Arrastra o haz clic para subir el .csv de materiales"
                />
            </Paper>
            {/* Paso 2: Opciones adicionales de entidades */}
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
                <PreviewGallery images={previewImages} />
            </Paper>
        </Box>
    );
};

export default MaterialsImageGenerator;
