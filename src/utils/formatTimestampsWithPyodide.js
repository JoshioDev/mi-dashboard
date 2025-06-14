// src/utils/formatTimestampsWithPyodide.js

/**
 * Formatea el contenido de un archivo de timestamps usando Pyodide y el script Python.
 * Agrega automáticamente la cabecera "⏰ Timestamps:" antes del resultado.
 * @param {string} rawCsvText - Contenido del archivo CSV
 * @param {string} scriptUrl - Ruta al script Python (ej: '/generate_timestamps.py')
 * @param {object} pyodide - instancia de Pyodide (ya cargada)
 * @returns {Promise<string>} - Texto formateado para pegar en YouTube
 */
export async function formatTimestampsWithPyodide(rawCsvText, scriptUrl, pyodide) {
    // Cargar script Python
    const pyScriptResponse = await fetch(scriptUrl);
    if (!pyScriptResponse.ok) throw new Error("No se pudo cargar el script de procesamiento de timestamps.");
    const pythonScript = await pyScriptResponse.text();

    // Ejecutar en Pyodide
    await pyodide.runPythonAsync(pythonScript);
    pyodide.globals.set("csv_string", rawCsvText);
    const result = pyodide.runPython("format_timestamps(csv_string)");

    if (!result) {
        throw new Error("No se encontraron timestamps válidos. Verifica el formato y columnas del archivo.");
    }

    // Agrega la cabecera y un salto de línea extra para formato limpio
    return `⏰ Timestamps:\n${result}`;
}
