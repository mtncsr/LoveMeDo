import type { Project } from '../types/model';

// CSS from global.css (simplified)
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
  :root {
    --color-primary: #FF4D6D;
    --color-text: #2D2D2D;
    --font-heading: 'Playfair Display', serif;
    --font-body: 'Outfit', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #000; overflow: hidden; height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; }
  #root { width: 100%; height: 100%; max-width: 500px; max-height: 900px; position: relative; background: white; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
  @media (min-width: 600px) { #root { border-radius: 20px; height: 90vh; } }
  
  .screen { position: absolute; top:0; left:0; width:100%; height:100%; display:none; opacity:0; transition: opacity 0.5s; z-index:1; }
  .screen.active { display:block; opacity:1; z-index:2; }
  
  .nav-bar { position: absolute; top:0; left:0; width:100%; height:60px; display:flex; align-items:center; z-index:100; padding:0 16px; pointer-events: none; }
  .nav-btn { pointer-events: auto; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.2); backdrop-filter:blur(5px); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size: 20px; }
  .screen-title { flex:1; text-align:center; color:white; font-family: var(--font-heading); font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.2); }
  
  .element { position: absolute; z-index: 10; cursor: pointer; }
  .element-button { display:flex; align-items:center; justify-content:center; background: var(--color-primary); color:white; border-radius:999px; font-weight:bold; border:none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  .element-button:active { transform: scale(0.95); }
  
  .menu-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:200; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .menu-item { color:white; font-size:1.5rem; margin:10px; cursor:pointer; font-family:var(--font-heading); }
  .menu-close { position:absolute; top:20px; right:20px; color:white; font-size:30px; cursor:pointer; }
  
  .lightbox { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; }
  .lightbox img { max-width:90%; max-height:90%; border-radius:8px; box-shadow:0 0 30px rgba(0,0,0,0.5); }
  .lightbox-close { position:absolute; top:20px; right:20px; color:white; font-size:30px; cursor:pointer; background:none; border:none; }
  .lightbox-nav { position:absolute; top:50%; transform:translateY(-50%); color:white; font-size:40px; cursor:pointer; background:rgba(0,0,0,0.5); border:none; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .lightbox-prev { left:20px; }
  .lightbox-next { right:20px; }
  .navigation-grid { position:absolute; top:0; left:0; width:100%; height:100%; display:grid; grid-template-columns:repeat(2,1fr); gap:16px; padding:80px 20px 20px; z-index:10; overflow-y:auto; }
  .nav-grid-item { background:rgba(255,255,255,0.9); backdrop-filter:blur(10px); border-radius:16px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s; border:none; min-height:120px; cursor:pointer; }
  .nav-grid-item:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.2); }
  .nav-grid-number { font-size:2rem; font-weight:700; color:var(--color-primary); font-family:var(--font-heading); }
  .nav-grid-title { font-size:0.9rem; color:var(--color-text); font-weight:500; text-align:center; font-family:var(--font-body); }
  @media (min-width:600px) { .navigation-grid { grid-template-columns:repeat(3,1fr); padding:100px 40px 40px; } }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
  .animate-pulse { animation: pulse 2s infinite; }
