// src/utils/generateDescriptionText.js

/**
 * Genera el texto completo de descripción para YouTube.
 * @param {Object} params
 * @param {string} params.introText
 * @param {string} params.materialsListText
 * @param {string[]} params.versions // ej: ['1.20.1', '1.21.1', ...]
 * @param {Object} params.platforms // { java: bool, bedrock: bool }
 * @param {string} params.creator
 * @param {string} params.musicSegment
 * @param {string} params.timestampsText (opcional)
 * @returns {string} descripción final lista para pegar en YouTube
 */
export function generateDescriptionText({
    introText,
    materialsListText,
    versions,
    platforms,
    creator,
    musicSegment,
    timestampsText = ''
}) {
    // Plataforma
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

    // Versiones ordenadas ascendente
    const formattedVersions = versions && versions.length
        ? versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(' - ')
        : 'No especificadas';

    // Texto final
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

${musicSegment}

____________________________________________________

${timestampsText ? `❰ Timestamps ❱\n${timestampsText}\n` : ''}
    `.trim();
}
