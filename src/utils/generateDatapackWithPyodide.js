// src/utils/generateDatapackWithPyodide.js

/**
 * Genera un datapack usando Pyodide y tu script Python.
 * @param {string} materialsCsvStr - CSV de materiales
 * @param {string} itemsMapCsvStr - items_map.csv
 * @param {number} packFormat
 * @param {string} scriptUrl
 * @param {object} pyodide
 * @returns {Promise<{files: Map, errors: Array}>}
 */
export async function generateDatapackWithPyodide(
  materialsCsvStr,
  itemsMapCsvStr,
  packFormat,
  scriptUrl,
  pyodide
) {
  const pyScriptResponse = await fetch(scriptUrl);
  if (!pyScriptResponse.ok) throw new Error("No se pudo cargar el script Python del datapack.");
  const pythonScript = await pyScriptResponse.text();

  await pyodide.runPythonAsync(pythonScript);
  pyodide.globals.set("materiales_csv_str", materialsCsvStr);
  pyodide.globals.set("items_map_csv_str", itemsMapCsvStr);
  pyodide.globals.set("pack_format", packFormat);

  const result = await pyodide.runPythonAsync(`
    from pyodide.ffi import to_js
    files, errs = generar_datapack(materiales_csv_str, items_map_csv_str, pack_format)
    to_js({"files": files, "errors": errs})
  `);
  const files = result.get("files");
  const errors = result.get("errors");
  return { files, errors };
}
