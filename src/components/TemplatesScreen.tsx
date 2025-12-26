import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { getAllTemplates } from '../templates/registry';
import { Upload, ArrowLeft } from 'lucide-react';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import styles from './TemplatesScreen.module.css';

const TemplatesScreen: React.FC = () => {
    const setMode = useUIStore(state => state.setMode);
    const setPreview = useUIStore(state => state.setTemplatePreviewOpen);
    const setProject = useProjectStore(state => state.setProject);
    const { isTemplatePreviewOpen, previewTemplateId } = useUIStore();
    const templates = getAllTemplates();

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const project = JSON.parse(text);
                
                // Validate project structure
                if (!project.version || !project.screens || !Array.isArray(project.screens)) {
                    throw new Error('Invalid project file format');
                }
                
                // Load project into store
                setProject(project);
                setMode('editor');
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import project. Please check that the file is a valid LoveMeDo project JSON.');
            }
        };
        input.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <button className={styles.backButton} onClick={() => setMode('landing')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className={styles.headerText}>
                        <h1>Select Your Template</h1>
                        <p>Each Perfectly Designed Template is 100% Customizable</p>
                    </div>
                    <button className={styles.importButton} onClick={handleImport}>
                        <Upload size={20} />
                        <span>Import Project</span>
                    </button>
                </div>
            </header>

            <main className={styles.grid}>
                {templates.map(template => {
                    // Get template-specific styling
                    const getTemplateStyle = (id: string) => {
                        const styles: Record<string, { bg: string; accent: string; text: string }> = {
                            'birthday-kids': { bg: 'linear-gradient(135deg, #FFD93D, #FF4D6D, #4CC9F0)', accent: '#FF4D6D', text: '#2D2D2D' },
                            'birthday-partner': { bg: 'linear-gradient(135deg, #590d22, #800f2f, #9d4edd)', accent: '#C9184A', text: '#590d22' },
                            'anniversary-timeline': { bg: 'linear-gradient(to right, #4a4e69, #9a8c98)', accent: '#22223b', text: '#22223b' },
                            'one-screen': { bg: 'linear-gradient(135deg, #222, #444)', accent: '#666', text: '#2D2D2D' },
                            'baby-birth': { bg: 'linear-gradient(to bottom, #d8f3dc, #fefae0)', accent: '#95d5b2', text: '#555' },
                            'graduation': { bg: 'linear-gradient(to bottom, #001d3d, #003566)', accent: '#ffc300', text: '#ffc300' },
                            'thank-you': { bg: 'linear-gradient(120deg, #fdfcdc, #f0ebd8)', accent: '#b5838d', text: '#6d6875' },
                            'memorial': { bg: 'linear-gradient(to bottom, #2b2d42, #8d99ae)', accent: '#8d99ae', text: '#6b7280' },
                            'wedding-save-date': { bg: 'linear-gradient(135deg, #fff0f3, #ffccd5)', accent: '#ff4d6d', text: '#590d22' },
                            'new-year': { bg: 'linear-gradient(to bottom, #000428, #004e92)', accent: '#FFD700', text: '#FFD700' },
                            'cny': { bg: 'linear-gradient(135deg, #d00000, #ffba08)', accent: '#ffba08', text: '#ffba08' },
                            'blank': { bg: 'linear-gradient(135deg, #FFFFFF, #f5f5f5)', accent: '#333', text: '#333' },
                        };
                        return styles[id] || { bg: '#f0f0f0', accent: '#666', text: '#333' };
                    };

                    const templateStyle = getTemplateStyle(template.id);

                    return (
                        <div
                            key={template.id}
                            className={styles.card}
                            onClick={() => setPreview(true, template.id)}
                            style={{
                                borderColor: templateStyle.accent,
                            }}
                        >
                            <div 
                                className={styles.cardThumbnail}
                                style={{ background: templateStyle.bg }}
                            >
                                <span className={styles.emoji}>{template.thumbnail}</span>
                            </div>
                            <div className={styles.cardContent}>
                                <div 
                                    className={styles.catBadge}
                                    style={{ 
                                        background: `${templateStyle.accent}20`,
                                        color: templateStyle.accent 
                                    }}
                                >
                                    {template.category}
                                </div>
                                <h3 className={styles.cardTitle} style={{ color: templateStyle.text || '#2D2D2D' }}>{template.name}</h3>
                                <div className={styles.meta}>{template.screens} Screens</div>
                                <ul className={styles.descList}>
                                    {template.description.filter(d => d && d.trim()).map((d, i) => (
                                        <li key={i} style={{ color: (templateStyle.text || '#2D2D2D') + 'CC' }}>{d}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </main>

            {isTemplatePreviewOpen && previewTemplateId && (
                <TemplatePreviewModal templateId={previewTemplateId} />
            )}
        </div>
    );
};

export default TemplatesScreen;
