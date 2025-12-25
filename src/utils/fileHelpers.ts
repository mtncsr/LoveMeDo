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
            resolve(canvas.toDataURL('image/webp', 0.9)); // WebP High Quality (0.9 for better quality)
        };
    });
};

export const convertProjectMediaToBase64 = async (project: import('../types/model').Project): Promise<import('../types/model').Project> => {
    const { resizeImage } = await import('./fileHelpers');
    const mediaLibrary = { ...project.mediaLibrary };
    
    // Convert all media items to Base64
    for (const [id, item] of Object.entries(mediaLibrary)) {
        if (item.type === 'image' && !item.data.startsWith('data:')) {
            // If it's a blob URL or external URL, we need to fetch and convert
            // For now, assume it's already Base64 or handle blob URLs
            try {
                if (item.data.startsWith('blob:')) {
                    const response = await fetch(item.data);
                    const blob = await response.blob();
                    const base64 = await fileToBase64(new File([blob], item.originalName, { type: item.mimeType }));
                    // Convert to WebP
                    const webpBase64 = await resizeImage(base64);
                    mediaLibrary[id] = { ...item, data: webpBase64 };
                } else {
                    // Already Base64 or external - convert to WebP if image
                    const webpBase64 = await resizeImage(item.data);
                    mediaLibrary[id] = { ...item, data: webpBase64 };
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
