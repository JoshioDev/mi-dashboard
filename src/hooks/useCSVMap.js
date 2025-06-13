import { useState, useEffect } from 'react';
import Papa from 'papaparse';

/**
 * Hook para cargar un CSV remoto y devolver sus datos y un Map indexado por la key especificada.
 * 
 * @param {string} csvUrl - URL del archivo CSV.
 * @param {string} keyField - Campo por el cual se indexará el Map.
 * @returns {object} { map, data, error }
 */
const useCSVMap = (csvUrl, keyField) => {
  const [map, setMap] = useState(new Map());
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!csvUrl || !keyField) return;
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: result => {
        if (result.errors?.length) setError(result.errors[0]);
        else {
          setData(result.data);
          setMap(new Map(result.data.map(item => [item[keyField], item])));
        }
      },
      error: err => setError(err),
    });
  }, [csvUrl, keyField]);

  return { map, data, error };
};

export default useCSVMap;
