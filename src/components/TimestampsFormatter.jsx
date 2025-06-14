import React, { useState } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, TextField, IconButton, Tooltip } from '@mui/material';
import FileDropzone from './shared/FileDropzone';
import { useSnackbar } from '../hooks/useSnackbar';
import { usePyodide } from '../hooks/usePyodide';
import { formatTimestampsWithPyodide } from '../utils/formatTimestampsWithPyodide';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const TimestampsFormatter = () => {
    const { showSnackbar } = useSnackbar();
    const { loadPyodide } = usePyodide();

    const [inputFile, setInputFile] = useState(null);
    const [outputText, setOutputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);

    const handleFormatTimestamps = async () => {
        if (!inputFile) {
            showSnackbar("Por favor, carga un archivo primero.", 'error');
            return;
        }

        setIsProcessing(true);
        setOutputText('');

        try {
            const fileContent = await inputFile.text();
            const pyodide = await loadPyodide();
            const result = await formatTimestampsWithPyodide(
                fileContent,
                '/generate_timestamps.py',
                pyodide
            );
            setOutputText(result);
            showSnackbar("Timestamps generados correctamente.", "success");
        } catch (error) {
            showSnackbar(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText)
            .then(() => {
                setCopyTooltipOpen(true);
                showSnackbar("¡Copiado!", "success");
                setTimeout(() => setCopyTooltipOpen(false), 1500);
            })
            .catch(err => {
                showSnackbar("No se pudo copiar al portapapeles: " + err.message, 'error');
            });
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">Resultado</Typography>
                    <Tooltip open={copyTooltipOpen} onClose={() => setCopyTooltipOpen(false)} title="¡Copiado!" placement="top">
                        <span>
                            <IconButton onClick={handleCopyToClipboard} disabled={!outputText}>
                                <ContentCopyIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
                <TextField
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
