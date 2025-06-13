import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton, Paper, TextField, Tooltip, FormGroup, FormControlLabel, Checkbox, Autocomplete, List, ListItem, ListItemText, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorAlert from './shared/ErrorAlert';         // Nuevo import
import useCSVMap from '../hooks/useCSVMap';           // Nuevo import

const VersionSelector = ({ versionsData, selected, onSelectionChange }) => {
    const [open, setOpen] = useState({});

    useEffect(() => {
        const initiallyOpen = {};
        Object.keys(versionsData).forEach(parent => {
            if (versionsData[parent].some(child => selected.includes(child))) {
                initiallyOpen[parent] = true;
            }
        });
        setOpen(initiallyOpen);
    }, [selected, versionsData]);

    const handleParentClick = (parent) => {
        setOpen(prev => ({ ...prev, [parent]: !prev[parent] }));
    };

    const handleParentChange = (parent, children) => {
        const allChildrenSelected = children.every(child => selected.includes(child));
        let newSelected = [...selected];

        if (allChildrenSelected) {
            newSelected = newSelected.filter(id => id !== parent && !children.includes(id));
        } else {
            newSelected.push(...children);
            newSelected = [...new Set(newSelected)];
        }
        onSelectionChange(newSelected);
        setOpen(prev => ({ ...prev, [parent]: true }));
    };

    const handleChildChange = (child, parent, children) => {
        let newSelected = [...selected];
        if (newSelected.includes(child)) {
            newSelected = newSelected.filter(id => id !== child);
        } else {
            newSelected.push(child);
        }

        const allChildrenSelectedAfterChange = children.every(c => newSelected.includes(c));
        if (allChildrenSelectedAfterChange && !newSelected.includes(parent)) {
            newSelected.push(parent);
        } else if (!allChildrenSelectedAfterChange && newSelected.includes(parent)) {
            newSelected = newSelected.filter(id => id !== parent);
        }

        onSelectionChange([...new Set(newSelected)]);
    };

    if (!versionsData || typeof versionsData !== "object") return null;

    return (
        <Paper variant="outlined" sx={{ height: 200, overflowY: 'auto' }}>
            <List dense component="nav">
                {Object.keys(versionsData)
                  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
                  .map(parent => {
                    const children = [...versionsData[parent]].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                    const allChildrenSelected = children.every(child => selected.includes(child));
                    const isIndeterminate = children.some(child => selected.includes(child)) && !allChildrenSelected;

                    return (
                        <React.Fragment key={parent}>
                            <ListItem>
                                <Checkbox
                                    edge="start"
                                    checked={allChildrenSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={() => handleParentChange(parent, children)}
                                />
                                <ListItemText primary={parent} sx={{ fontWeight: 'bold' }} />
                                <IconButton edge="end" onClick={() => handleParentClick(parent)}>
                                    {open[parent] ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                </IconButton>
                            </ListItem>
                            <Collapse in={open[parent]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {children.map(child => (
                                        <ListItem key={child} sx={{ pl: 4 }}>
                                            <Checkbox
                                                edge="start"
                                                checked={selected.includes(child)}
                                                onChange={() => handleChildChange(child, parent, children)}
                                            />
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

const DescriptionGenerator = ({ buildingBlockId }) => {
    // Custom hook para cargar items (para validación y mapeo, si lo necesitas en el futuro)
    const { map: itemsMap, data: itemsData, error: itemsError } = useCSVMap('/items_map.csv', 'Name');

    const [introText, setIntroText] = useState("En este video te muestro como construir una granja de Botellas Ominosas para obtener el efecto de Mal Presagio para Minecraft 1.21.");
    const [materialsFile, setMaterialsFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [finalDescription, setFinalDescription] = useState("");
    const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [platforms, setPlatforms] = useState({ java: true, bedrock: false });
    const [creatorHistory, setCreatorHistory] = useState(['@Insanity21']);
    const [creator, setCreator] = useState('@Insanity21');
    const [musicUrls, setMusicUrls] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    // Manejo de error de carga de items
    useEffect(() => {
        if (itemsError) setErrorMsg('Error al cargar items: ' + itemsError.message);
    }, [itemsError]);

    const versionsData = {
        '1.21': ['1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1'],
        '1.20': ['1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1'],
        '1.19': ['1.19.4', '1.19.3', '1.19.2', '1.19.1'],
        '1.18': ['1.18.2', '1.18.1'],
        '1.17': ['1.17.1']
    };

    // Manejo de archivos (dropzone)
    const handleFileDrop = (e) => {
        const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
        if (files && files.length > 0) setMaterialsFile(files[0]);
    };

    const handleGenerateDescription = async () => {
        setIsProcessing(true);
        setFinalDescription('');
        setErrorMsg(null);

        if (!introText || introText.trim() === "") {
            setErrorMsg("La introducción del video no puede estar vacía.");
            setIsProcessing(false);
            return;
        }

        let musicSegment = '(Aquí irá la música)';
        const urlsArray = musicUrls.split('\n').filter(url => url.trim() !== '');
        if (urlsArray.length > 0) {
            try {
                const response = await fetch('http://localhost:5000/extract_music_credits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrls: urlsArray }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Error del servidor');
                musicSegment = data.musicSection;
            } catch (err) {
                setErrorMsg("Error al obtener la música: " + err.message);
                musicSegment = `ERROR al obtener la música: ${err.message}`;
            }
        }

        let materialsListText = "(Sube un archivo para generar la lista de materiales)";
        if (materialsFile) {
            try {
                const fileContent = await materialsFile.text();
                const itemsMapResponse = await fetch('/items_map.csv');
                if (!itemsMapResponse.ok) throw new Error("No se pudo cargar items_map.csv");
                const itemsMapText = await itemsMapResponse.text();
                const pyScriptResponse = await fetch('/generate_description_list.py');
                if (!pyScriptResponse.ok) throw new Error("No se pudo cargar generate_description_list.py");
                const pythonScript = await pyScriptResponse.text();

                if (!window.loadPyodide) throw new Error("Pyodide no está disponible en window");
                const pyodide = await window.loadPyodide();
                await pyodide.runPythonAsync(pythonScript);
                pyodide.globals.set("csv_string", fileContent);
                pyodide.globals.set("items_map_string", itemsMapText);
                pyodide.globals.set("building_block_id", buildingBlockId);
                materialsListText = pyodide.runPython("format_materials_list(csv_string, items_map_string, building_block_id)");
            } catch (err) {
                setErrorMsg("Error procesando la lista de materiales: " + err.message);
                materialsListText = "Error al generar la lista de materiales.";
            }
        }

        const allSubversions = Object.values(versionsData).flat();
        const selectedSubversions = allSubversions
            .filter(subv => selectedVersions.includes(subv))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const formattedVersions = selectedSubversions.join(' - ');

        let platformText = '🎮 Plataforma: ';
        if (platforms.java && platforms.bedrock) {
            platformText += 'Java ✅ - Bedrock ✅';
        } else if (platforms.java) {
            platformText += 'Java ✅ - Bedrock ❌';
        } else if (platforms.bedrock) {
            platformText += 'Java ❌ - Bedrock ✅';
        } else {
            platformText += 'No especificado';
        }

        const final_text = `
${introText}

⛏ Lista de materiales:
${materialsListText}

❰ Sobre La Granja ❱
📟 Versiones: ${formattedVersions || 'No especificadas'}
${platformText}
🤖 Creador original: ${creator || 'No especificado'}

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
        `.trim();

        setFinalDescription(final_text);
        if (creator && !creatorHistory.includes(creator)) setCreatorHistory(prev => [creator, ...prev]);
        setIsProcessing(false);
    };

    const handleCopyToClipboard = () => {
        if (!finalDescription) return;
        navigator.clipboard.writeText(finalDescription).then(() => {
            setCopyTooltipOpen(true);
            setTimeout(() => setCopyTooltipOpen(false), 2000);
        }).catch(err => {
            setErrorMsg('Error al copiar al portapapeles: ' + err.message);
        });
    };

    return (
        <Box>
            {/* Alerta de error reutilizable */}
            <ErrorAlert message={errorMsg} onClose={() => setErrorMsg(null)} />
            {/* Introducción */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">Introducción del Video</Typography>
                <TextField
                    label="Texto de Introducción"
                    multiline
                    fullWidth
                    rows={4}
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    variant="outlined"
                    sx={{ mt: 1 }}
                />
            </Paper>
            {/* Lista de Materiales */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">Lista de Materiales</Typography>
                <Box
                    sx={{
                        border: '2px dashed',
                        borderColor: 'text.secondary',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        my: 1
                    }}
                    onDrop={handleFileDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => document.getElementById('materials-file-input').click()}
                >
                    <input
                        id="materials-file-input"
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileDrop}
                    />
                    {materialsFile ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleOutlineIcon color="success" />
                            <Typography>{materialsFile.name}</Typography>
                            <IconButton onClick={e => { e.stopPropagation(); setMaterialsFile(null); }}>
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box>
                            <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                            <Typography color="text.secondary">Arrastra o haz clic para subir el .csv de materiales</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
            {/* Sobre La Granja */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">Sobre La Granja</Typography>
                <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                    <Box sx={{ width: '50%' }}>
                        <Typography variant="subtitle1" gutterBottom>Versiones Compatibles</Typography>
                        <VersionSelector versionsData={versionsData} selected={selectedVersions} onSelectionChange={setSelectedVersions} />
                    </Box>
                    <Box sx={{ width: '50%' }}>
                        <Typography variant="subtitle1" gutterBottom>Plataforma</Typography>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={platforms.java} onChange={e => setPlatforms(p => ({ ...p, java: e.target.checked }))} />} label="Java" />
                            <FormControlLabel control={<Checkbox checked={platforms.bedrock} onChange={e => setPlatforms(p => ({ ...p, bedrock: e.target.checked }))} />} label="Bedrock" />
                        </FormGroup>
                        <Autocomplete
                            freeSolo
                            options={creatorHistory}
                            value={creator}
                            onChange={(e, newValue) => setCreator(newValue || '')}
                            onInputChange={(e, newInputValue) => setCreator(newInputValue)}
                            renderInput={(params) => <TextField {...params} label="Creador Original" variant="outlined" sx={{ mt: 2 }} />}
                        />
                    </Box>
                </Box>
            </Paper>
            {/* Música */}
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">Música</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Pega una o más URLs de YouTube, una por línea.
                </Typography>
                <TextField
                    label="URLs de los videos de YouTube"
                    multiline
                    fullWidth
                    rows={3}
                    value={musicUrls}
                    onChange={(e) => setMusicUrls(e.target.value)}
                    variant="outlined"
                    placeholder="https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=..."
                />
            </Paper>
            {/* Botón y Resultado */}
            <Button variant="contained" onClick={handleGenerateDescription} disabled={isProcessing} sx={{ my: 2 }}>
                {isProcessing ? <CircularProgress size={24} /> : "Generar Descripción"}
            </Button>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Resultado Final</Typography>
                    <Tooltip open={copyTooltipOpen} onClose={() => setCopyTooltipOpen(false)} title="¡Copiado!" placement="top">
                        <IconButton onClick={handleCopyToClipboard} disabled={!finalDescription}><ContentCopyIcon /></IconButton>
                    </Tooltip>
                </Box>
                <TextField
                    multiline
                    fullWidth
                    rows={15}
                    value={finalDescription}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                    sx={{ mt: 1 }}
                />
            </Paper>
        </Box>
    );
};

export default DescriptionGenerator;