`;

// JS Runtime
const getRuntimeScript = (project: Project) => `
  const project = ${JSON.stringify(project)};
  const root = document.getElementById('root');
  let historyStack = [];
  
  function renderScreen(screenId) {
      document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
      const screenEl = document.getElementById('screen-' + screenId);
      if (screenEl) {
          screenEl.classList.add('active');
          window.activeScreenId = screenId;
      }
  }

  function navigate(target) {
      if (target === 'back') {
          if (historyStack.length > 0) {
              const prev = historyStack.pop();
              renderScreen(prev);
          } else {
             const currentIdx = project.screens.findIndex(s => s.id === window.activeScreenId);
             if (currentIdx > 0) renderScreen(project.screens[currentIdx - 1].id);
          }
      } else if (target === 'menu') {
          document.getElementById('menu').style.display = 'flex';
      } else if (target === 'next') {
          const currentIdx = project.screens.findIndex(s => s.id === window.activeScreenId);
          if (currentIdx < project.screens.length - 1) {
              historyStack.push(window.activeScreenId);
              renderScreen(project.screens[currentIdx + 1].id);
          }
      } else {
          historyStack.push(window.activeScreenId);
          renderScreen(target);
          document.getElementById('menu').style.display = 'none';
      }
  }

  function openLightbox(src) {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = \`<button class="lightbox-close" onclick="this.parentElement.remove()">×</button><img src="\${src}" />\`;
      document.body.appendChild(lb);
      lb.onclick = (e) => { if(e.target === lb) lb.remove(); };
  }

  function init() {
      const menu = document.createElement('div');
      menu.id = 'menu';
      menu.className = 'menu-overlay';
      menu.style.display = 'none';
      menu.innerHTML = \`<div class="menu-close" onclick="document.getElementById('menu').style.display='none'">×</div>
        <div style="display:flex; flex-direction:column; text-align:center;">
           \${project.screens.map((s, i) => \`<div class="menu-item" onclick="navigate('\${s.id}')">\${i+1}. \${s.title}</div>\`).join('')}
        </div>\`;
      root.appendChild(menu);

      project.screens.forEach(screen => {
          const el = document.createElement('div');
          el.id = 'screen-' + screen.id;
          el.className = 'screen';
          
          let bgStyle = '';
          if (screen.background.type === 'solid') bgStyle = \`background-color: \${screen.background.value};\`;
          else if (screen.background.type === 'gradient') bgStyle = \`background-image: \${screen.background.value};\`;
          
          let bgContent = '';
          if (screen.background.type === 'image') bgContent = \`<img src="\${screen.background.value}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:-1;">\`;
          
          const navBar = screen.type === 'content' ? \`
            <div class="nav-bar">
               <button class="nav-btn" onclick="navigate('back')">←</button>
               <div class="screen-title">\${screen.title}</div>
               <button class="nav-btn" onclick="navigate('menu')">☰</button>
            </div>\` : '';
          
          const navGrid = screen.type === 'navigation' ? \`
            <div class="navigation-grid">
               \${project.screens.map((navScreen, idx) => \`
                 <button class="nav-grid-item" onclick="navigate('\${navScreen.id}')">
                   <div class="nav-grid-number">\${idx + 1}</div>
                   <div class="nav-grid-title">\${navScreen.title}</div>
                 </button>
               \`).join('')}
            </div>
          \` : '';

          const elementsHtml = screen.elements.map(elem => {
              const style = \`
                  left: \${elem.position.x}%; top: \${elem.position.y}%;
                  width: \${elem.size.width ? elem.size.width + '%' : 'auto'};
                  height: \${elem.size.height ? elem.size.height + '%' : 'auto'};
                  color: \${elem.styles.color || 'inherit'};
                  background-color: \${elem.styles.backgroundColor || 'transparent'};
                  font-size: \${elem.styles.fontSize ? elem.styles.fontSize + 'px' : ''};
                  font-family: \${elem.styles.fontFamily || ''};
                  text-align: \${elem.styles.textAlign || 'left'};
                  border-radius: \${elem.styles.borderRadius || 0}px;
                  transform: rotate(\${elem.styles.rotation || 0}deg);
                  z-index: \${elem.styles.zIndex || 10};
                  \${elem.styles.shadow ? 'box-shadow: 0 4px 10px rgba(0,0,0,0.2);' : ''}
                  \${elem.styles.opacity ? 'opacity: ' + elem.styles.opacity + ';' : ''}
              \`;
              
              let contentHtml = '';
              let onClick = '';
              let className = 'element';

              if (elem.type === 'text') {
                  contentHtml = elem.content;
              } else if (elem.type === 'image') {
                  // Check if content is a media ID or direct URL
                  let imageSrc = elem.content;
                  if (project.mediaLibrary[elem.content]) {
                      imageSrc = project.mediaLibrary[elem.content].data;
                  }
                  contentHtml = \`<img src="\${imageSrc}" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:inherit;" />\`;
                  onClick = \`onclick="openLightbox('\${imageSrc}')"\`;
              } else if (elem.type === 'button') {
                  className += ' element-button animate-pulse';
                  contentHtml = elem.content;
                  if (elem.metadata && elem.metadata.action === 'navigate') {
                      onClick = \`onclick="navigate('\${elem.metadata.target}')"\`;
                  }
              } else if (elem.type === 'sticker') {
                   contentHtml = elem.content;
                   style += \`font-size: \${elem.styles.fontSize || 40}px;\`;
              } else if (elem.type === 'gallery') {
                   let images = [];
                   try { images = JSON.parse(elem.content); } catch { images = [elem.content]; }
                   if (!Array.isArray(images)) images = [elem.content];
                   // Convert media IDs to Base64 data URLs
                   images = images.map(imgId => {
                       if (project.mediaLibrary[imgId]) {
                           return project.mediaLibrary[imgId].data;
                       }
                       return imgId;
                   });
                   contentHtml = \`<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; width:100%; height:100%;">
                      \${images.slice(0,4).map(src => \`<img src="\${src}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;" onclick="event.stopPropagation(); openLightbox('\${src}')" />\`).join('')}
                   </div>\`;
              } else if (elem.type === 'video') {
                   // Check if content is a media ID or direct URL
                   let videoSrc = elem.content;
                   if (project.mediaLibrary[elem.content]) {
                       videoSrc = project.mediaLibrary[elem.content].data;
                   }
                   contentHtml = \`<video src="\${videoSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" controls></video>\`;
              } else if (elem.type === 'long-text') {
                   const expanded = false; // Start collapsed
                   contentHtml = \`<div style="max-height:\${expanded ? 'none' : '200px'}; overflow-y:\${expanded ? 'auto' : 'hidden'}; padding:12px; background-color:\${elem.styles.backgroundColor || 'rgba(255,255,255,0.9)'}; border-radius:\${elem.styles.borderRadius || 8}px;">
                      <div style="white-space:pre-wrap;">\${elem.content}</div>
                      <button onclick="this.parentElement.style.maxHeight=this.parentElement.style.maxHeight==='none'?'200px':'none'; this.textContent=this.textContent==='Collapse'?'Expand':'Collapse';" style="margin-top:8px; padding:4px 12px; background:var(--color-primary); color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">Expand</button>
                   </div>\`;
              } else if (elem.type === 'shape') {
                   const isCircle = elem.styles.borderRadius && elem.styles.borderRadius >= 50;
                   contentHtml = \`<div style="width:100%; height:100%; background-color:\${elem.styles.backgroundColor || '#ccc'}; border-radius:\${isCircle ? '50%' : (elem.styles.borderRadius || 0) + 'px'};"></div>\`;
              }

              return \`<div class="\${className}" style="\${style}" \${onClick}>\${contentHtml}</div>\`;
          }).join('');

          el.innerHTML = bgContent + navBar + navGrid + elementsHtml;
          el.style.cssText = bgStyle;
          root.appendChild(el);
      });

      renderScreen(project.screens[0].id);
  }

  window.onload = init;
`;

// Minify CSS
const minifyCSS = (css: string): string => {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
        .replace(/\s*{\s*/g, '{') // Remove spaces around opening braces
        .replace(/;\s*/g, ';') // Remove spaces after semicolons
        .replace(/\s*:\s*/g, ':') // Remove spaces around colons
        .trim();
};

// Minify JS
const minifyJS = (js: string): string => {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .trim();
};

export const buildExportHtml = (project: Project): string => {
    const minifiedCSS = minifyCSS(GLOBAL_CSS);
    const minifiedJS = minifyJS(getRuntimeScript(project));
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${project.config.title}</title>
    <style>${minifiedCSS}</style>
</head>
<body>
    <div id="root"></div>
    <script>${minifiedJS}</script>
</body>
</html>`;
};
