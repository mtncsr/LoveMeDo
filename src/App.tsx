import './debug-registry';
import { useUIStore } from './store/uiStore';
import Landing from './components/Landing';
import TemplatesScreen from './components/TemplatesScreen';
import EditorLayout from './editor/EditorLayout';
import ExportScreen from './components/ExportScreen';

import React from 'react';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = React.useState(true);

  React.useEffect(() => {
    const isAuthorized = localStorage.getItem('lovemedo_authorized');
    if (isAuthorized === 'true') {
      setIsLocked(false);
    }
  }, []);

  const handleUnlock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '07032908') {
      localStorage.setItem('lovemedo_authorized', 'true');
      setIsLocked(false);
    }
  };

  /* Hook must be called unconditionally at the top level */
  const mode = useUIStore(state => state.mode);

  if (isLocked) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        color: '#fff',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 500 }}>Know the numbers?</h1>
        <input
          type="tel"
          autoFocus
          placeholder="Enter code"
          onChange={handleUnlock}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid #333',
            color: '#fff',
            fontSize: '32px',
            textAlign: 'center',
            width: '200px',
            outline: 'none',
            letterSpacing: '4px',
            padding: '10px 0'
          }}
        />
      </div>
    );
  }

  console.log('App mode:', mode);

  try {
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
