import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const DatapackGenerator = ({ packFormat }) => {
    const [pyodide, setPyodide] = useState(null);
    const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [materialsFile, setMaterialsFile] = useState(null);

    useEffect(() => {
        async function loadPyodide() {
            try {
                const pyodideInstance = await window.loadPyodide();
                await pyodideInstance.loadPackage(['micropip']);
                setPyodide(pyodideInstance);
                setIsLoadingPyodide(false);
            } catch (error) {
                console.error("Error al cargar Pyodide para Datapack:", error);
                setIsLoadingPyodide(false);
            }
        }
        loadPyodide();
    }, []);

    const handleGenerateDatapack = async () => {
        if (!pyodide || !materialsFile) {
            alert("Por favor, carga Pyodide y un archivo de materiales primero.");
            return;
        }
        setIsGenerating(true);
        let pyodideResult = null;

        try {
            const itemsMapResponse = await fetch('/items_map.csv');
            const itemsMapCsvStr = await itemsMapResponse.text();
            
            const pyScriptResponse = await fetch('/generate_datapack.py');
            const pythonScript = await pyScriptResponse.text();

            const materialsCsvStr = await materialsFile.text();
            
            await pyodide.runPythonAsync(pythonScript);
            pyodide.globals.set("materiales_csv_str", materialsCsvStr);
            pyodide.globals.set("items_map_csv_str", itemsMapCsvStr);
            pyodide.globals.set("pack_format", packFormat);
            
            pyodideResult = await pyodide.runPythonAsync(`
                from pyodide.ffi import to_js
                files, errs = generar_datapack(materiales_csv_str, items_map_csv_str, pack_format)
                to_js({"files": files, "errors": errs})
            `);
            
            const datapack_files = pyodideResult.get("files");
            const errors = pyodideResult.get("errors");

            if (errors && errors.length > 0) {
                alert(`Se encontraron errores/advertencias:\n\n- ${errors.join('\n- ')}`);
            }

            if (datapack_files && datapack_files.size > 0) {
                const zip = new JSZip();
                const rootFolder = zip.folder("Utilities");
                for (const [path, content] of datapack_files.entries()) {
                     rootFolder.file(path, content);
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                
                const link = document.createElement("a");
                link.href = URL.createObjectURL(zipBlob);
                link.download = "Utilities.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                 if (!errors || errors.length === 0) {
                    alert("No se generaron archivos.");
                 }
            }
        } catch (error) {
            console.error("Error al generar el datapack:", error);
            alert("Ocurrió un error crítico al generar el datapack.");
        } finally {
            setIsGenerating(false);
            if (pyodideResult) pyodideResult.destroy();
        }
    };

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) setMaterialsFile(acceptedFiles[0]);
    }, []);

    const handleRemoveFile = (event) => {
        event.stopPropagation();
        setMaterialsFile(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

    return (
        <Box>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Arrastra y suelta tu archivo <code>.csv</code> con la lista de materiales aquí. Se generará un datapack con los comandos de `config` y `materiales`.
            </Typography>
            <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: 'text.secondary', borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer', my: 2 }}>
                <input {...getInputProps()} />
                {materialsFile ? (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <CheckCircleOutlineIcon color="success" />
                        <Typography sx={{ flexGrow: 1, textAlign: 'left', ml:1 }}>{materialsFile.name}</Typography>
                        <IconButton onClick={handleRemoveFile}><DeleteIcon /></IconButton>
                    </Box>
                ) : ( <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} /> )}
            </Box>
            <Button variant="contained" onClick={handleGenerateDatapack} disabled={!materialsFile || isGenerating || isLoadingPyodide} sx={{mt: 2}} startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}>
                {isLoadingPyodide ? "Cargando componentes..." : isGenerating ? "Generando..." : "Generar Datapack"}
            </Button>
        </Box>
    );
};

export default DatapackGenerator;
