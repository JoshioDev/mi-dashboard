# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import re

app = Flask(__name__)

# Permitir CORS desde el servidor de desarrollo de React (Vite)
CORS(app, resources={r"/extract_music_credits": {"origins": "http://localhost:5173"}})

@app.route('/extract_music_credits', methods=['POST'])
def extract_music_credits():
    data = request.get_json()
    # CAMBIO: Aceptar una lista de URLs
    video_urls = data.get('videoUrls')

    if not video_urls or not isinstance(video_urls, list):
        return jsonify({"error": "Se requiere una lista de URLs de video."}), 400

    all_music_sections = []
    
    ydl_opts = {
        'skip_download': True,
        'dump_single_json': True,
        'extract_flat': True,
        'quiet': True,
        'noprogress': True,
        'cachedir': False,
    }
    
    patron_contenido = r"____________________________________________________\s*(.*?)\s*____________________________________________________"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # CAMBIO: Iterar sobre la lista de URLs
            for video_url in video_urls:
                if not video_url.strip():
                    continue
                
                info_dict = ydl.extract_info(video_url, download=False)
                description = info_dict.get('description')

                if description:
                    segmentos_encontrados = re.findall(patron_contenido, description, flags=re.DOTALL)
                    if segmentos_encontrados:
                        # Añadir el texto encontrado a la lista
                        all_music_sections.append("\n\n".join(s.strip() for s in segmentos_encontrados))

        if not all_music_sections:
            return jsonify({"musicSection": "(No se encontró un bloque de música en las descripciones)"}), 200

        # CAMBIO: Unir los créditos de todos los videos con un separador
        final_text = "\n\n\n".join(all_music_sections)
        return jsonify({"musicSection": final_text}), 200

    except yt_dlp.utils.DownloadError as e:
        return jsonify({"error": f"No se pudo acceder a una de las URLs. ¿Es correcta o privada?"}), 500
    except Exception as e:
        return jsonify({"error": f"Ocurrió un error inesperado en el servidor: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
