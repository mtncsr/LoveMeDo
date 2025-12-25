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
                {templates.map(template => (
                    <div
                        key={template.id}
                        className={styles.card}
                        onClick={() => setPreview(true, template.id)}
                    >
                        <div className={styles.cardThumbnail}>
                            <span className={styles.emoji}>{template.thumbnail}</span>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.catBadge}>{template.category}</div>
                            <h3>{template.name}</h3>
                            <div className={styles.meta}>{template.screens} Screens</div>
                            <ul className={styles.descList}>
                                {template.description.slice(0, 2).map((d, i) => (
                                    <li key={i}>{d}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </main>

            {isTemplatePreviewOpen && previewTemplateId && (
                <TemplatePreviewModal templateId={previewTemplateId} />
            )}
        </div>
    );
};

export default TemplatesScreen;
