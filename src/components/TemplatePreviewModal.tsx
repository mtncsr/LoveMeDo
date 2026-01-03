import React, { useState, useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { getTemplate } from '../templates/registry';
import { Renderer } from '../renderer/Renderer';
import { Smartphone, Monitor, X, Check } from 'lucide-react';
import styles from './TemplatePreviewModal.module.css';
import { useProjectStore } from '../store/projectStore';

interface Props {
    templateId: string;
}

export const TemplatePreviewModal: React.FC<Props> = ({ templateId }) => {
    const setPreview = useUIStore(state => state.setTemplatePreviewOpen);
    const setMode = useUIStore(state => state.setMode);
    const setProject = useProjectStore(state => state.setProject);

    const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

    const template = getTemplate(templateId);

    // Generate a temporary project for preview
    const previewProject = useMemo(() => {
        if (!template) return null;
        return template.initialProjectData("My Gift");
    }, [template]);

    if (!template || !previewProject) return null;

    const handleSelect = () => {
        // Set mode first for immediate navigation, then project, then close preview
        setMode('editor');
        setProject(previewProject);
        setPreview(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.deviceToggle}>
                        <button
                            className={`${styles.toggleBtn} ${device === 'desktop' ? styles.active : ''}`}
                            onClick={() => setDevice('desktop')}
                        >
                            <Monitor size={20} />
                            <span>Desktop</span>
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${device === 'mobile' ? styles.active : ''}`}
                            onClick={() => setDevice('mobile')}
                        >
                            <Smartphone size={20} />
                            <span>Mobile</span>
                        </button>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.closeBtn} onClick={() => setPreview(false)}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className={styles.previewArea}>
                    <Renderer
                        project={previewProject}
                        mode="templatePreview"
                        device={device}
                    />
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.templateInfo}>
                        <strong>{template.name}</strong>
                        <span>{template.screens} Screens</span>
                    </div>
                    <button className={styles.selectBtn} onClick={handleSelect}>
                        <span>Select Template</span>
                        <Check size={20} />
                    </button>
                </div>

            </div>
        </div>
    );
};
