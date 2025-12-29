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
  .navigation-pills { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; gap:10px; padding:20px 20px 20px; z-index:10; overflow-y:auto; align-items:center; box-sizing:border-box; }
  .nav-pill { background:rgba(255,255,255,0.95); backdrop-filter:blur(10px); border-radius:50px; padding:16px 24px; display:flex; align-items:center; justify-content:flex-start; gap:16px; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s,background 0.2s; border:2px solid rgba(255,255,255,0.3); width:100%; max-width:400px; min-height:60px; cursor:pointer; }
  .nav-pill:hover { transform:translateX(4px); box-shadow:0 6px 16px rgba(0,0,0,0.2); background:rgba(255,255,255,1); }
  .nav-pill:active { transform:translateX(2px); }
  .nav-pill-number { font-size:18px; font-weight:700; color:var(--color-primary); background:rgba(74,144,226,0.1); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:var(--font-heading); }
  .nav-pill-title { font-size:16px; font-weight:600; color:var(--color-text); text-align:left; flex:1; font-family:var(--font-body); }
  @media (max-width:768px) { .navigation-pills { padding:20px 16px 16px; gap:10px; } .nav-pill { max-width:100%; padding:14px 20px; } .nav-pill-number { width:32px; height:32px; font-size:16px; } .nav-pill-title { font-size:15px; } }
  @media (min-width:600px) { .navigation-pills { padding:30px 40px 40px; gap:12px; } .nav-pill { max-width:450px; } }
  .next-button-container { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:150; width:100%; display:flex; justify-content:center; padding:0 20px; }
  .next-button { background:rgba(255,255,255,0.9); backdrop-filter:blur(10px); color:var(--color-primary); border:none; padding:12px 32px; border-radius:999px; font-size:1rem; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s; display:flex; align-items:center; gap:8px; }
  .next-button:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.2); }
  .next-button:active { transform:translateY(0); }
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
      } else if (target === 'nav-screen') {
          // Navigate directly to navigation screen (last screen)
          const navScreen = project.screens[project.screens.length - 1];
          if (navScreen && navScreen.type === 'navigation') {
              historyStack.push(window.activeScreenId);
              renderScreen(navScreen.id);
          }
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

  function openLightbox(src, type) {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      if (type === 'text') {
          const textDiv = document.createElement('div');
          textDiv.style.cssText = 'background-color:rgba(255,255,255,0.95);padding:40px;border-radius:16px;max-width:90%;max-height:80vh;overflow-y:auto;font-size:24px;line-height:1.6;color:#333;white-space:pre-wrap;text-align:center;font-family:var(--font-body, sans-serif);box-shadow:0 10px 40px rgba(0,0,0,0.3);user-select:text;-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;cursor:text;';
          textDiv.textContent = src;
          const closeBtn = document.createElement('button');
          closeBtn.className = 'lightbox-close';
          closeBtn.textContent = '×';
          closeBtn.onclick = function() { lb.remove(); };
          lb.appendChild(closeBtn);
          lb.appendChild(textDiv);
      } else {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'lightbox-close';
          closeBtn.textContent = '×';
          closeBtn.onclick = function() { lb.remove(); };
          const img = document.createElement('img');
          img.src = src;
          lb.appendChild(closeBtn);
          lb.appendChild(img);
      }
      document.body.appendChild(lb);
      lb.onclick = function(e) { if(e.target === lb) lb.remove(); };
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

      const galleryInitCodes = [];
      project.screens.forEach(screen => {
          const el = document.createElement('div');
          el.id = 'screen-' + screen.id;
          el.className = 'screen';
          
          let bgStyle = '';
          if (screen.background.type === 'solid') bgStyle = \`background-color: \${screen.background.value};\`;
          else if (screen.background.type === 'gradient') bgStyle = \`background-image: \${screen.background.value};\`;
          
          let bgContent = '';
          if (screen.background.type === 'image') {
              let bgImageSrc = screen.background.value;
              if (project.mediaLibrary[screen.background.value]) {
                  bgImageSrc = project.mediaLibrary[screen.background.value].data;
              }
              bgContent = \`<img src="\${bgImageSrc}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:-1;">\`;
          } else if (screen.background.type === 'video') {
              let bgVideoSrc = screen.background.value;
              if (project.mediaLibrary[screen.background.value]) {
                  bgVideoSrc = project.mediaLibrary[screen.background.value].data;
              }
              bgContent = \`<video src="\${bgVideoSrc}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:-1;" autoplay loop muted playsinline></video>\`;
          }
          
          const navBar = screen.type === 'content' ? \`
            <div class="nav-bar">
               <button class="nav-btn" onclick="navigate('back')">←</button>
               <div class="screen-title">\${screen.title}</div>
               <button class="nav-btn" onclick="navigate('nav-screen')">☰</button>
            </div>\` : '';
          
          // Next button for content screens (including when next screen is navigation)
          // Only render automatic next button if no navigation button elements exist
          const currentIdx = project.screens.findIndex(s => s.id === screen.id);
          const hasNextScreen = currentIdx < project.screens.length - 1;
          const hasNavigationButtons = screen.elements.some(
              el => el.type === 'button' && 
              el.metadata?.action === 'navigate' && 
              el.metadata?.target === 'next'
          );
          const nextButton = screen.type === 'content' && hasNextScreen && !hasNavigationButtons ? \`
            <div class="next-button-container">
               <button class="next-button" onclick="navigate('next')">Next →</button>
            </div>\` : '';
          
          const navPills = screen.type === 'navigation' ? \`
            <div class="navigation-pills">
               \${project.screens.map((navScreen, idx) => \`
                 <button class="nav-pill" onclick="navigate('\${navScreen.id}')">
                   <span class="nav-pill-number">\${idx + 1}</span>
                   <span class="nav-pill-title">\${navScreen.title}</span>
                 </button>
               \`).join('')}
            </div>
          \` : '';

          const elementsHtml = screen.elements.map(elem => {
              let style = \`
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
                  contentHtml = \`<img src="\${imageSrc}" style="width:100%; height:100%; object-fit:contain; object-position:center; display:block; border-radius:inherit;" />\`;
                  onClick = \`onclick="openLightbox('\${imageSrc}', 'image')"\`;
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
                   
                   const galleryId = 'gallery_' + elem.id.replace(/[^a-zA-Z0-9]/g, '_');
                   const initialIndex = Math.floor(images.length / 2);
                   const initialImageSrc = images[initialIndex];
                   
                   // Generate unique function names for this gallery (as strings)
                   const navPrevFunc = 'navPrev_' + galleryId;
                   const navNextFunc = 'navNext_' + galleryId;
                   const thumbClickFunc = 'thumbClick_' + galleryId;
                   
                   // Build thumbnail HTML with string concatenation to avoid nested template literals
                   const thumbnailsHtml = images.length > 1 ? images.map((src, idx) => {
                       const isActive = idx === initialIndex;
                       const border = isActive ? '3px solid var(--color-primary)' : '2px solid transparent';
                       const opacity = isActive ? '1' : '0.7';
                       return '<div onclick="' + thumbClickFunc + '(' + idx + ')" style="flex-shrink:0; width:60px; height:60px; border-radius:6px; overflow:hidden; cursor:pointer; border:' + border + '; opacity:' + opacity + '; transition:all 0.2s; background-color:#f0f0f0;"><img src="' + src + '" style="width:100%; height:100%; object-fit:cover;" /></div>';
                   }).join('') : '';
                   
                   // Build buttons HTML with string concatenation
                   const buttonsHtml = images.length > 1 ? '<button onclick="' + navPrevFunc + '()" style="position:absolute; left:8px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; z-index:10; font-size:20px;">‹</button><button onclick="' + navNextFunc + '()" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; z-index:10; font-size:20px;">›</button>' : '';
                   const thumbsContainerHtml = images.length > 1 ? '<div id="' + galleryId + '_thumbs" style="display:flex; gap:6px; overflow-x:auto; overflow-y:hidden; padding:4px 0; scrollbar-width:thin;">' + thumbnailsHtml + '</div>' : '';
                   
                   contentHtml = \`
                     <div id="\${galleryId}" style="display:flex; flex-direction:column; width:100%; height:100%; padding:4px; box-sizing:border-box;">
                       <div style="position:relative; width:100%; flex:1; min-height:60%; display:flex; align-items:center; justify-content:center; background-color:#f0f0f0; border-radius:8px; overflow:hidden; margin-bottom:8px;">
                         <img id="\${galleryId}_hero" src="\${initialImageSrc}" style="width:100%; height:100%; object-fit:contain; object-position:center;" />
                         \${buttonsHtml}
                       </div>
                       \${thumbsContainerHtml}
                     </div>
                   \`;
                   
                   // Store gallery initialization code - scripts in innerHTML don't execute, so we'll run it after appendChild
                   galleryInitCodes.push(\`(function() {
                     let currentIndex = \${initialIndex};
                     const images = \${JSON.stringify(images)};
                     const heroImg = document.getElementById('\${galleryId}_hero');
                     const thumbsContainer = document.getElementById('\${galleryId}_thumbs');
                     
                     window['\${navPrevFunc}'] = function() {
                       currentIndex = (currentIndex - 1 + images.length) % images.length;
                       heroImg.src = images[currentIndex];
                       updateThumbnails();
                     };
                     
                     window['\${navNextFunc}'] = function() {
                       currentIndex = (currentIndex + 1) % images.length;
                       heroImg.src = images[currentIndex];
                       updateThumbnails();
                     };
                     
                     window['\${thumbClickFunc}'] = function(index) {
                       currentIndex = index;
                       heroImg.src = images[currentIndex];
                       updateThumbnails();
                     };
                     
                     function updateThumbnails() {
                       if (!thumbsContainer) return;
                       const thumbs = thumbsContainer.children;
                       for (let i = 0; i < thumbs.length; i++) {
                         const thumb = thumbs[i];
                         if (i === currentIndex) {
                           thumb.style.border = '3px solid var(--color-primary)';
                           thumb.style.opacity = '1';
                         } else {
                           thumb.style.border = '2px solid transparent';
                           thumb.style.opacity = '0.7';
                         }
                       }
                       const thumbWidth = 60 + 6;
                       const scrollPos = (currentIndex - 2) * thumbWidth;
                       thumbsContainer.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
                     }
                   })();\`);
              } else if (elem.type === 'video') {
                   // Check if content is a media ID or direct URL
                   let videoSrc = elem.content;
                   if (project.mediaLibrary[elem.content]) {
                       videoSrc = project.mediaLibrary[elem.content].data;
                   }
                   contentHtml = \`<video src="\${videoSrc}" style="width:100%; height:100%; object-fit:contain; object-position:center; border-radius:inherit;" controls preload="metadata"></video>\`;
              } else if (elem.type === 'long-text') {
                   // Show text with ellipsis when too long, clickable to open in lightbox
                   const textContent = elem.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                   contentHtml = \`<div style="padding:16px; background-color:\${elem.styles.backgroundColor || 'rgba(255,255,255,0.9)'}; border-radius:\${elem.styles.borderRadius || 16}px; width:100%; height:100%; display:flex; align-items:flex-start; justify-content:flex-start; box-sizing:border-box;">
                      <div style="display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; white-space:pre-wrap; word-wrap:break-word; width:100%; height:100%; -webkit-line-clamp:999; line-clamp:999; color:\${elem.styles.color || 'inherit'}; font-size:\${elem.styles.fontSize ? elem.styles.fontSize + 'px' : 'inherit'}; font-family:\${elem.styles.fontFamily || 'inherit'}; font-weight:\${elem.styles.fontWeight || 'normal'}; text-align:\${elem.styles.textAlign || 'left'};">\${textContent}</div>
                   </div>\`;
                   onClick = \`onclick="openLightbox('\${textContent}', 'text')"\`;
              } else if (elem.type === 'shape') {
                   const isCircle = elem.styles.borderRadius && elem.styles.borderRadius >= 50;
                   contentHtml = \`<div style="width:100%; height:100%; background-color:\${elem.styles.backgroundColor || '#ccc'}; border-radius:\${isCircle ? '50%' : (elem.styles.borderRadius || 0) + 'px'};"></div>\`;
              }

              return \`<div class="\${className}" style="\${style}" \${onClick}>\${contentHtml}</div>\`;
          }).join('');

          el.innerHTML = bgContent + navBar + navPills + elementsHtml + nextButton;
          el.style.cssText = bgStyle;
          root.appendChild(el);
      });
      
      // Execute gallery initialization codes (scripts in innerHTML don't execute, so we run them here)
      galleryInitCodes.forEach(code => {
          try { eval(code); } catch(e) { console.error('Gallery init error:', e); }
      });

      renderScreen(project.screens[0].id);
  }

  if (document.readyState === 'loading') {
      window.onload = function() {
          init();
      };
  } else {
      // Document already loaded, run init immediately
      init();
  }
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
    // Disable minification to avoid breaking code - regex-based minifiers can't handle complex JavaScript safely
    const minifiedCSS = minifyCSS(GLOBAL_CSS);
    const runtimeScript = getRuntimeScript(project); // Don't minify JS - it breaks template literals and URLs
    
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
    <script>${runtimeScript}</script>
</body>
</html>`;
};
