// Covers are rendered in fixed-size square slots all over the DJ panel. Uploads
// arrive at arbitrary sizes and aspect ratios, so they are centre-cropped to one
// square resolution here, before upload, instead of being squashed by CSS at
// render time. There is no server-side image processing in this stack.

export const COVER_SIZE = 500;

export const DEFAULT_COVER = '/upload/cover/default.jpg';

// Transparent source pixels would turn black once encoded as JPEG.
const BACKDROP = '#ffffff';

export const fileToSquareCover = (file, size = COVER_SIZE) =>
    new Promise((resolve, reject) => {
        if (!file) return reject(new Error('no file selected'));
        if (!file.type?.startsWith('image/')) return reject(new Error('please select an image file'));

        const reader = new FileReader();

        reader.onerror = () => reject(new Error('could not read the selected file'));
        reader.onload = () => {
            const image = new window.Image();

            image.onerror = () => reject(new Error('could not decode the selected image'));
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = BACKDROP;
                ctx.fillRect(0, 0, size, size);

                const edge = Math.min(image.width, image.height);
                const sx = (image.width - edge) / 2;
                const sy = (image.height - edge) / 2;
                ctx.drawImage(image, sx, sy, edge, edge, 0, 0, size, size);

                resolve({ base64: canvas.toDataURL('image/jpeg', 0.9), ext: 'jpg' });
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
