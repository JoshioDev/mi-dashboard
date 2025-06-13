import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Box, Typography, Button, CircularProgress, IconButton, Paper, TextField, Tooltip } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const TimestampsFormatter = () => {
    const [pyodide, setPyodide] = useState(null);
    const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputFile, setInputFile] = useState(null);
    const [outputText, setOutputText] = useState('');
    const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);
    const [error, setError] = useState(''); // Estado para gestionar los mensajes de error

    useEffect(() => {
        async function loadPyodide() {
            try {
                const pyodideInstance = await window.loadPyodide();
                setPyodide(pyodideInstance);
            } catch (error) {
                console.error("Error al cargar Pyodide:", error);
                setError("No se pudo cargar el componente principal de procesamiento.");
            } finally {
                setIsLoadingPyodide(false);
            }
        }
        loadPyodide();
    }, []);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setInputFile(acceptedFiles[0]);
            setOutputText(''); 
            setError(''); // Limpiar errores al subir un nuevo archivo
        }
    }, []);

    const handleRemoveFile = (event) => {
        event.stopPropagation();
        setInputFile(null);
        setOutputText('');
        setError(''); // Limpiar errores al quitar el archivo
    };

    const handleFormatTimestamps = async () => {
        if (!pyodide || !inputFile) {
            setError("Por favor, carga un archivo primero.");
            return;
        }
        setIsProcessing(true);
        setError('');
        setOutputText('');

        try {
            // Paso 1: Cargar el script de Python con manejo de errores
            const pyScriptResponse = await fetch('/generate_timestamps.py');
            if (!pyScriptResponse.ok) {
                throw new Error("No se pudo cargar el script de procesamiento. (generate_timestamps.py no encontrado en la carpeta /public)");
            }
            const pythonScript = await pyScriptResponse.text();
            const fileContent = await inputFile.text();

            // Paso 2: Ejecutar el script en Pyodide
            await pyodide.runPythonAsync(pythonScript);
            pyodide.globals.set("csv_string", fileContent);
            const result = pyodide.runPython("format_timestamps(csv_string)");
            
            // Paso 3: Validar el resultado del script
            if (!result) {
                setError("No se encontraron timestamps válidos. Asegúrate de que el formato es correcto, el archivo está separado por tabulaciones y las columnas se llaman 'Nombre del marcador' y 'Entrada'.");
            } else {
                setOutputText(result);
            }

        } catch (error) {
            console.error("Error al formatear los timestamps:", error);
            setError(`Ocurrió un error inesperado al procesar el archivo. (${error.message})`);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        if (!outputText) return;
        
        const textArea = document.createElement("textarea");
        textArea.value = outputText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopyTooltipOpen(true);
            setTimeout(() => setCopyTooltipOpen(false), 2000); 
        } catch (err) {
            console.error('No se pudo copiar el texto: ', err);
        }
        document.body.removeChild(textArea);
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">1. Cargar Archivo de Timestamps (.csv)</Typography>
                 <Typography variant="body2" color="text.secondary" gutterBottom>
                  Sube un archivo <code>.csv</code> separado por tabulaciones. El script buscará las columnas "Nombre del marcador" y "Entrada".
                </Typography>
                <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: 'text.secondary', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer', my: 2 }}>
                    <input {...getInputProps()} />
                    {inputFile ? (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <CheckCircleOutlineIcon color="success" />
                            <Typography sx={{ flexGrow: 1, textAlign: 'left', ml:1 }}>{inputFile.name}</Typography>
                            <IconButton onClick={handleRemoveFile}><DeleteIcon /></IconButton>
                        </Box>
                    ) : ( <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} /> )}
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                 <Typography variant="h6">2. Formatear</Typography>
                 <Button 
                    variant="contained" 
                    onClick={handleFormatTimestamps} 
                    disabled={!inputFile || isProcessing || isLoadingPyodide} 
                    sx={{mt: 2}}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                >
                    {isLoadingPyodide ? "Cargando..." : isProcessing ? "Procesando..." : "Formatear Timestamps"}
                </Button>
            </Paper>

            {/* Componente de Alerta para mostrar errores */}
            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

             <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                 <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography variant="h6">3. Resultado</Typography>
                    <Tooltip
                        PopperProps={{ disablePortal: true }}
                        open={copyTooltipOpen}
                        onClose={() => setCopyTooltipOpen(false)}
                        title="¡Copiado!"
                        placement="top"
                    >
                        <IconButton onClick={handleCopyToClipboard} disabled={!outputText}>
                            <ContentCopyIcon />
                        </IconButton>
                    </Tooltip>
                 </Box>
                 <TextField
                    multiline
                    fullWidth
                    rows={10}
                    value={outputText}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                    sx={{mt: 2, '& .MuiOutlinedInput-root': {fontFamily: 'monospace'} }}
                 />
            </Paper>
        </Box>
    );
};

export default TimestampsFormatter;

