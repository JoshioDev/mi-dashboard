import io
import csv
import math

def format_materials_list(csv_string, items_map_string, building_block_id):
    """
    Formatea una lista de materiales desde un CSV para una descripción de YouTube.
    Calcula los stacks y añade un ítem personalizado al final.
    """
    items_map = {}
    # Crear un mapa de Nombre en Inglés -> (Nombre en Español, ItemID)
    try:
        f_map = io.StringIO(items_map_string)
        reader_map = csv.DictReader(f_map)
        for row in reader_map:
            if row.get('Name') and row.get('NameEsp') and row.get('ItemID'):
                 items_map[row['Name']] = {'name_es': row['NameEsp'], 'id': row['ItemID']}
    except Exception as e:
        return f"Error crítico al procesar items_map.csv: {e}"

    output_lines = []
    f_materials = io.StringIO(csv_string)
    reader_materials = csv.DictReader(f_materials)

    for row in reader_materials:
        try:
            item_name_en = row.get("Item", "").strip()
            quantity_str = row.get("Total", "0").strip()

            if not item_name_en or not quantity_str:
                continue

            quantity = int(quantity_str)
            
            # El nombre por defecto es el nombre en español del mapa
            map_entry = items_map.get(item_name_en)
            item_name_es = map_entry['name_es'] if map_entry else item_name_en

            # Si el ItemID del item actual coincide con el ID del bloque de construcción, cambiar el nombre
            if map_entry and map_entry['id'] == building_block_id:
                item_name_es = "Bloques de Construcción"

            stack_text = ""
            if quantity >= 64:
                stacks = math.floor(quantity / 64)
                remainder = quantity % 64
                if remainder == 0:
                    stack_text = f" *[{stacks} stack{'s' if stacks > 1 else ''}]*"
                else:
                    stack_text = f" *[{stacks} stack{'s' if stacks > 1 else ''} y {remainder}]*"
            
            output_lines.append(f" ● {item_name_es} - {quantity}{stack_text}")

        except (ValueError, KeyError):
            continue
    
    # Añadir bloques temporales al final sin cantidad
    output_lines.append(" ● Bloques temporales")

    return "\n".join(output_lines)
