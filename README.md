# 🛠️ Mi Dashboard para Creadores de Contenido

Esta es una webapp creada para facilitar la generación de recursos visuales y textuales necesarios para la publicación de videos en YouTube, especialmente para creadores que trabajan con Minecraft.

## 🚀 Características Principales

* 🎒 **Generador de Datapacks**: Crea datapacks personalizados con un solo clic.
* 🧱 **Imagen de Materiales**: Genera automáticamente imágenes de los materiales usados en un proyecto, listas para insertar en el video.
* 📝 **Generador de Descripciones**: Crea descripciones completas para YouTube con créditos de música y enlaces.
* ⏱️ **Formatter de Timestamps**: Convierte listas de tiempo en formato editable para la descripción.
* ⚡ **Modo Express**: Para quienes quieren resultados rápidos con mínima configuración.
* 👀 **Visualizador**: Herramienta experimental para revisar resultados antes de exportarlos.

## 📁 Estructura del Proyecto

```
mi-dashboard/
├── backend/                # Servidor Flask
│   └── app.py
├── public/                # Recursos públicos como imágenes y scripts
│   ├── entities/
│   ├── items/
│   ├── items_map.csv
│   ├── entities_map.csv
│   ├── generate_datapack.py
│   ├── generate_description_list.py
│   └── generate_timestamps.py
├── src/
│   ├── components/        # Componentes React
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Entrada principal
├── index.html
├── package.json
└── vite.config.js
```

## ⚙️ Tecnologías Usadas

* **Frontend**: React + MUI (Material UI) + Vite
* **Backend**: Flask (para créditos musicales)
* **Procesamiento CSV**: papaparse
* **Compresión**: JSZip

## 🔧 Cómo Ejecutar el Proyecto

```bash
# Instalar dependencias
npm install

# Ejecutar frontend
npm run dev

# Ejecutar backend (Flask)
cd backend
python app.py
```

> Asegúrate de tener Python 3 y Node.js instalados.

---

¡Gracias por usar esta herramienta y apoyar la creación de contenido de calidad!
