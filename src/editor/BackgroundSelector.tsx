import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { X, Upload as UploadIcon } from 'lucide-react';
import { fileToBase64, compressImageFile } from '../utils/fileHelpers';
import { v4 as uuidv4 } from 'uuid';
import styles from './BackgroundSelector.module.css';

interface Props {
    onClose: () => void;
}

const PRESET_BACKGROUNDS = [
    { name: 'Solid Colors', type: 'solid' as const, options: [
        { value: '#FFFFFF', label: 'White' },
        { value: '#000000', label: 'Black' },
        { value: '#FF4D6D', label: 'Pink' },
        { value: '#4A90E2', label: 'Blue' },
        { value: '#50C878', label: 'Green' },
        { value: '#FFD700', label: 'Gold' },
        { value: '#FF6B35', label: 'Orange' },
        { value: '#9B59B6', label: 'Purple' },
    ]},
    { name: 'Gradients', type: 'gradient' as const, options: [
        { value: 'linear-gradient(135deg, #FFD93D, #FF4D6D, #4CC9F0)', label: 'Bright' },
        { value: 'linear-gradient(135deg, #590d22, #800f2f, #9d4edd)', label: 'Romantic' },
        { value: 'linear-gradient(135deg, #FFB4A2, #E5989B, #FFFFFF)', label: 'Soft' },
        { value: 'linear-gradient(to bottom, #d8f3dc, #fefae0)', label: 'Pastel' },
        { value: 'linear-gradient(to bottom, #001d3d, #003566)', label: 'Deep Blue' },
        { value: 'linear-gradient(120deg, #fdfcdc, #f0ebd8)', label: 'Warm' },
        { value: 'linear-gradient(to bottom, #2b2d42, #8d99ae)', label: 'Cool Gray' },
        { value: 'linear-gradient(to bottom, #000428, #004e92)', label: 'Midnight' },
    ]},
];

export const BackgroundSelector: React.FC<Props> = ({ onClose }) => {
    const { project, updateScreen, addMediaItem } = useProjectStore();
    const { activeScreenId } = useUIStore();
    const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    if (!project || !activeScreenId) return null;

    const currentScreen = project.screens.find(s => s.id === activeScreenId);
    if (!currentScreen) return null;

    const handleBackgroundSelect = (type: 'solid' | 'gradient' | 'image', value: string) => {
        updateScreen(activeScreenId, {
            background: {
                ...currentScreen.background,
                type,
                value
            }
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImageFile(file);
            const base64 = await fileToBase64(compressed);
            
            const mediaId = uuidv4();
            addMediaItem({
                id: mediaId,
                type: 'image',
                originalName: file.name,
                mimeType: file.type,
                data: base64
            });

            handleBackgroundSelect('image', mediaId);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Select Background</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'presets' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('presets')}
                    >
                        Presets
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'upload' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        Upload
                    </button>
                </div>
                <div className={styles.content}>
                    {activeTab === 'presets' && (
                        <div className={styles.presetsGrid}>
                            {PRESET_BACKGROUNDS.map((category) => (
                                <div key={category.name} className={styles.category}>
                                    <h4 className={styles.categoryTitle}>{category.name}</h4>
                                    <div className={styles.optionsGrid}>
                                        {category.options.map((option) => (
                                            <button
                                                key={option.value}
                                                className={`${styles.option} ${
                                                    currentScreen.background.type === category.type &&
                                                    currentScreen.background.value === option.value
                                                        ? styles.selected
                                                        : ''
                                                }`}
                                                onClick={() => handleBackgroundSelect(category.type, option.value)}
                                                style={
                                                    category.type === 'solid'
                                                        ? { backgroundColor: option.value }
                                                        : category.type === 'gradient'
                                                        ? { background: option.value }
                                                        : undefined
                                                }
                                                title={option.label}
                                            >
                                                {category.type === 'solid' && (
                                                    <span className={styles.optionLabel}>{option.label}</span>
                                                )}
                                                {category.type === 'gradient' && (
                                                    <span className={styles.optionLabel}>{option.label}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'upload' && (
                        <div className={styles.uploadSection}>
                            <div
                                className={styles.uploadArea}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <UploadIcon size={32} />
                                <span>Upload Background Image</span>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleImageUpload}
                                />
                            </div>
                            {currentScreen.background.type === 'image' && (
                                <div className={styles.currentBackground}>
                                    <p>Current background:</p>
                                    <img
                                        src={
                                            project.mediaLibrary[currentScreen.background.value]?.data ||
                                            currentScreen.background.value
                                        }
                                        alt="Current background"
                                        className={styles.previewImage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
