export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const resizeImage = (base64Str: string, maxWidth: number = 1920): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.7)); // WebP High Quality (0.7 for optimal size/quality balance)
        };
    });
};

export const compressImageFile = (file: File, maxWidth: number = 1920, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Fallback for some contexts, but we'll try ObjectURL first for speed
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            // Cleanup memory
            URL.revokeObjectURL(objectUrl);

            resolve(canvas.toDataURL('image/webp', quality));
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };

        img.src = objectUrl;
    });
};

export const convertProjectMediaToBase64 = async (project: import('../types/model').Project): Promise<import('../types/model').Project> => {
    const { resizeImage, fileToBase64 } = await import('./fileHelpers');
    const mediaLibrary = { ...project.mediaLibrary };

    // Collect all placeholder image paths from the project
    const placeholderPaths = new Set<string>();

    // Scan screens for placeholder paths
    for (const screen of project.screens) {
        // Check background images/videos
        if (screen.background.type === 'image' && screen.background.value.startsWith('/images/templates/')) {
            placeholderPaths.add(screen.background.value);
        } else if (screen.background.type === 'video' && screen.background.value.startsWith('/images/templates/')) {
            placeholderPaths.add(screen.background.value);
        }

        // Check elements
        for (const elem of screen.elements) {
            if (elem.type === 'image' && elem.content.startsWith('/images/templates/')) {
                placeholderPaths.add(elem.content);
            } else if (elem.type === 'gallery') {
                let images: string[] = [];
                try {
                    images = JSON.parse(elem.content);
                    if (!Array.isArray(images)) images = [elem.content];
                } catch {
                    images = [elem.content];
                }
                images.forEach(imgPath => {
                    if (typeof imgPath === 'string' && imgPath.startsWith('/images/templates/')) {
                        placeholderPaths.add(imgPath);
                    }
                });
            } else if (elem.type === 'video' && elem.content.startsWith('/images/templates/')) {
                placeholderPaths.add(elem.content);
            }
        }
    }

    // Fetch and convert placeholder images to base64
    for (const placeholderPath of placeholderPaths) {
        // Skip if already in mediaLibrary
        if (mediaLibrary[placeholderPath]) continue;

        try {
            // Fetch the image from public folder
            const response = await fetch(placeholderPath);
            if (!response.ok) {
                console.warn(`Failed to fetch placeholder ${placeholderPath}: ${response.statusText}`);
                continue;
            }

            const blob = await response.blob();
            const fileName = placeholderPath.split('/').pop() || 'placeholder';
            const mimeType = blob.type || 'image/webp';

            // Convert to base64
            const base64 = await fileToBase64(new File([blob], fileName, { type: mimeType }));

            // Convert to WebP if it's an image
            const isImage = mimeType.startsWith('image/');
            const finalBase64 = isImage ? await resizeImage(base64) : base64;

            // Add to mediaLibrary using the path as the key
            mediaLibrary[placeholderPath] = {
                id: placeholderPath,
                type: isImage ? 'image' : (mimeType.startsWith('video/') ? 'video' : 'image'),
                data: finalBase64,
                originalName: fileName,
                mimeType: isImage ? 'image/webp' : mimeType
            };
        } catch (error) {
            console.warn(`Failed to convert placeholder ${placeholderPath}:`, error);
        }
    }

    // Convert all existing media items to Base64
    for (const [id, item] of Object.entries(mediaLibrary)) {
        if (item.type === 'image') {
            try {
                if (item.data.startsWith('data:')) {
                    // Already Base64 - RE-COMPRESS to ensure optimization (0.8 quality and max width)
                    // This handles existing images that might be uncompressed or high quality
                    const webpBase64 = await resizeImage(item.data);
                    mediaLibrary[id] = { ...item, data: webpBase64, mimeType: 'image/webp' };
                } else if (item.data.startsWith('blob:') || item.data.startsWith('http') || item.data.startsWith('/')) {
                    // Blob, External URL, or Local Path
                    const response = await fetch(item.data);
                    const blob = await response.blob();

                    // Use optimized flow: Blob -> ObjectURL -> Canvas -> Base64
                    // We cast Blob to File-like object or create a File to satisfy the type
                    const file = new File([blob], item.originalName || 'image', { type: blob.type || 'image/png' });
                    const webpBase64 = await compressImageFile(file);

                    mediaLibrary[id] = { ...item, data: webpBase64, mimeType: 'image/webp' };
                }
            } catch (error) {
                console.warn(`Failed to convert media ${id}:`, error);
            }
        } else if (item.type === 'video' || item.type === 'audio') {
            // For video/audio, ensure it's Base64
            if (!item.data.startsWith('data:')) {
                try {
                    if (item.data.startsWith('blob:')) {
                        const response = await fetch(item.data);
                        const blob = await response.blob();
                        const base64 = await fileToBase64(new File([blob], item.originalName, { type: item.mimeType }));
                        mediaLibrary[id] = { ...item, data: base64 };
                    }
                } catch (error) {
                    console.warn(`Failed to convert media ${id}:`, error);
                }
            }
        }
    }

    return { ...project, mediaLibrary };
};
