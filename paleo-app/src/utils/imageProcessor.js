/**
 * Compresses and resizes an image file if it exceeds a certain size or dimension.
 * @param {File} file - The original image file
 * @param {number} maxWidth - Maximum width (default 2048)
 * @param {number} maxHeight - Maximum height (default 2048)
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {Promise<File>} - The compressed file
 */
// Optimization: Lowered max dimensions and quality for faster processing and upload.
// Target file size: ~300-500KB is plenty for screen display.
export const compressImage = async (file, maxWidth = 1600, maxHeight = 1600, quality = 0.7) => {
    // If file is small (< 1MB) and is an image, we might skip, 
    // BUT user asks for "Good Quality" which implies High Res, so we just want to ensure it doesn't crash.
    // > 10MB crash => likely backend limit (post_max_size).
    // Safe target: < 4MB.

    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        reader.onerror = (e) => reject(e);

        reader.readAsDataURL(file);

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth || height > maxHeight) {
                const ratio = width / height;
                if (width > maxWidth) {
                    width = maxWidth;
                    height = width / ratio;
                }
                if (height > maxHeight) {
                    height = maxHeight;
                    width = height * ratio;
                }
            } else {
                // If dimensions are small, check size. 
                // If file size > 1MB, always compress.
                // If dimensions are huge (e.g. 5000px) but file small (highly compressed), we still resize to save client memory.
                if (file.size < 1024 * 1024 && width < maxWidth && height < maxHeight) {
                    resolve(file); // Return original if already efficient
                    return;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Canvas to Blob failed"));
                    return;
                }
                // Convert blob back to File
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                });

                console.log(`[ImageCompression] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(newFile.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(newFile);
            }, 'image/jpeg', quality);
        };
    });
};
