import './debug-registry';
import { useUIStore } from './store/uiStore';
import Landing from './components/Landing';
import TemplatesScreen from './components/TemplatesScreen';
import EditorLayout from './editor/EditorLayout';
import ExportScreen from './components/ExportScreen';

import React from 'react';

const App: React.FC = () => {
  try {
    const mode = useUIStore(state => state.mode);
    console.log('App mode:', mode);

    switch (mode) {
      case 'landing':
        return <Landing />;
      case 'templates':
        return <TemplatesScreen />;
      case 'editor':
        return <EditorLayout />;
      case 'export':
        return <ExportScreen />;
      default:
        return <Landing />;
    }
  } catch (error) {
    console.error('App error:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Error Loading App</h1>
        <p>{String(error)}</p>
      </div>
    );
  }
};

export default App;
