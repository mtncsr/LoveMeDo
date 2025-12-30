import type { Project } from '../types/model';
import { calculateLayout } from '../templates/registry';

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
  #root { width: 100%; height: 100%; position: relative; background: white; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5); transition: all 0.3s ease; }
  #root[data-device="mobile"] { max-width: 375px; max-height: calc(100vh - 40px); aspect-ratio: 9 / 16; border-radius: 30px; }
  #root[data-device="desktop"] { max-width: 1200px; width: min(90vw, calc((100vh - 40px) * 16 / 9)); aspect-ratio: 16 / 9; border-radius: 8px; height: auto; }
  
  .screen { position: absolute; top:0; left:0; width:100%; height:100%; display:none; opacity:0; transition: opacity 0.5s; z-index:1; }
  .screen.active { display:block; opacity:1; z-index:2; }
  
  .nav-bar { position: absolute; top:0; left:0; width:100%; height:60px; display:flex; align-items:center; z-index:100; padding:0 16px; pointer-events: none; }
  .nav-btn { pointer-events: auto; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.2); backdrop-filter:blur(5px); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size: 20px; }
  .screen-title { flex:1; text-align:center; color:white; font-family: var(--font-heading); font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.2); }
  
  .element { position: absolute; z-index: 10; cursor: pointer; }
  .element[data-type="sticker"] { animation: float 4s ease-in-out infinite; pointer-events: none; }
  @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
  .element-button { display:flex; align-items:center; justify-content:center; background: var(--color-primary); color:white; border-radius:999px; font-weight:bold; border:none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  .element-button:active { transform: scale(0.95); }
  .overlay-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; z-index: 1; }
  .confetti { position: absolute; width: 10px; height: 10px; background-color: #f00; opacity: 0.8; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; top: -50px; }
  @keyframes fall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; } 2% { opacity: 1; } 98% { opacity: 1; } 100% { transform: translateY(calc(100vh + 50px)) translateX(var(--drift-x, 0px)) rotate(var(--rotation-end, 720deg)); opacity: 0; } }
  .heart { position: absolute; font-size: 24px; animation-name: floatUp; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; filter: drop-shadow(0 0 5px rgba(255, 100, 100, 0.5)); bottom: -50px; }
  @keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 2% { opacity: 0.8; } 98% { opacity: 0.8; } 100% { transform: translateY(calc(-100vh - 50px)) scale(1.2); opacity: 0; } }
  .star { position: absolute; color: #FFF; font-size: 16px; text-shadow: 0 0 5px #FFF; opacity: 0; }
  .star-variable { animation: loopFade 12s ease-in-out infinite; }
  @keyframes loopFade { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
  .firework-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation-name: fireworkParticle; animation-timing-function: ease-out; animation-iteration-count: infinite; opacity: 0; }
  @keyframes fireworkParticle { 0% { transform: translate(0, 0); opacity: 1; } 30% { transform: translate(var(--tx), var(--ty)); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)); opacity: 0; } }
  .bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2)); box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); border: 1px solid rgba(255, 255, 255, 0.4); animation-name: floatBubble; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes floatBubble { 0% { transform: translateY(110vh) translateX(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(-20vh) translateX(20px); opacity: 0; } }
  
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
  
  // Detect device type and set root data attribute
  function detectDevice() {
      if (!root) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Mobile if: width <= 768px OR (portrait orientation AND width <= 1024px)
      const isMobile = width <= 768 || (width < height && width <= 1024);
      root.setAttribute('data-device', isMobile ? 'mobile' : 'desktop');
  }
  
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
              } else {
                  bgImageSrc = screen.background.value;
              }
              bgContent = \`<img src="\${bgImageSrc}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:-1;">\`;
          } else if (screen.background.type === 'video') {
              let bgVideoSrc = screen.background.value;
              if (project.mediaLibrary[screen.background.value]) {
                  bgVideoSrc = project.mediaLibrary[screen.background.value].data;
              } else {
                  bgVideoSrc = screen.background.value;
              }
              bgContent = \`<video src="\${bgVideoSrc}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:-1;" autoplay loop muted playsinline></video>\`;
          }
          
          // Generate overlay container div - will be populated by JavaScript
          let overlayContainerHtml = '';
          if (screen.background.overlay && screen.background.overlay !== 'none') {
              overlayContainerHtml = \`<div id="overlay-\${screen.id}" class="overlay-container"></div>\`;
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

          // Elements are already processed by calculateLayout at build time
          // Sort elements by zIndex (just like the preview does)
          const sortedElements = [...screen.elements].sort((a, b) => {
              const aZ = a.styles?.zIndex || 10;
              const bZ = b.styles?.zIndex || 10;
              return aZ - bZ;
          });

          const elementsHtml = sortedElements.map(elem => {
              // Safe area mapping for content screens (0-100% template space → 10-85% screen space)
              let adjustedY = elem.position.y;
              let adjustedHeight = elem.size.height;
              const isContentScreen = screen.type === 'content';
              const safeAreaTop = 10;      // 10% from top (below nav bar)
              const safeAreaBottom = 85;   // 85% from top (above next button)
              const safeAreaHeight = safeAreaBottom - safeAreaTop; // 75% available height

              if (isContentScreen) {
                  // Map element's y position (0-100%) to safe area (10-85%)
                  // Element at y: 0% → renders at y: 10% (top of safe area)
                  // Element at y: 100% → renders at y: 85% (bottom of safe area)
                  adjustedY = safeAreaTop + (elem.position.y / 100) * safeAreaHeight;
                  
                  // Scale element height proportionally to safe area
                  if (adjustedHeight) {
                      adjustedHeight = (adjustedHeight / 100) * safeAreaHeight;
                  }
              }
              
              // Apply mobile font scaling (0.7 factor for mobile, just like ElementRenderer)
              const isMobile = true; // Using mobile as default for export
              const fontScaleFactor = isMobile ? 0.7 : 1.0;
              const scaledFontSize = elem.styles?.fontSize ? elem.styles.fontSize * fontScaleFactor : undefined;

              let style = \`
                  left: \${elem.position.x}%; top: \${adjustedY}%;
                  width: \${elem.size.width ? elem.size.width + '%' : 'auto'};
                  height: \${adjustedHeight ? adjustedHeight + '%' : 'auto'};
                  color: \${elem.styles?.color || 'inherit'};
                  background-color: \${elem.styles?.backgroundColor || 'transparent'};
                  font-size: \${scaledFontSize ? scaledFontSize + 'px' : ''};
                  font-family: \${elem.styles?.fontFamily || ''};
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
                  // Check if content is a media ID or direct URL/placeholder path
                  let imageSrc = elem.content;
                  if (project.mediaLibrary[elem.content]) {
                      // Use uploaded image from mediaLibrary
                      imageSrc = project.mediaLibrary[elem.content].data;
                  } else {
                      // Use placeholder path (e.g., /images/templates/heroes/one-screen-hero.webp)
                      imageSrc = elem.content;
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
                   // Convert media IDs to Base64 data URLs, or use placeholder paths
                   images = images.map(imgId => {
                       if (project.mediaLibrary[imgId]) {
                           // Use uploaded image from mediaLibrary
                           return project.mediaLibrary[imgId].data;
                       } else {
                           // Use placeholder path (e.g., /images/templates/galleries/gallery-1.webp)
                           return imgId;
                       }
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
                   // Check if content is a media ID or direct URL/placeholder path
                   let videoSrc = elem.content;
                   if (project.mediaLibrary[elem.content]) {
                       // Use uploaded video from mediaLibrary
                       videoSrc = project.mediaLibrary[elem.content].data;
                   } else {
                       // Use placeholder path (e.g., /images/templates/videos/video-placeholder.mp4)
                       videoSrc = elem.content;
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

              // Add data-type attribute for stickers to enable float animation
              const dataTypeAttr = elem.type === 'sticker' ? 'data-type="sticker"' : '';
              return \`<div class="\${className}" style="\${style}" \${dataTypeAttr} \${onClick}>\${contentHtml}</div>\`;
          }).join('');

          el.innerHTML = bgContent + overlayContainerHtml + navBar + navPills + elementsHtml + nextButton;
          el.style.cssText = bgStyle;
          root.appendChild(el);
      });
      
      // Execute gallery initialization codes (scripts in innerHTML don't execute, so we run them here)
      galleryInitCodes.forEach(code => {
          try { eval(code); } catch(e) { console.error('Gallery init error:', e); }
      });
      
      // Initialize overlay animations
      function initOverlays() {
          const random = (min, max) => Math.random() * (max - min) + min;
          const randomColor = () => {
              const colors = ['#FFD93D', '#FF4D6D', '#4CC9F0', '#95d5b2', '#a2d6f9', '#ffb3c6', '#FFC300'];
              return colors[Math.floor(Math.random() * colors.length)];
          };
          
          project.screens.forEach(screen => {
              if (!screen.background.overlay || screen.background.overlay === 'none') return;
              const container = document.getElementById('overlay-' + screen.id);
              if (!container) return;
              
              const overlayType = screen.background.overlay;
              
              if (overlayType === 'confetti') {
                  for (let i = 0; i < 30; i++) {
                      const duration = random(6, 9);
                      const p = document.createElement('div');
                      p.className = 'confetti';
                      p.style.left = random(0, 100) + '%';
                      p.style.width = random(6, 12) + 'px';
                      p.style.height = random(6, 12) + 'px';
                      p.style.backgroundColor = randomColor();
                      p.style.animationDelay = random(0, 9) + 's';
                      p.style.animationDuration = duration + 's';
                      p.style.setProperty('--drift-x', random(-50, 50) + 'px');
                      p.style.setProperty('--rotation-end', (random(-180, 180) + 720) + 'deg');
                      container.appendChild(p);
                  }
              } else if (overlayType === 'hearts') {
                  for (let i = 0; i < 15; i++) {
                      const duration = random(10, 16);
                      const p = document.createElement('div');
                      p.className = 'heart';
                      p.textContent = '❤️';
                      p.style.left = random(0, 100) + '%';
                      p.style.fontSize = random(20, 40) + 'px';
                      p.style.color = Math.random() > 0.5 ? '#FF4D6D' : '#FFb3c6';
                      p.style.animationDelay = random(0, 16) + 's';
                      p.style.animationDuration = duration + 's';
                      container.appendChild(p);
                  }
              } else if (overlayType === 'stars') {
                  for (let i = 0; i < 15; i++) {
                      const p = document.createElement('div');
                      p.className = 'star star-variable';
                      p.textContent = '✨';
                      p.style.left = random(0, 100) + '%';
                      p.style.top = random(0, 100) + '%';
                      p.style.fontSize = random(10, 20) + 'px';
                      p.style.animationDelay = (i < 5 ? -6 + random(-1, 1) : random(0, 12)) + 's';
                      p.style.animationDuration = '12s';
                      container.appendChild(p);
                  }
              } else if (overlayType === 'bubbles') {
                  for (let i = 0; i < 20; i++) {
                      const duration = random(15, 25);
                      const p = document.createElement('div');
                      p.className = 'bubble';
                      p.style.left = random(0, 100) + '%';
                      const size = random(20, 60);
                      p.style.width = size + 'px';
                      p.style.height = size + 'px';
                      p.style.animationDelay = random(-duration, 0) + 's';
                      p.style.animationDuration = duration + 's';
                      container.appendChild(p);
                  }
              } else if (overlayType === 'fireworks') {
                  const count = Math.floor(random(20, 31));
                  for (let i = 0; i < count; i++) {
                      const duration = random(3, 6);
                      const burstLeft = random(10, 90);
                      const burstTop = random(10, 70);
                      const particleCount = Math.floor(random(8, 17));
                      
                      for (let j = 0; j < particleCount; j++) {
                          const angle = random(0, 360) * (Math.PI / 180);
                          const dist = random(80, 150);
                          const tx = Math.cos(angle) * dist + 'px';
                          const ty = Math.sin(angle) * dist + 'px';
                          
                          const p = document.createElement('div');
                          p.className = 'firework-particle';
                          p.style.left = burstLeft + '%';
                          p.style.top = burstTop + '%';
                          p.style.backgroundColor = randomColor();
                          p.style.animationDelay = random(0, 6) + 's';
                          p.style.animationDuration = duration + 's';
                          p.style.setProperty('--tx', tx);
                          p.style.setProperty('--ty', ty);
                          container.appendChild(p);
                      }
                  }
              }
          });
      }
      initOverlays();
      
      // Detect and set device type after DOM is ready
      detectDevice();

      renderScreen(project.screens[0].id);
  }
  
  // Also set device on window resize
  window.addEventListener('resize', detectDevice);

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
    // Apply calculateLayout to content screens at build time (before generating HTML)
    const processedProject: Project = {
        ...project,
        screens: project.screens.map(screen => {
            if (screen.type === 'content') {
                const processedElements = calculateLayout(screen.elements, 'mobile');
                return {
                    ...screen,
                    elements: processedElements
                };
            }
            return screen;
        })
    };
    
    // Disable minification to avoid breaking code - regex-based minifiers can't handle complex JavaScript safely
    const minifiedCSS = minifyCSS(GLOBAL_CSS);
    const runtimeScript = getRuntimeScript(processedProject); // Don't minify JS - it breaks template literals and URLs
    
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
