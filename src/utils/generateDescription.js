// src/utils/generateDescription.js

/**
 * Genera la descripción final para YouTube a partir de los datos proporcionados.
 * @param {Object} opts
 * @param {string} opts.introText - Introducción del video.
 * @param {string} opts.materialsListText - Lista de materiales (string).
 * @param {string[]} opts.selectedVersions - Subversiones seleccionadas (ej: ['1.21.1', '1.21.2']).
 * @param {Object} opts.platforms - { java: bool, bedrock: bool }
 * @param {string} opts.creator - Creador original.
 * @param {string} opts.musicSection - Créditos musicales (ya armados).
 * @param {string} [opts.timestampsSection] - Timestamps generados (opcional).
 * @returns {string} Descripción lista para pegar en YouTube.
 */
export default function generateDescription({
  introText,
  materialsListText,
  selectedVersions,
  platforms,
  creator,
  musicSection,
  timestampsSection = ''
}) {
  // Arma el texto de plataformas
  let platformText = '🎮 Plataforma: ';
  if (platforms.java && platforms.bedrock) {
    platformText += 'Java ✅ - Bedrock ✅';
  } else if (platforms.java) {
    platformText += 'Java ✅ - Bedrock ❌';
  } else if (platforms.bedrock) {
    platformText += 'Java ❌ - Bedrock ✅';
  } else {
    platformText += 'No especificado';
  }

  // Ordena y arma versiones seleccionadas
  const formattedVersions = selectedVersions
    ? [...selectedVersions].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(' - ')
    : 'No especificadas';

  return `
${introText}

⛏ Lista de materiales:
${materialsListText}

❰ Sobre La Granja ❱
📟 Versiones: ${formattedVersions}
${platformText}
🤖 Creador original: ${creator || 'No especificado'}

❰ Redes Sociales ❱
🐦 Twitter ➞    https://x.com/iNordap 
🔴 Twitch ➞    https://www.twitch.tv/iNordap 
🎵 Tik tok ➞    https://www.tiktok.com/@iNordap
📧 Email ➞ contactoinordap@gmail.com

¿Quieres jugar Minecraft con tus amigos? Te recomiendo alquilar un servidor en ZAP-Hosting, además apoyas al canal simplemente dando clic en el siguiente enlace. Usa el código "iNordap-a-8942" para un 20% de descuento ➞ https://zap-hosting.com/inordap

❰ Musica ❱
____________________________________________________

${musicSection}

____________________________________________________

${timestampsSection ? `❰ Timestamps ❱\n${timestampsSection}\n` : ''}
  `.trim();
}
