import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { buildExportHtml } from '../export/exportBuilder';
import { convertProjectMediaToBase64 } from '../utils/fileHelpers';
import { Download, ArrowLeft, CheckCircle } from 'lucide-react';
import styles from './ExportScreen.module.css';

const ExportScreen: React.FC = () => {
    const { project } = useProjectStore();
    const { setMode } = useUIStore();
    const [isExporting, setIsExporting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [jsonUrl, setJsonUrl] = useState<string | null>(null);

    if (!project) return null;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Convert all media to Base64 before export
            const projectWithBase64 = await convertProjectMediaToBase64(project);
            const html = await buildExportHtml(projectWithBase64);
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setIsExporting(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
            setIsExporting(false);
        }
    };

    const handleExportJson = () => {
        if (!project) return;
        const jsonStr = JSON.stringify(project, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.config.title.replace(/\s+/g, '_')}_project.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL after a short delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    };

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => setMode('editor')}>
                <ArrowLeft size={24} />
            </button>

            <div className={styles.card}>
                <h1>Ready to Launch! 🚀</h1>
                <p>Your "LoveMeDo" experience is ready to be bundled into a single file.</p>

                <div className={styles.previewBox}>
                    <div>{project.screens.length} Screens</div>
                    <div>{project.config.title}</div>
                </div>

                {!downloadUrl ? (
                    <>
                        <button className={styles.exportBtn} onClick={handleExport} disabled={isExporting}>
                            {isExporting ? 'Bundling...' : 'Generate HTML File'}
                        </button>
                        <button className={styles.exportBtn} onClick={handleExportJson} style={{ marginTop: '12px', background: '#6d6875' }}>
                            <Download size={20} />
                            Download Project JSON
                        </button>
                    </>
                ) : (
                    <div className={styles.success}>
                        <CheckCircle size={48} color="#4cc9f0" />
                        <p>Export Complete!</p>
                        <a href={downloadUrl} download={`${project.config.title.replace(/\s+/g, '_')}.html`} className={styles.downloadBtn}>
                            <Download size={20} />
                            Download Interactive HTML Gift
                        </a>
                        {jsonUrl && (
                            <a href={jsonUrl} download={`${project.config.title.replace(/\s+/g, '_')}_project.json`} className={styles.downloadBtn} style={{ marginTop: '12px', background: '#6d6875' }}>
                                <Download size={20} />
                                Download Project to Continue Editing Later
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default ExportScreen;
