// src/utils/generateMaterialsImages.js

export async function generateMaterialsImages(materialsData, {
    downloadResolution = '1920x1080',
    imageTitle = 'MATERIALES',
    imageSubtitle = 'La cantidad puede variar ligeramente',
    itemsPerPage = 18,
    buildingBlockId = null,
    gridRows = 6,
    gridCols = 3,
    showGridDebug = false
}, itemsMap, entitiesMap) {
    // Divide materiales en páginas
    const pages = [];
    for (let i = 0; i < materialsData.length; i += itemsPerPage) {
        pages.push(materialsData.slice(i, i + itemsPerPage));
    }

    // Helper para cargar imágenes
    const loadImage = (src) => new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });

    const generatedCanvases = [];
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageItems = pages[pageIndex];

        const canvas = document.createElement('canvas');
        const [width, height] = downloadResolution.split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / 1920;

        const imagePromises = pageItems.map(item => {
            if (item.type === 'custom') {
                return loadImage(item.imagePath);
            }
            const mapEntry = item.type === 'item'
                ? itemsMap.get(item.Item)
                : entitiesMap.get(item.Item);
            const itemId = mapEntry
                ? (item.type === 'item'
                    ? mapEntry.ItemID
                    : mapEntry['Registry name'].replace('minecraft:', ''))
                : item.Item.replace('minecraft:', '');
            const folder = item.type === 'item' ? 'items' : 'entities';
            return loadImage(`/${folder}/${itemId}.png`);
        });

        const loadedImages = await Promise.all(imagePromises);

        // Fondo y títulos
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, canvas.height, [20 * scale]);
        ctx.clip();
        ctx.fillStyle = 'rgba(17, 17, 17, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(200, 200, 220, 0.9)';
        ctx.font = `900 ${90 * scale}px Poppins`;
        ctx.textAlign = 'center';
        ctx.fillText(imageTitle.toUpperCase(), canvas.width / 2, 160 * scale);

        ctx.fillStyle = 'rgba(187, 187, 187, 0.8)';
        ctx.font = `600 ${35 * scale}px Poppins`;
        ctx.fillText(imageSubtitle.toUpperCase(), canvas.width / 2, 215 * scale);

        // Layout dinámico basado en filas y columnas
        const columns = gridCols || 3;
        const rows = gridRows || 6;
        const gridPadding = 100 * scale;
        const columnWidth = (canvas.width - (gridPadding * 2)) / columns;
        const rowHeight = ((canvas.height - gridPadding) - 280 * scale) / rows;
        const startY = 280 * scale;
        const itemPadding = 30 * scale;
        const itemBoxHeight = rowHeight - itemPadding;

        pageItems.forEach((item, index) => {
            const img = loadedImages[index];
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = gridPadding + (col * columnWidth);
            const y = startY + (row * rowHeight);

            // --- DEBUG: Limite de la celda del grid ---
            if (showGridDebug) {
                ctx.save();
                ctx.strokeStyle = '#44FF44';
                ctx.lineWidth = 3 * scale;
                ctx.setLineDash([10 * scale, 8 * scale]);
                ctx.strokeRect(x, y, columnWidth, rowHeight);
                ctx.restore();
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            const iconBgSize = 80 * scale;
            ctx.beginPath();
            ctx.roundRect(x, y + (itemBoxHeight - iconBgSize) / 2, iconBgSize, iconBgSize, [12 * scale]);
            ctx.fill();

            // --- DEBUG: Limite del ícono ---
            const iconSize = 56 * scale;
            const iconX = x + (iconBgSize - iconSize) / 2;
            const iconY = y + (itemBoxHeight - iconSize) / 2;
            if (showGridDebug) {
                ctx.save();
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2 * scale;
                ctx.setLineDash([5 * scale, 5 * scale]);
                ctx.strokeRect(iconX, iconY, iconSize, iconSize);
                ctx.restore();
            }

            if (img) {
                ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
            } else {
                ctx.font = `900 ${24 * scale}px Poppins`;
                ctx.fillStyle = '#AAA';
                ctx.textAlign = 'center';
                ctx.fillText('?', x + iconBgSize / 2, y + (itemBoxHeight / 2) + 12 * scale);
            }

            let name = "Desconocido";
            if (item.type === 'custom') {
                name = item.Item;
            } else if (item.type === 'entity') {
                const entityMapEntry = entitiesMap.get(item.Item);
                name = entityMapEntry?.NameEsp || item.Item.replace('minecraft:', '');
            } else {
                const mapEntry = itemsMap.get(item.Item);
                name = mapEntry?.NameEsp || item.Item.replace('minecraft:', '');
                if (mapEntry?.ItemID === buildingBlockId) name = 'Bloques de construcción';
            }

            // --- Cálculo del área segura para el nombre ---
            const cantidadBoxX = x + columnWidth - (itemPadding * 1.5) - 40 * scale; // inicio de la caja de cantidad
            const textX = x + iconBgSize + (25 * scale);
            const margenSeguridad = 4 * scale;
            const textWidth = cantidadBoxX - textX - margenSeguridad;

            // Dibuja el texto con el ancho correcto
            ctx.fillStyle = '#ffffff';
            ctx.font = `600 ${35 * scale}px Poppins`;
            ctx.textAlign = 'left';
            wrapText(ctx, name, textX, y + (38 * scale), textWidth, 38 * scale);

            // --- DEBUG: Limite del nombre/texto (azul) ---
            if (showGridDebug) {
                ctx.save();
                ctx.strokeStyle = '#00BFFF'; // Azul
                ctx.lineWidth = 2 * scale;
                ctx.setLineDash([5 * scale, 5 * scale]);
                ctx.strokeRect(
                    textX,
                    y + (itemBoxHeight - iconSize) / 2,
                    textWidth,
                    iconSize
                );
                ctx.restore();
            }

            // --- DEBUG: Limite del campo de cantidad ---
            if (showGridDebug && item.type !== 'custom') {
                ctx.save();
                ctx.strokeStyle = '#FF4444';
                ctx.lineWidth = 2 * scale;
                ctx.setLineDash([5 * scale, 5 * scale]);
                ctx.strokeRect(
                    x + columnWidth - (itemPadding * 1.5) - 40 * scale,
                    y + itemBoxHeight - (30 * scale),
                    60 * scale, 32 * scale
                );
                ctx.restore();
            }

            if (item.type !== 'custom') {
                ctx.fillStyle = '#94A3B8';
                ctx.font = `500 ${30 * scale}px Poppins`;
                ctx.textAlign = 'right';
                ctx.fillText(`x${item.Total}`, x + columnWidth - (itemPadding * 1.5), y + itemBoxHeight - (10 * scale));
            }
        });

        // Leyenda colores debug (arriba a la derecha)
        if (showGridDebug) {
            ctx.save();
            ctx.font = `600 ${18 * scale}px Poppins`;
            ctx.fillStyle = '#44FF44';
            ctx.fillText('Verde: grid', canvas.width - 320 * scale, 40 * scale);
            ctx.fillStyle = '#FFD700';
            ctx.fillText('Amarillo: ícono', canvas.width - 320 * scale, 60 * scale);
            ctx.fillStyle = '#00BFFF';
            ctx.fillText('Azul: nombre', canvas.width - 320 * scale, 80 * scale);
            ctx.fillStyle = '#FF4444';
            ctx.fillText('Rojo: cantidad', canvas.width - 320 * scale, 100 * scale);
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = `500 ${22 * scale}px Poppins`;
        ctx.textAlign = 'left';
        ctx.fillText('youtube.com/@inordap', gridPadding, canvas.height - (30 * scale));

        if (pages.length > 1) {
            ctx.textAlign = 'right';
            ctx.fillText(`${pageIndex + 1}/${pages.length}`, canvas.width - gridPadding, canvas.height - (30 * scale));
        }

        generatedCanvases.push(canvas);
    }

    // --- Texto multilinea helper (fuera del for) ---
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (context.measureText(testLine).width > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }

    return generatedCanvases;
}
