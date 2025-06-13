import io
import csv

def format_timestamps(csv_string):
    """
    Formatea un archivo CSV de timestamps separado por tabulaciones.
    Busca las columnas por su nombre ('Nombre del marcador', 'Entrada')
    y convierte el formato de HH:MM:SS:FF a MM:SS - Título.
    """
    output_lines = []
    f = io.StringIO(csv_string)
    # Usar DictReader para acceder a las columnas por su nombre
    reader = csv.DictReader(f, delimiter='\t')

    for row in reader:
        try:
            # CORRECCIÓN: Usar los nombres de columna correctos
            title = row.get("Nombre del marcador", "").strip()
            timestamp = row.get("Entrada", "").strip()

            if not title or not timestamp:
                continue

            # Validar y procesar el timestamp
            parts = timestamp.split(':')
            if len(parts) == 4 and all(part.isdigit() for part in parts):
                hh, mm, ss, ff = parts
                
                formatted_time = f"{mm}:{ss}"
                
                output_lines.append(f"{formatted_time} - {title}")

        except Exception:
            # Ignorar cualquier fila que cause un error inesperado
            continue

    return "\n".join(output_lines)
