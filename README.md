# 🛠️ Minecraft Dashboard WebApp

WebApp modular para automatizar la generación de datapacks, descripciones de YouTube, imágenes de materiales y más para la comunidad de Minecraft.

## 📁 Estructura del Proyecto

```
mi-dashboard/
├── backend/
│   └── app.py                     # Servidor Flask para créditos de música
│
├── public/
│   ├── entities/                  # Imágenes .png de entidades
│   ├── items/                     # Imágenes .png de ítems
│   ├── entities_map.csv
│   ├── items_map.csv
│   ├── generate_datapack.py
│   ├── generate_description_list.py
│   ├── generate_timestamps.py
│
├── src/
│   ├── components/
│   │   ├── DatapackGenerator.jsx
│   │   ├── DescriptionGenerator.jsx
│   │   ├── ExpressGenerator.jsx
│   │   ├── MaterialsImageGenerator.jsx
│   │   ├── Placeholder.jsx
│   │   ├── Settings.jsx
│   │   ├── TimestampsFormatter.jsx
│   │   └── shared/
│   │        ├── EntitySelector.jsx
│   │        ├── ErrorAlert.jsx
│   │        ├── FileDropzone.jsx
│   │        └── PreviewGallery.jsx
│   ├── providers/
│   │   └── SnackbarProvider.jsx
│   ├── hooks/
│   │   ├── useCSVMap.js
│   │   ├── usePyodide.js
│   │   └── useSnackbar.js
│   ├── utils/
│   │   ├── generateMaterialsImages.js
│   │   ├── generateDatapackWithPyodide.js
│   │   ├── formatMaterialsListWithPyodide.js
│   │   ├── formatTimestampsWithPyodide.js
│   │   └── generateDescriptionText.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## ✨ Descripción de carpetas principales

* **backend/**: Scripts Python/Flask para integración y automatizaciones (por ejemplo, créditos de música).
* **public/**: Archivos estáticos, imágenes, scripts Python usados por Pyodide y archivos de mapeo.
* **src/components/**: Componentes principales de React y subcomponentes compartidos.

  * **shared/**: Componentes reusables y visuales (drag & drop, previews, alerts, entity selector).
* **src/providers/**: Proveedores de contexto global (ej: SnackbarProvider).
* **src/hooks/**: Hooks personalizados (Pyodide, snackbar, carga de mapas CSV).
* **src/utils/**: Funciones helper y lógica de generación, formateo y procesamiento (JS).
* **src/**: Entrypoint de la app, estilos globales, configuración principal.

---

## 🚀 ¿Cómo correr el proyecto?

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Inicia el backend (opcional, solo si usas Flask):

   ```bash
   cd backend
   python app.py
   ```

3. Inicia la app web:

   ```bash
   npm run dev
   ```

---

## 🧩 Stack Tecnológico

* **React** + **Vite**
* **Material UI** (MUI)
* **Pyodide** (Python en el navegador)
* **PapaParse** (parseo de CSV)
* **JSZip** (descarga de archivos en ZIP)
* **Python scripts** para lógica especial (generación de datapacks, descripciones, etc.)

---

## 📋 Notas

* Los scripts Python en `public/` son cargados y ejecutados en el navegador mediante Pyodide.
* Los mapas de items y entidades deben mantenerse sincronizados para funcionamiento correcto de la app.
* Para notificaciones globales, la app utiliza un SnackbarProvider con hooks personalizados.

---

¿Necesitas más detalles sobre algún directorio o cómo agregar nuevos módulos?
¡Solo abre un issue o contacta al desarrollador principal!
