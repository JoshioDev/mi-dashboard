import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stepper, Step, StepLabel, StepContent, Paper, CircularProgress,
  TextField, FormGroup, FormControlLabel, Checkbox, Autocomplete, List, ListItem,
  ListItemText, Collapse, IconButton, Stack, Alert, Tooltip
} from '@mui/material';
import { useDropzone } from 'react-dropzone';

// Icons
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


// --- Componente de selección de versiones (reutilizado) ---
const VersionSelector = ({ versionsData, selected, onSelectionChange }) => {
    const [open, setOpen] = useState({});
    const handleParentClick = (parent) => setOpen(prev => ({ ...prev, [parent]: !prev[parent] }));

    const handleParentChange = (parent, children) => {
        const allChildrenSelected = children.every(child => selected.includes(child));
        let newSelected = [...selected];
        if (allChildrenSelected) {
            newSelected = newSelected.filter(id => id !== parent && !children.includes(id));
        } else {
            newSelected.push(...children, parent);
            newSelected = [...new Set(newSelected)];
        }
        onSelectionChange(newSelected);
    };

    const handleChildChange = (child, parent, children) => {
        let newSelected = [...selected];
        if (newSelected.includes(child)) {
            newSelected = newSelected.filter(id => id !== child);
        } else {
            newSelected.push(child);
        }
        const allChildrenSelectedAfterChange = children.every(c => newSelected.includes(c));
        if (allChildrenSelectedAfterChange && !newSelected.includes(parent)) newSelected.push(parent);
        else if (!allChildrenSelectedAfterChange && newSelected.includes(parent)) newSelected = newSelected.filter(id => id !== parent);
        onSelectionChange([...new Set(newSelected)]);
    };

    return (
        <Paper variant="outlined" sx={{ height: 200, overflowY: 'auto' }}>
            <List dense component="nav">
                {Object.keys(versionsData).map(parent => {
                    const children = versionsData[parent];
                    const allChildrenSelected = children.every(child => selected.includes(child));
                    const isIndeterminate = children.some(child => selected.includes(child)) && !allChildrenSelected;
                    return (
                        <React.Fragment key={parent}>
                            <ListItem>
                                <Checkbox edge="start" checked={allChildrenSelected} indeterminate={isIndeterminate} onChange={() => handleParentChange(parent, children)} />
                                <ListItemText primary={parent} sx={{ fontWeight: 'bold' }} />
                                <IconButton edge="end" onClick={() => handleParentClick(parent)}><ExpandMoreIcon /></IconButton>
                            </ListItem>
                            <Collapse in={open[parent]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {children.map(child => (
                                        <ListItem key={child} sx={{ pl: 4 }}>
                                            <Checkbox edge="start" checked={selected.includes(child)} onChange={() => handleChildChange(child, parent, children)} />
                                            <ListItemText primary={child} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </React.Fragment>
                    );
                })}
            </List>
        </Paper>
    );
};

// --- Componente principal del flujo Express ---
const ExpressGenerator = ({ settings }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const [materialsFile, setMaterialsFile] = useState(null);
    const [timestampsFile, setTimestampsFile] = useState(null);
    const [descInfo, setDescInfo] = useState({
        introText: "En este video te muestro como construir...",
        selectedVersions: [],
        platforms: { java: true, bedrock: false },
        creator: '@Insanity21',
        musicUrls: '',
    });
    const [creatorHistory] = useState(['@Insanity21']);
    const versionsData = {
        '1.17': ['1.17.1'], '1.18': ['1.18.1', '1.18.2'], '1.19': ['1.19.1', '1.19.2', '1.19.3', '1.19.4'],
        '1.20': ['1.20.1', '1.20.2', '1.20.3', '1.20.4', '1.20.5', '1.20.6'], '1.21': ['1.21']
    };

    const [generatedImage, setGeneratedImage] = useState(null);
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);


    const handleDescChange = (field, value) => setDescInfo(p => ({ ...p, [field]: value }));

    const handleReset = () => {
        setActiveStep(0); setIsProcessing(false); setError('');
        setMaterialsFile(null); setTimestampsFile(null);
        setGeneratedImage(null); setGeneratedDescription('');
        setDescInfo({
            introText: "En este video te muestro como construir...", selectedVersions: [],
            platforms: { java: true, bedrock: false }, creator: '@Insanity21', musicUrls: '',
        });
    };
    
    const handleDownloadZip = async () => {
        const zip = new window.JSZip();
        zip.file("descripcion.txt", generatedDescription);
        
        if (generatedImage) {
            const imageBlob = await (await fetch(generatedImage)).blob();
            zip.file("lista_materiales.png", imageBlob);
        }

        const zipBlob = await zip.generateAsync({type:"blob"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = "Express_Assets.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyToClipboard = () => {
        if (!generatedDescription) return;
        navigator.clipboard.writeText(generatedDescription).then(() => {
            setCopyTooltipOpen(true);
            setTimeout(() => setCopyTooltipOpen(false), 2000);
        }).catch(err => {
            console.error('Error al copiar al portapapeles', err);
        });
    };

    const handleProcessAll = async () => {
        if (!materialsFile) {
            setError("El archivo de materiales es obligatorio.");
            return;
        }
        if (typeof window.Papa === 'undefined' || typeof window.JSZip === 'undefined') {
            setError("Error: Las librerías PapaParse o JSZip no están cargadas.");
            return;
        }
        setIsProcessing(true);
        setError('');
        setGeneratedImage(null);
        setGeneratedDescription('');

        try {
            const drawImage = () => new Promise(async (resolve, reject) => {
                try {
                    const materialsText = await materialsFile.text();
                    window.Papa.parse(materialsText, {
                        header: true, skipEmptyLines: true,
                        complete: async (parsedMaterials) => {
                            try {
                                const itemsMapResponse = await fetch('/items_map.csv');
                                const itemsMapText = await itemsMapResponse.text();
                                const itemsMap = new Map(window.Papa.parse(itemsMapText, { header: true, skipEmptyLines: true }).data.map(item => [item.Name, item]));
                                
                                let combinedList = parsedMaterials.data.filter(row => row.Item && row.Item.trim() !== '').map(mat => ({ ...mat, type: 'item' }));
                                combinedList.push({ Item: 'Bloques temporales', Total: 64, type: 'custom', imagePath: '/items/dirt.png' });
                                
                                const canvas = document.createElement('canvas');
                                const [width, height] = settings.downloadResolution.split('x').map(Number);
                                canvas.width = width; canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                const scale = canvas.width / 1920;
                                
                                await document.fonts.load('900 10px Poppins');
                                await document.fonts.load('600 10px Poppins');
                                await document.fonts.load('500 10px Poppins');

                                const loadImage = (src) => new Promise((resolveImg) => {
                                    const img = new Image();
                                    img.onload = () => resolveImg(img);
                                    img.onerror = () => resolveImg(null);
                                    img.src = src;
                                });
                                
                                const loadedImages = await Promise.all(combinedList.map(item => item.type === 'custom' ? loadImage(item.imagePath) : loadImage(`/items/${itemsMap.get(item.Item)?.ItemID || item.Item}.png`)));

                                ctx.beginPath();
                                ctx.roundRect(0, 0, canvas.width, canvas.height, [20 * scale]);
                                ctx.clip();
                                ctx.fillStyle = 'rgba(17, 17, 17, 0.95)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.fillStyle = 'rgba(200, 200, 220, 0.9)'; ctx.font = `900 ${90 * scale}px Poppins`; ctx.textAlign = 'center';
                                ctx.fillText(settings.imageTitle.toUpperCase(), canvas.width / 2, 160 * scale);
                                ctx.fillStyle = 'rgba(187, 187, 187, 0.8)'; ctx.font = `600 ${35 * scale}px Poppins`;
                                ctx.fillText(settings.imageSubtitle.toUpperCase(), canvas.width / 2, 215 * scale);
                                
                                const columns = 3;
                                const gridPadding = 100 * scale;
                                const columnWidth = (canvas.width - (gridPadding * 2)) / columns;
                                const startY = 280 * scale;
                                const itemPadding = 30 * scale;
                                const itemBoxHeight = 100 * scale;

                                combinedList.forEach((item, index) => {
                                    const img = loadedImages[index];
                                    if(!img) return;
                                    const col = index % columns; const row = Math.floor(index / columns);
                                    const x = gridPadding + (col * columnWidth); const y = startY + (row * (itemBoxHeight + itemPadding));
                                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                                    const iconBgSize = 80 * scale;
                                    ctx.beginPath();
                                    ctx.roundRect(x, y + (itemBoxHeight - iconBgSize) / 2, iconBgSize, iconBgSize, [12 * scale]);
                                    ctx.fill();
                                    const iconSize = 56 * scale;
                                    ctx.drawImage(img, x + (iconBgSize - iconSize) / 2, y + (itemBoxHeight - iconSize) / 2, iconSize, iconSize);
                                    
                                    let name = itemsMap.get(item.Item)?.NameEsp || item.Item;
                                    if (itemsMap.get(item.Item)?.ItemID === settings.buildingBlockId) name = 'Bloques de construcción';
                                    if (item.type === 'custom') name = item.Item;
                                    
                                    const textX = x + iconBgSize + (25 * scale);
                                    ctx.fillStyle = '#ffffff'; ctx.font = `600 ${35 * scale}px Poppins`; ctx.textAlign = 'left';
                                    ctx.fillText(name, textX, y + (itemBoxHeight / 2) + (10*scale));

                                    if (item.type !== 'custom') {
                                      ctx.fillStyle = '#94A3B8'; ctx.font = `500 ${30 * scale}px Poppins`; ctx.textAlign = 'right';
                                      ctx.fillText(`x${item.Total}`, x + columnWidth - (itemPadding*1.5), y + itemBoxHeight - (10*scale));
                                    }
                                });
                                resolve(canvas.toDataURL('image/png'));
                            } catch (e) { reject(e) }
                        }
                    });
                } catch (e) { reject(e); }
            });

            setGeneratedImage(await drawImage());
            
            const pyodide = await window.loadPyodide();
            const materialsText = await materialsFile.text();
            const itemsMapText = await (await fetch('/items_map.csv')).text();
            const listScript = await (await fetch('/generate_description_list.py')).text();
            await pyodide.runPythonAsync(listScript);
            pyodide.globals.set("csv_string", materialsText);
            pyodide.globals.set("items_map_string", itemsMapText);
            pyodide.globals.set("building_block_id", settings.buildingBlockId);
            const materialsListText = pyodide.runPython("format_materials_list(csv_string, items_map_string, building_block_id)");

            let timestampsText = '';
            if(timestampsFile) {
                const timestampsScript = await (await fetch('/generate_timestamps.py')).text();
                await pyodide.runPythonAsync(timestampsScript);
                pyodide.globals.set("csv_string", await timestampsFile.text());
                timestampsText = pyodide.runPython("format_timestamps(csv_string)");
            }

            let musicSegment = '(Aquí irá la música)';
            const urlsArray = descInfo.musicUrls.split('\n').filter(url => url.trim() !== '');
            if (urlsArray.length > 0) {
                const response = await fetch('http://localhost:5000/extract_music_credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoUrls: urlsArray }) });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Error del servidor de música');
                musicSegment = data.musicSection;
            }

            const majorVersions = Object.keys(versionsData).filter(p => versionsData[p].every(c => descInfo.selectedVersions.includes(c)));
            const individualVersions = descInfo.selectedVersions.filter(v => !majorVersions.some(p => versionsData[p].includes(v)) && !versionsData[v]);
            const formattedVersions = [...new Set([...majorVersions, ...individualVersions])].sort().join(' - ');
            let platformText = "🎮 Plataforma: " + (descInfo.platforms.java ? "Java ✅" : "") + (descInfo.platforms.bedrock ? (descInfo.platforms.java ? " - " : "") + "Bedrock ✅" : "");
            
            const finalDesc = `
${descInfo.introText}

⛏ Lista de materiales:
${materialsListText}

❰ Sobre La Granja ❱
📟 Versiones: ${formattedVersions || 'No especificadas'}
${platformText}
🤖 Creador original: ${descInfo.creator || 'No especificado'}

❰ Redes Sociales ❱
🐦 Twitter ➞    https://x.com/iNordap 
🔴 Twitch ➞    https://www.twitch.tv/iNordap 
🎵 Tik tok ➞    https://www.tiktok.com/@iNordap
📧 Email ➞ contactoinordap@gmail.com

¿Quieres jugar Minecraft con tus amigos? Te recomiendo alquilar un servidor en ZAP-Hosting, además apoyas al canal simplemente dando clic en el siguiente enlace. Usa el código "iNordap-a-8942" para un 20% de descuento ➞ https://zap-hosting.com/inordap

❰ Musica ❱
____________________________________________________

${musicSegment}

____________________________________________________
${timestampsText ? `\n\n⏰ Timestamps:\n${timestampsText}` : ''}
            `.trim();
            setGeneratedDescription(finalDesc);
            // CORRECCIÓN: Ir al paso final, que es igual a la longitud del array de pasos.
            setActiveStep(steps.length);

        } catch (e) {
            setError(`Se produjo un error: ${e.message}`);
             // CORRECCIÓN: Ir al paso final también en caso de error para mostrar el mensaje.
            setActiveStep(steps.length);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const Dropzone = ({file, setFile, label}) => {
        const onDrop = useCallback(acceptedFiles => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
            }
        }, [setFile]);

        const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: {'text/csv':['.csv']} });

        return (
            <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: 'text.secondary', borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer', mt: 1 }}>
                <input {...getInputProps()} />
                {file ? (
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CheckCircleOutlineIcon color="success" />
                        <Typography>{file.name}</Typography>
                        <IconButton onClick={(e) => {e.stopPropagation(); setFile(null);}}><DeleteIcon /></IconButton>
                    </Stack>
                ) : (
                    <Stack direction="column" alignItems="center" justifyContent="center" sx={{py: 1}}>
                        <UploadFileIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                        <Typography color="text.secondary" variant="body2">{label}</Typography>
                    </Stack>
                )}
            </Box>
        );
    };

    const steps = [
        { label: 'Cargar Archivos', content: (
            <Stack spacing={2}>
                <Typography variant="subtitle1">Lista de Materiales (Requerido)</Typography>
                <Dropzone file={materialsFile} setFile={setMaterialsFile} label="Arrastra o haz clic para subir" />
                <Typography variant="subtitle1">Timestamps (Opcional)</Typography>
                <Dropzone file={timestampsFile} setFile={setTimestampsFile} label="Arrastra o haz clic para subir"/>
            </Stack>
        ) },
        { label: 'Detalles de la Descripción', content: (
            <Stack spacing={3} sx={{mt:2}}>
                <TextField label="Texto de Introducción" multiline rows={3} value={descInfo.introText} onChange={(e) => handleDescChange('introText', e.target.value)} />
                <VersionSelector versionsData={versionsData} selected={descInfo.selectedVersions} onSelectionChange={(v) => handleDescChange('selectedVersions', v)} />
                <Stack direction="row" spacing={2}>
                    <FormGroup><FormControlLabel control={<Checkbox checked={descInfo.platforms.java} onChange={e => handleDescChange('platforms', {...descInfo.platforms, java: e.target.checked})}/>} label="Java" /></FormGroup>
                    <FormGroup><FormControlLabel control={<Checkbox checked={descInfo.platforms.bedrock} onChange={e => handleDescChange('platforms', {...descInfo.platforms, bedrock: e.target.checked})}/>} label="Bedrock" /></FormGroup>
                </Stack>
                <Autocomplete freeSolo options={creatorHistory} value={descInfo.creator} onChange={(e, v) => handleDescChange('creator', v || '')} onInputChange={(e, v) => handleDescChange('creator', v)} renderInput={(params) => <TextField {...params} label="Creador Original" />} />
                <TextField label="URLs de Música (una por línea)" multiline rows={3} value={descInfo.musicUrls} onChange={(e) => handleDescChange('musicUrls', e.target.value)} />
            </Stack>
        ) }
    ];

    const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
    const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);
    
    return (
        <Box>
            {activeStep < steps.length && (
                <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                        <Step key={step.label} active={activeStep === index}>
                            <StepLabel>{step.label}</StepLabel>
                            <StepContent>
                                {step.content}
                                <Box sx={{ mt: 3 }}>
                                    {index < steps.length - 1 ? (
                                        <Button variant="contained" onClick={handleNext} disabled={index === 0 && !materialsFile}>
                                            Siguiente
                                        </Button>
                                    ) : (
                                        <Button variant="contained" onClick={handleProcessAll} disabled={isProcessing}>
                                            {isProcessing ? <CircularProgress size={24}/> : "Generar Todo"}
                                        </Button>
                                    )}
                                    <Button disabled={index === 0} onClick={handleBack} sx={{ ml: 1 }}>Atrás</Button>
                                </Box>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
            )}
            
            {activeStep === steps.length && (
                 <Paper square elevation={0} sx={{ p: 3, mt: 2, backgroundColor:'transparent' }}>
                     <Typography variant="h6">¡Proceso completado!</Typography>
                     {isProcessing ? (
                         <Box sx={{display: 'flex', justifyContent: 'center', my: 4}}><CircularProgress/></Box>
                     ) : error ? (
                         <Alert severity="error" sx={{mt:2}}>{error}</Alert>
                     ) : (
                        <Stack spacing={3} sx={{mt:2}}>
                            {generatedImage && <Box component="img" src={generatedImage} sx={{maxWidth: '100%', borderRadius: 2}} alt="Lista de materiales generada"/>}
                            {generatedDescription && (
                                <Box>
                                     <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                                        <Typography variant="h6">Descripción</Typography>
                                        <Tooltip open={copyTooltipOpen} onClose={() => setCopyTooltipOpen(false)} title="¡Copiado!" placement="top">
                                            <IconButton onClick={handleCopyToClipboard}><ContentCopyIcon /></IconButton>
                                        </Tooltip>
                                     </Box>
                                    <TextField multiline fullWidth value={generatedDescription} InputProps={{readOnly: true}} maxRows={15} />
                                </Box>
                            )}
                        </Stack>
                     )}
                     <Stack direction="row" spacing={2} sx={{mt:3}}>
                        <Button variant="contained" onClick={handleDownloadZip} startIcon={<DownloadIcon />} disabled={isProcessing || !!error}>Descargar ZIP</Button>
                        <Button onClick={handleReset} startIcon={<RestartAltIcon />}>Empezar de Nuevo</Button>
                     </Stack>
                 </Paper>
            )}
        </Box>
    );
};

export default ExpressGenerator;
