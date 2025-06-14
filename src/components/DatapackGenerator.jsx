import React, { useState } from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import FileDropzone from './shared/FileDropzone';
import { usePyodide } from '../hooks/usePyodide';
import { useSnackbar } from '../hooks/useSnackbar';
import { generateDatapackWithPyodide } from '../utils/generateDatapackWithPyodide';
import JSZip from 'jszip';

const DatapackGenerator = ({ packFormat }) => {
    const { showSnackbar } = useSnackbar();
    const { loadPyodide } = usePyodide();

    const [materialsFile, setMaterialsFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultText, setResultText] = useState('');
    const [errors, setErrors] = useState([]);

    const handleGenerateDatapack = async () => {
        if (!materialsFile) {
            showSnackbar('Por favor, sube un archivo de materiales.', 'error');
            return;
        }
        setIsGenerating(true);
        setResultText('');
        setErrors([]);

        try {
            const pyodide = await loadPyodide();
            const materialsCsvStr = await materialsFile.text();
            const itemsMapCsvStr = await fetch('/items_map.csv').then(res => res.text());

            const { files, errors: pyErrors } = await generateDatapackWithPyodide(
                materialsCsvStr,
                itemsMapCsvStr,
                packFormat,
                '/generate_datapack.py',
                pyodide
            );

            setErrors(pyErrors || []);
            if (pyErrors && pyErrors.length > 0) {
                showSnackbar('¡El datapack se generó, pero hubo advertencias!', 'warning');
            } else {
                showSnackbar('Datapack generado correctamente.', 'success');
            }

            // Empaqueta y descarga ZIP
            const zip = new JSZip();
            for (const [name, content] of Object.entries(files)) {
                zip.file(name, content);
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'datapack.zip';
            link.click();
            setResultText('Datapack listo para descargar.');
        } catch (err) {
            showSnackbar('Error generando el datapack: ' + err.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Typography variant="h6">Archivo de Materiales</Typography>
                <FileDropzone
                    file={materialsFile}
                    onFileChange={setMaterialsFile}
                    onRemove={() => setMaterialsFile(null)}
                    label="Arrastra o haz clic para subir el .csv de materiales"
                />
            </Paper>

            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'transparent', mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleGenerateDatapack}
                    disabled={isGenerating || !materialsFile}
                    sx={{ mb: 2 }}
                >
                    {isGenerating ? <CircularProgress size={24} /> : "Generar Datapack"}
                </Button>
                {resultText && (
                    <Typography variant="body1" color="success.main">{resultText}</Typography>
                )}
                {errors.length > 0 && (
                    <Paper sx={{ mt: 2, p: 2, backgroundColor: '#fff3cd' }}>
                        <Typography variant="body2" color="warning.main">
                            Advertencias:<br />
                            {errors.map((err, idx) => (
                                <span key={idx}>{err}<br /></span>
                            ))}
                        </Typography>
                    </Paper>
                )}
            </Paper>
        </Box>
    );
};

export default DatapackGenerator;
