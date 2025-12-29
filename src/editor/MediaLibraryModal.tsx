import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { fileToBase64, resizeImage } from '../utils/fileHelpers';
import { X, Upload as UploadIcon, Check, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './MediaLibraryModal.module.css';

interface Props {
    onSelect?: (mediaId: string | string[]) => void;
}

type TabType = 'images' | 'videos' | 'music';

const MediaLibraryModal: React.FC<Props> = ({ onSelect }) => {
    const { setMediaLibraryOpen, contentManagerContext } = useUIStore();
    const { project, addMediaItem } = useProjectStore();
    const [activeTab, setActiveTab] = useState<TabType>('images');
    const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);

    if (!project || !contentManagerContext) return null;

    const { elementId, screenId, elementType } = contentManagerContext;
    
    // Get the current element to determine assigned media
    const currentElement = useMemo(() => {
        if (!screenId || !elementId) return null;
        const screen = project.screens.find(s => s.id === screenId);
        return screen?.elements.find(e => e.id === elementId) || null;
    }, [project, screenId, elementId]);

    // Initialize selected items based on current element content
    useEffect(() => {
        if (!currentElement) return;
        
        const assignedIds = new Set<string>();
        
        if (elementType === 'image' || elementType === 'video') {
            // Single media ID for hero images and videos
            const content = currentElement.content;
            if (content && project.mediaLibrary[content]) {
                assignedIds.add(content);
            }
        } else if (elementType === 'gallery') {
            // Array of media IDs for galleries
            try {
                const parsed = JSON.parse(currentElement.content);
                const mediaIds = Array.isArray(parsed) ? parsed : [currentElement.content];
                mediaIds.forEach((id: string) => {
                    if (project.mediaLibrary[id]) {
                        assignedIds.add(id);
                    }
                });
            } catch {
                // If not JSON, treat as single ID
                if (currentElement.content && project.mediaLibrary[currentElement.content]) {
                    assignedIds.add(currentElement.content);
                }
            }
        }
        
        setSelectedMediaIds(assignedIds);
    }, [currentElement, elementType, project.mediaLibrary]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, expectedType: 'image' | 'video' | 'audio') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);
        let successCount = 0;
        let errorCount = 0;

        // Process all files
        for (const file of filesArray) {
            // Validate file type matches expected tab
            if (expectedType === 'image' && !file.type.startsWith('image/')) {
                errorCount++;
                continue;
            }
            if (expectedType === 'video' && !file.type.startsWith('video/')) {
                errorCount++;
                continue;
            }
            if (expectedType === 'audio' && !file.type.startsWith('audio/')) {
                errorCount++;
                continue;
            }

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
                    type: expectedType,
                    originalName: file.name,
                    mimeType: file.type,
                    data: base64,
                    width: 0, // Should extract
                    height: 0
                };

                addMediaItem(newItem);
                successCount++;
            } catch (err) {
                console.error("Upload failed for file:", file.name, err);
                errorCount++;
            }
        }

        // Reset file input
        e.target.value = '';

        // Show feedback
        if (errorCount > 0 && successCount === 0) {
            alert(`Failed to upload ${errorCount} file(s).`);
        } else if (errorCount > 0) {
            alert(`Successfully uploaded ${successCount} file(s). ${errorCount} file(s) failed.`);
        }
    };

    const handleItemClick = (mediaId: string) => {
        if (elementType === 'image' || elementType === 'video') {
            // Single selection for hero images and videos
            setSelectedMediaIds(new Set([mediaId]));
        } else if (elementType === 'gallery') {
            // Multiple selection for galleries
            const newSelection = new Set(selectedMediaIds);
            if (newSelection.has(mediaId)) {
                newSelection.delete(mediaId);
            } else {
                newSelection.add(mediaId);
            }
            setSelectedMediaIds(newSelection);
        }
    };

    const handleSave = () => {
        if (elementType === 'image' || elementType === 'video') {
            // Single selection
            const selectedId = Array.from(selectedMediaIds)[0] || '';
            onSelect?.(selectedId);
        } else if (elementType === 'gallery') {
            // Multiple selection - return as array
            const selectedArray = Array.from(selectedMediaIds);
            onSelect?.(selectedArray);
        }
        setMediaLibraryOpen(false);
    };

    const handleClose = () => {
        setMediaLibraryOpen(false);
    };

    // Filter media items by active tab
    const filteredMediaItems = useMemo(() => {
        const allItems = Object.values(project.mediaLibrary);
        return allItems.filter(item => {
            if (activeTab === 'images') return item.type === 'image';
            if (activeTab === 'videos') return item.type === 'video';
            if (activeTab === 'music') return item.type === 'audio';
            return false;
        });
    }, [project.mediaLibrary, activeTab]);

    // Check if media item is assigned (has checkmark)
    const isAssigned = (mediaId: string) => {
        if (!currentElement) return false;
        
        if (elementType === 'image' || elementType === 'video') {
            return currentElement.content === mediaId && project.mediaLibrary[mediaId];
        } else if (elementType === 'gallery') {
            try {
                const parsed = JSON.parse(currentElement.content);
                const mediaIds = Array.isArray(parsed) ? parsed : [currentElement.content];
                return mediaIds.includes(mediaId) && project.mediaLibrary[mediaId];
            } catch {
                return currentElement.content === mediaId && project.mediaLibrary[mediaId];
            }
        }
        return false;
    };

    // Check if music tab should be disabled (only for screen-level assignment)
    const isMusicDisabled = elementType !== null; // Disable music tab when opened from element

    const getFileInputRef = () => {
        if (activeTab === 'images') return imageInputRef;
        if (activeTab === 'videos') return videoInputRef;
        return musicInputRef;
    };

    const getAcceptType = () => {
        if (activeTab === 'images') return 'image/*';
        if (activeTab === 'videos') return 'video/*';
        return 'audio/*';
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Close if clicking on overlay (not on modal content)
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <button className={styles.saveBtn} onClick={handleSave}>
                        <Save size={18} />
                        <span>Save</span>
                    </button>
                    
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'images' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('images')}
                        >
                            Images
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'videos' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('videos')}
                        >
                            Videos
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'music' ? styles.activeTab : ''} ${isMusicDisabled ? styles.disabledTab : ''}`}
                            onClick={() => !isMusicDisabled && setActiveTab('music')}
                            disabled={isMusicDisabled}
                        >
                            Music
                        </button>
                    </div>

                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Upload Section */}
                    <div className={styles.uploadSection}>
                        <div 
                            className={styles.uploadArea} 
                            onClick={() => getFileInputRef().current?.click()}
                        >
                            <UploadIcon size={24} />
                            <span>Upload {activeTab === 'images' ? 'Image' : activeTab === 'videos' ? 'Video' : 'Audio'}</span>
                            <input
                                ref={getFileInputRef()}
                                type="file"
                                accept={getAcceptType()}
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileChange(e, activeTab === 'images' ? 'image' : activeTab === 'videos' ? 'video' : 'audio')}
                            />
                        </div>
                    </div>

                    {/* Media Grid */}
                    <div className={styles.grid}>
                        {filteredMediaItems.map(item => {
                            const isSelected = selectedMediaIds.has(item.id);
                            const hasCheckmark = isAssigned(item.id);
                            
                            return (
                                <div
                                    key={item.id}
                                    className={`${styles.mediaItem} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => handleItemClick(item.id)}
                                >
                                    {item.type === 'image' && (
                                        <img src={item.data} alt="media" className={styles.thumbnail} />
                                    )}
                                    {item.type === 'video' && (
                                        <div className={styles.videoThumbnail}>
                                            <div className={styles.videoIcon}>▶</div>
                                            <span>Video</span>
                                        </div>
                                    )}
                                    {item.type === 'audio' && (
                                        <div className={styles.audioThumbnail}>
                                            <div className={styles.audioIcon}>♪</div>
                                            <span>Audio</span>
                                        </div>
                                    )}
                                    
                                    {/* Checkmark overlay for assigned items */}
                                    {hasCheckmark && (
                                        <div className={styles.checkmarkOverlay}>
                                            <Check size={16} />
                                        </div>
                                    )}
                                    
                                    {/* Selection indicator */}
                                    {isSelected && !hasCheckmark && (
                                        <div className={styles.selectionIndicator}>
                                            <Check size={16} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {filteredMediaItems.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No {activeTab} uploaded yet. Click "Upload" to add your first {activeTab === 'images' ? 'image' : activeTab === 'videos' ? 'video' : 'audio'}.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaLibraryModal;
