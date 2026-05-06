export function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(typeof reader.result === 'string' ? reader.result : '');
        };

        reader.onerror = () => {
            reject(new Error('We could not read that file. Please try again.'));
        };

        reader.readAsDataURL(file);
    });
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('We could not read that image. Please try again.'));
        };

        image.src = objectUrl;
    });
}

export async function readImageAsDataUrl(
    file,
    { maxWidth = 1600, maxHeight = 1600, quality = 0.82, type = 'image/webp' } = {},
) {
    if (!(file instanceof File)) {
        return '';
    }

    const image = await loadImageFromFile(file);
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('We could not prepare that image. Please try again.');
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL(type, quality);
}
