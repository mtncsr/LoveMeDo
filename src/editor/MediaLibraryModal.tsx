import React, { useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { fileToBase64, resizeImage } from '../utils/fileHelpers';
import { X, Upload as UploadIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './MediaLibraryModal.module.css';

interface Props {
    onSelect?: (mediaId: string) => void;
}

const MediaLibraryModal: React.FC<Props> = ({ onSelect }) => {
    const { setMediaLibraryOpen, mediaLibraryMode } = useUIStore();
    const { project, addMediaItem } = useProjectStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!project) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 1. Convert to Base64
            let base64 = await fileToBase64(file);

            // 2. Resize/Compress if image
            if (file.type.startsWith('image/')) {
                base64 = await resizeImage(base64);
            }

            // 3. Create Item
            const newItem = {
                id: uuidv4(),
                type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video' | 'audio',
                originalName: file.name,
                mimeType: file.type,
                data: base64,
                width: 0, // Should extract
                height: 0
            };

            addMediaItem(newItem);

            // If passing custom uploaded immediately
            // onSelect?.(newItem.id); 
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload file.");
        }
    };

    const handleItemClick = (mediaId: string) => {
        if (mediaLibraryMode === 'select') {
            onSelect?.(mediaId);
            setMediaLibraryOpen(false);
        }
    };

    // Convert map to array
    const mediaItems = Object.values(project.mediaLibrary);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Media Library</h3>
                    <button className={styles.closeBtn} onClick={() => setMediaLibraryOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.grid}>
                        {/* Upload Button */}
                        <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                            <UploadIcon size={24} />
                            <span>Upload</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*" // audio later
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Items */}
                        {mediaItems.map(item => (
                            <div
                                key={item.id}
                                className={styles.mediaItem}
                                onClick={() => handleItemClick(item.id)}
                            >
                                {item.type === 'image' && <img src={item.data} alt="media" />}
                                {item.type === 'video' && <div style={{ width: '100%', height: '100%', background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Video</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaLibraryModal;
