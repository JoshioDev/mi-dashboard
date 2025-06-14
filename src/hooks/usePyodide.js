import { useRef } from 'react';
import { useSnackbar } from '../hooks/useSnackbar';

/**
 * Hook para cargar y ejecutar scripts Python en Pyodide, desde cualquier componente.
 * Provee helpers loadPyodide y runPyScript.
 */
export function usePyodide() {
  const pyodideRef = useRef(null);
  const { showSnackbar } = useSnackbar();

  // Carga Pyodide solo una vez por sesión
  const loadPyodide = async () => {
    if (!pyodideRef.current) {
      try {
        showSnackbar("Cargando motor Python...", "info");
        pyodideRef.current = await window.loadPyodide();
        showSnackbar("Motor Python listo.", "success");
      } catch (err) {
        showSnackbar("No se pudo cargar Pyodide.", "error");
        throw err;
      }
    }
    return pyodideRef.current;
  };

  /**
   * Ejecuta un script Python desde URL, setea globals y devuelve el resultado del código Python.
   * @param {string} scriptUrl - URL del archivo Python
   * @param {Object} globals - { nombre: valor } para pasar como variables globales
   * @param {string} runCode - Código Python para ejecutar (por ejemplo, "format_timestamps(csv_string)")
   */
  const runPyScript = async (scriptUrl, globals = {}, runCode = "") => {
    const pyodide = await loadPyodide();
    const scriptResp = await fetch(scriptUrl);
    if (!scriptResp.ok) throw new Error("No se pudo cargar el script Python.");
    const pythonScript = await scriptResp.text();
    await pyodide.runPythonAsync(pythonScript);
    Object.entries(globals).forEach(([key, val]) => pyodide.globals.set(key, val));
    return pyodide.runPython(runCode);
  };

  return { loadPyodide, runPyScript };
}
