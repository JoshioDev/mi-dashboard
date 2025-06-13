import io
import csv
import json

def generar_datapack(materiales_csv_str, items_map_csv_str, pack_format):
    """
    Genera los archivos para un datapack de Minecraft en memoria.
    """
    # --- Archivos de funciones estáticos ---
    config_commands = [
        "gamerule doDaylightCycle false",
        "say doDaylightCycle aplicado",
        "gamerule doWeatherCycle false",
        "say doWeatherCycle aplicado",
        "gamerule fallDamage false",
        "say fallDamage aplicado",
        "gamerule fireDamage false",
        "say fireDamage aplicado",
        "gamerule keepInventory true",
        "say keepInventory aplicado",
        "gamerule disableRaids true",
        "say disableRaids aplicado",
        "gamerule doInsomnia false",
        "say doInsomnia aplicado",
        "gamerule doMobSpawning false",
        "say doMobSpawning aplicado",
        "gamerule doPatrolSpawning false",
        "say doPatrolSpawning aplicado",
        "gamerule doTraderSpawning false",
        "say doTraderSpawning aplicado",
        "gamerule doWardenSpawning false",
        "say doWardenSpawning aplicado",
        "gamerule announceAdvancements false",
        "say announceAdvancements aplicado",
        "say Configuracion inicial terminada"
    ]

    # --- Lógica para procesar materiales ---
    nombre_a_namespace_id = {}
    comandos_materiales = []
    errores = []

    # 1. Leer el mapa de items
    try:
        f = io.StringIO(items_map_csv_str)
        reader = csv.reader(f)
        encabezado = next(reader)
        idx_name = encabezado.index('Name')
        idx_item_id = encabezado.index('ItemID')

        for fila in reader:
            if len(fila) > max(idx_name, idx_item_id):
                nombre_comun = fila[idx_name].strip()
                namespace_id = fila[idx_item_id].strip()
                if nombre_comun and namespace_id:
                    if ':' not in namespace_id:
                        namespace_id = f"minecraft:{namespace_id}"
                    nombre_a_namespace_id[nombre_comun] = namespace_id
    except Exception as e:
        errores.append(f"Error procesando el mapa de items: {e}")
        return None, errores

    # 2. Leer la lista de materiales deseados
    try:
        f = io.StringIO(materiales_csv_str)
        reader = csv.reader(f)
        encabezado = next(reader)
        idx_item = encabezado.index('Item')
        idx_total = encabezado.index('Total')

        for fila in reader:
            if len(fila) > max(idx_item, idx_total):
                nombre_comun = fila[idx_item].strip()
                try:
                    cantidad = int(fila[idx_total].strip())
                    if cantidad > 0:
                        if nombre_comun in nombre_a_namespace_id:
                            namespace_id = nombre_a_namespace_id[nombre_comun]
                            comandos_materiales.append(f"give @s {namespace_id} {cantidad}")
                        else:
                            errores.append(f"Advertencia: Item '{nombre_comun}' no encontrado en el mapa de items.")
                except ValueError:
                    errores.append(f"Advertencia: Cantidad no válida para '{nombre_comun}'.")
    except Exception as e:
        errores.append(f"Error procesando la lista de materiales: {e}")
        return None, errores

    # --- Generar estructura de archivos en memoria ---
    datapack_files = {}

    # pack.mcmeta
    pack_mcmeta_content = {
        "pack": {
            "pack_format": int(pack_format),
            "description": "Configuración para grabar video"
        }
    }
    # CORRECCIÓN: Añadido ensure_ascii=False para manejar acentos correctamente.
    datapack_files["pack.mcmeta"] = json.dumps(pack_mcmeta_content, indent=4, ensure_ascii=False)

    # CORRECCIÓN: Se cambió el nombre de la carpeta a "function"
    datapack_files["data/utilities/function/config.mcfunction"] = "\n".join(config_commands)
    datapack_files["data/utilities/function/materiales.mcfunction"] = "\n".join(comandos_materiales)
    
    return datapack_files, errores
