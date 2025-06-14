import React, { useState, useRef } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, TextField } from '@mui/material';
import FileDropzone from './shared/FileDropzone';
import { useSnackbar } from '../hooks/useSnackbar';
import { formatTimestampsWithPyodide } from '../utils/formatTimestampsWithPyodide';

const TimestampsFormatter = () => {
    const { showSnackbar } = useSnackbar();

    const [inputFile, setInputFile] = useState(null);
    const [outputText, setOutputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Mantiene instancia de Pyodide viva (sólo se carga una vez por sesión)
    const pyodideRef = useRef(null);

    // Cargar Pyodide si aún no está cargado
    const loadPyodideIfNeeded = async () => {
        if (!pyodideRef.current) {
            try {
                showSnackbar("Cargando motor Python...", "info");
                pyodideRef.current = await window.loadPyodide();
                showSnackbar("Motor Python listo.", "success");
            } catch (error) {
                showSnackbar("No se pudo cargar el motor Python en tu navegador.", "error");
                throw error;
            }
        }
        return pyodideRef.current;
    };

    const handleFormatTimestamps = async () => {
        if (!inputFile) {
            showSnackbar("Por favor, carga un archivo primero.", 'error');
            return;
        }

        setIsProcessing(true);
        setOutputText('');

        try {
            const pyodide = await loadPyodideIfNeeded();
            const fileContent = await inputFile.text();
            const formatted = await formatTimestampsWithPyodide(fileContent, '/generate_timestamps.py', pyodide);

            setOutputText(formatted);
            showSnackbar("Timestamps generados correctamente.", "success");
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">Archivo de Timestamps</Typography>
                <FileDropzone
                    file={inputFile}
                    onFileChange={setInputFile}
                    onRemove={() => setInputFile(null)}
                    label="Arrastra o haz clic para subir el .csv o .txt de timestamps"
                />
            </Paper>

            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleFormatTimestamps}
                    disabled={isProcessing || !inputFile}
                    sx={{ mb: 2 }}
                >
                    {isProcessing ? <CircularProgress size={24} /> : "Formatear Timestamps"}
                </Button>
                <TextField
                    label="Resultado"
                    multiline
                    fullWidth
                    rows={10}
                    value={outputText}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                />
            </Paper>
        </Box>
    );
};

export default TimestampsFormatter;
