// src/utils/formatMaterialsListWithPyodide.js

/**
 * Genera el bloque de "lista de materiales" usando Pyodide y el script Python.
 * @param {string} csvText - Contenido del archivo CSV de materiales
 * @param {string} itemsMapText - Contenido de items_map.csv
 * @param {string} buildingBlockId
 * @param {string} scriptUrl - Ruta del script Python ('/generate_description_list.py')
 * @param {object} pyodide - Instancia de Pyodide ya cargada
 * @returns {Promise<string>} Texto formateado de materiales
 */
export async function formatMaterialsListWithPyodide(
  csvText,
  itemsMapText,
  buildingBlockId,
  scriptUrl,
  pyodide
) {
  // Carga el script Python
  const pyScriptResponse = await fetch(scriptUrl);
  if (!pyScriptResponse.ok) throw new Error("No se pudo cargar el script de materiales.");
  const pythonScript = await pyScriptResponse.text();

  // Ejecuta el script con Pyodide
  await pyodide.runPythonAsync(pythonScript);
  pyodide.globals.set("csv_string", csvText);
  pyodide.globals.set("items_map_string", itemsMapText);
  pyodide.globals.set("building_block_id", buildingBlockId);

  const result = pyodide.runPython("format_materials_list(csv_string, items_map_string, building_block_id)");
  if (!result) throw new Error("No se pudo generar la lista de materiales.");
  return result;
}
