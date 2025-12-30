import type { Project } from '../types/model';
import { calculateLayout } from '../templates/registry';

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Embed Google Fonts as base64 data URIs
async function embedGoogleFonts(): Promise<string> {
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';
  
  try {
    // Fetch the Google Fonts CSS
    const cssResponse = await fetch(fontUrl);
    const cssText = await cssResponse.text();
    
    // Parse @font-face declarations from the CSS
    const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
    const fontFaces: string[] = [];
    let match;
    
    while ((match = fontFaceRegex.exec(cssText)) !== null) {
      const fontFaceContent = match[1];
      
      // Extract font-family
      const familyMatch = fontFaceContent.match(/font-family:\s*['"]?([^'";}]+)['"]?/i);
      if (!familyMatch) continue;
      const fontFamily = familyMatch[1].trim();
      
      // Extract font-weight
      const weightMatch = fontFaceContent.match(/font-weight:\s*(\d+)/i);
      const weight = weightMatch ? weightMatch[1] : '400';
      
      // Extract font-style
      const styleMatch = fontFaceContent.match(/font-style:\s*(\w+)/i);
      const style = styleMatch ? styleMatch[1] : 'normal';
      
      // Extract src URL
      const srcMatch = fontFaceContent.match(/src:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (!srcMatch) continue;
      let fontFileUrl = srcMatch[1].trim();
      
      // Convert relative URLs to absolute
      if (fontFileUrl.startsWith('//')) {
        fontFileUrl = 'https:' + fontFileUrl;
      } else if (fontFileUrl.startsWith('/')) {
        fontFileUrl = 'https://fonts.gstatic.com' + fontFileUrl;
      }
      
      try {
        // Fetch font file and convert to base64
        const fontResponse = await fetch(fontFileUrl);
        const fontBlob = await fontResponse.blob();
        const base64 = await blobToBase64(fontBlob);
        
        // Determine format from URL
        let format = 'woff2';
        if (fontFileUrl.includes('.woff2')) format = 'woff2';
        else if (fontFileUrl.includes('.woff')) format = 'woff';
        else if (fontFileUrl.includes('.ttf')) format = 'truetype';
        else if (fontFileUrl.includes('.otf')) format = 'opentype';
        
        fontFaces.push(`@font-face {
  font-family: '${fontFamily}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url(${base64}) format('${format}');
}`);
      } catch (error) {
        console.warn('Failed to embed font file:', fontFileUrl, error);
      }
    }
    
    return fontFaces.join('\n');
  } catch (error) {
    console.warn('Failed to fetch Google Fonts, using fallback:', error);
    // Return empty string - fonts will fall back to system fonts
    return '';
  }
}

// CSS from global.css (simplified) - @import will be replaced with embedded fonts
const GLOBAL_CSS_TEMPLATE = `
  :root {
    --color-primary: #FF4D6D;
    --color-text: #2D2D2D;
    --font-heading: 'Playfair Display', serif;
    --font-body: 'Outfit', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { font-family: var(--font-body); background: #000; overflow: hidden; height: calc(var(--vh, 1vh) * 100); width: 100vw; display: flex; align-items: center; justify-content: center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; touch-action: manipulation; }
  #root { width: 100%; height: 100%; position: relative; background: white; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5); transition: all 0.3s ease; }
  #root[data-device="mobile"] { max-width: 375px; max-height: calc(calc(var(--vh, 1vh) * 100) - 40px); position: relative; padding-bottom: 177.78%; border-radius: 30px; }
  @supports (aspect-ratio: 9 / 16) {
    #root[data-device="mobile"] { padding-bottom: 0; aspect-ratio: 9 / 16; }
  }
  #root[data-device="desktop"] { max-width: 1200px; width: min(90vw, calc((calc(var(--vh, 1vh) * 100) - 40px) * 16 / 9)); position: relative; padding-bottom: 56.25%; border-radius: 8px; height: auto; }
  @supports (aspect-ratio: 16 / 9) {
    #root[data-device="desktop"] { padding-bottom: 0; aspect-ratio: 16 / 9; }
  }
  
  .screen { position: absolute; top:0; left:0; width:100%; height:100%; display:none; opacity:0; transition: opacity 0.5s; z-index:1; }
  .screen.active { display:block; opacity:1; z-index:2; }
  
  .nav-bar { position: absolute; top:0; left:0; width:100%; height:60px; display:flex; align-items:center; z-index:100; padding:0 16px; pointer-events: none; }
  .nav-btn { pointer-events: auto; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.3); -webkit-backdrop-filter:blur(5px); backdrop-filter:blur(5px); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size: 20px; }
  .screen-title { flex:1; text-align:center; color:white; font-family: var(--font-heading); font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.2); }
  
  .element { position: absolute; z-index: 10; cursor: pointer; }
  .element[data-type="sticker"] { animation: float 4s ease-in-out infinite; pointer-events: none; }
  @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
  .element-button { display:flex; align-items:center; justify-content:center; background: var(--color-primary); color:white; border-radius:999px; font-weight:bold; border:none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  .element-button:active { transform: scale(0.95); }
  .overlay-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; z-index: 1; }
  .confetti { position: absolute; width: 10px; height: 10px; background-color: #f00; opacity: 0.8; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; top: -50px; }
  @keyframes fall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; } 2% { opacity: 1; } 98% { opacity: 1; } 100% { transform: translateY(calc(calc(var(--vh, 1vh) * 100) + 50px)) translateX(var(--drift-x, 0px)) rotate(var(--rotation-end, 720deg)); opacity: 0; } }
  .heart { position: absolute; font-size: 24px; animation-name: floatUp; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; filter: drop-shadow(0 0 5px rgba(255, 100, 100, 0.5)); bottom: -50px; }
  @keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 2% { opacity: 0.8; } 98% { opacity: 0.8; } 100% { transform: translateY(calc(calc(var(--vh, 1vh) * -100) - 50px)) scale(1.2); opacity: 0; } }
  .star { position: absolute; color: #FFF; font-size: 16px; text-shadow: 0 0 5px #FFF; opacity: 0; }
  .star-variable { animation: loopFade 12s ease-in-out infinite; }
  @keyframes loopFade { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
  .firework-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation-name: fireworkParticle; animation-timing-function: ease-out; animation-iteration-count: infinite; opacity: 0; }
  @keyframes fireworkParticle { 0% { transform: translate(0, 0); opacity: 1; } 30% { transform: translate(var(--tx), var(--ty)); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)); opacity: 0; } }
  .bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2)); box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); border: 1px solid rgba(255, 255, 255, 0.4); animation-name: floatBubble; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes floatBubble { 0% { transform: translateY(calc(calc(var(--vh, 1vh) * 110))) translateX(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(calc(calc(var(--vh, 1vh) * -20))) translateX(20px); opacity: 0; } }
  
  .menu-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:200; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .menu-item { color:white; font-size:1.5rem; margin:10px; cursor:pointer; font-family:var(--font-heading); }
  .menu-close { position:absolute; top:20px; right:20px; color:white; font-size:30px; cursor:pointer; }
  
  .lightbox { position:fixed; top:0; left:0; width:100vw; height:calc(var(--vh, 1vh) * 100); background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; }
  .lightbox img { max-width:90%; max-height:90%; border-radius:8px; box-shadow:0 0 30px rgba(0,0,0,0.5); }
  .lightbox-close { position:absolute; top:20px; right:20px; color:white; font-size:30px; cursor:pointer; background:none; border:none; }
  .lightbox-nav { position:absolute; top:50%; transform:translateY(-50%); color:white; font-size:40px; cursor:pointer; background:rgba(0,0,0,0.5); border:none; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  .lightbox-prev { left:20px; }
  .lightbox-next { right:20px; }
  .navigation-pills { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; padding:20px 20px 20px; z-index:10; overflow-y:auto; align-items:center; box-sizing:border-box; -webkit-overflow-scrolling: touch; }
  .navigation-pills > * + * { margin-top: 10px; }
  @supports (gap: 10px) {
    .navigation-pills > * + * { margin-top: 0; }
    .navigation-pills { gap: 10px; }
  }
  .nav-pill { background:rgba(255,255,255,0.3); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-radius:50px; padding:16px 24px; display:flex; align-items:center; justify-content:flex-start; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s,background 0.2s; border:2px solid rgba(255,255,255,0.3); width:100%; max-width:400px; min-height:60px; cursor:pointer; }
  .nav-pill > * + * { margin-left: 16px; }
  @supports (gap: 16px) {
    .nav-pill > * + * { margin-left: 0; }
    .nav-pill { gap: 16px; }
  }
  .nav-pill:hover { transform:translateX(4px); box-shadow:0 6px 16px rgba(0,0,0,0.2); background:rgba(255,255,255,1); }
  .nav-pill:active { transform:translateX(2px); }
  .nav-pill-number { font-size:18px; font-weight:700; color:var(--color-primary); background:rgba(74,144,226,0.1); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:var(--font-heading); }
  .nav-pill-title { font-size:16px; font-weight:600; color:var(--color-text); text-align:left; flex:1; font-family:var(--font-body); }
  @media (max-width:768px) { .navigation-pills { padding:20px 16px 16px; } .navigation-pills > * + * { margin-top: 10px; } .nav-pill { max-width:100%; padding:14px 20px; } .nav-pill-number { width:32px; height:32px; font-size:16px; } .nav-pill-title { font-size:15px; } }
  @supports (gap: 10px) {
    @media (max-width:768px) { .navigation-pills > * + * { margin-top: 0; } .navigation-pills { gap: 10px; } }
  }
  @media (min-width:600px) { .navigation-pills { padding:30px 40px 40px; } .navigation-pills > * + * { margin-top: 12px; } .nav-pill { max-width:450px; } }
  @supports (gap: 12px) {
    @media (min-width:600px) { .navigation-pills > * + * { margin-top: 0; } .navigation-pills { gap: 12px; } }
  }
  .next-button-container { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:150; width:100%; display:flex; justify-content:center; padding:0 20px; }
  .next-button { background:rgba(255,255,255,0.3); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); color:var(--color-primary); border:none; padding:12px 32px; border-radius:999px; font-size:1rem; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s; display:flex; align-items:center; }
  .next-button > * + * { margin-left: 8px; }
  @supports (gap: 8px) {
    .next-button > * + * { margin-left: 0; }
    .next-button { gap: 8px; }
  }
  .next-button:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.2); }
  .next-button:active { transform:translateY(0); }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
  .animate-pulse { animation: pulse 2s infinite; }
  
  /* Scrollbar styling for cross-browser compatibility */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
`;

// Function to build CSS with embedded fonts
const buildGlobalCSS = async (): Promise<string> => {
  const embeddedFonts = await embedGoogleFonts();
  return embeddedFonts + GLOBAL_CSS_TEMPLATE;
};

// JS Runtime
const getRuntimeScript = (project: Project) => `
  const project = ${JSON.stringify(project)};
  const root = document.getElementById('root');
  let historyStack = [];
  
  // Fix viewport height for iOS Safari (address bar issue)
  function setVH() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', function() {
    setTimeout(function() {
      setVH();
      detectDevice();
    }, 100);
  });
  
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
              // Start global music when navigating from overlay screen (start button pressed)
              const currentScreen = project.screens[currentIdx];
              if (currentScreen && currentScreen.type === 'overlay' && project.config.globalMusic) {
                  startGlobalMusic();
              }
              historyStack.push(window.activeScreenId);
              renderScreen(project.screens[currentIdx + 1].id);
          }
      } else {
          historyStack.push(window.activeScreenId);
          renderScreen(target);
          document.getElementById('menu').style.display = 'none';
      }
  }

  function openLightbox(src, type, images, startIndex) {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      
      // Handle multiple images (gallery) or single image
      const imageArray = images && Array.isArray(images) ? images : [src];
      let currentIndex = startIndex !== undefined ? startIndex : 0;
      if (currentIndex < 0 || currentIndex >= imageArray.length) currentIndex = 0;
      
      // Create close button (shared for both text and image)
      const closeBtn = document.createElement('button');
      closeBtn.className = 'lightbox-close';
      closeBtn.textContent = '×';
      closeBtn.style.cssText = 'position:absolute; top:20px; right:20px; color:white; font-size:32px; cursor:pointer; background:rgba(0,0,0,0.5); border:none; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:10000;';
      
      const closeLightbox = function() {
          if (lb._keyHandler) document.removeEventListener('keydown', lb._keyHandler);
          lb.remove();
      };
      
      closeBtn.onclick = function(e) {
          e.stopPropagation();
          closeLightbox();
      };
      
      if (type === 'text') {
          const textDiv = document.createElement('div');
          textDiv.style.cssText = 'background-color:rgba(255,255,255,0.95);padding:40px;border-radius:16px;max-width:90%;max-height:calc(var(--vh, 1vh) * 80);overflow-y:auto;font-size:24px;line-height:1.6;color:#333;white-space:pre-wrap;text-align:center;font-family:var(--font-body, sans-serif);box-shadow:0 10px 40px rgba(0,0,0,0.3);user-select:text;-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;cursor:text;';
          textDiv.textContent = src;
          lb.appendChild(closeBtn);
          lb.appendChild(textDiv);
      } else {
          const imgContainer = document.createElement('div');
          imgContainer.style.cssText = 'position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;';
          
          const img = document.createElement('img');
          img.src = imageArray[currentIndex];
          img.style.cssText = 'max-width:90%; max-height:90%; border-radius:8px; box-shadow:0 0 30px rgba(0,0,0,0.5); object-fit:contain;';
          
          // Navigation arrows for multiple images
          if (imageArray.length > 1) {
              const prevBtn = document.createElement('button');
              prevBtn.className = 'lightbox-nav lightbox-prev';
              prevBtn.textContent = '‹';
              prevBtn.style.cssText = 'position:absolute; top:50%; left:20px; transform:translateY(-50%); color:white; font-size:40px; cursor:pointer; background:rgba(0,0,0,0.5); border:none; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:10001;';
              prevBtn.onclick = function(e) {
                  e.stopPropagation();
                  currentIndex = (currentIndex - 1 + imageArray.length) % imageArray.length;
                  img.src = imageArray[currentIndex];
                  updateCounter();
              };
              
              const nextBtn = document.createElement('button');
              nextBtn.className = 'lightbox-nav lightbox-next';
              nextBtn.textContent = '›';
              nextBtn.style.cssText = 'position:absolute; top:50%; right:20px; transform:translateY(-50%); color:white; font-size:40px; cursor:pointer; background:rgba(0,0,0,0.5); border:none; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:10001;';
              nextBtn.onclick = function(e) {
                  e.stopPropagation();
                  currentIndex = (currentIndex + 1) % imageArray.length;
                  img.src = imageArray[currentIndex];
                  updateCounter();
              };
              
              const counter = document.createElement('div');
              counter.style.cssText = 'position:absolute; bottom:20px; left:50%; transform:translateX(-50%); color:white; font-size:16px; background:rgba(0,0,0,0.5); padding:8px 16px; border-radius:20px; z-index:10001;';
              
              function updateCounter() {
                  counter.textContent = (currentIndex + 1) + ' / ' + imageArray.length;
              }
              
              updateCounter();
              imgContainer.appendChild(prevBtn);
              imgContainer.appendChild(nextBtn);
              imgContainer.appendChild(counter);
              
              // Keyboard navigation
              const keyHandler = function(e) {
                  if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      prevBtn.onclick(e);
                  } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      nextBtn.onclick(e);
                  } else if (e.key === 'Escape') {
                      e.preventDefault();
                      closeLightbox();
                  }
              };
              document.addEventListener('keydown', keyHandler);
              lb._keyHandler = keyHandler; // Store for cleanup
          }
          
          imgContainer.appendChild(img);
          lb.appendChild(closeBtn);
          lb.appendChild(imgContainer);
      }
      document.body.appendChild(lb);
      lb.onclick = function(e) { 
          if(e.target === lb) {
              closeLightbox();
          }
      };
  }

  // Global music playback
  let globalAudio = null;
  let isGlobalMusicPausedForVideo = false;
  
  function startGlobalMusic() {
      if (!project.config.globalMusic) return;
      const audioItem = project.mediaLibrary[project.config.globalMusic];
      if (audioItem && audioItem.type === 'audio') {
          if (globalAudio) {
              globalAudio.pause();
          }
          globalAudio = new Audio(audioItem.data);
          globalAudio.loop = true;
          globalAudio.volume = 0.7;
          globalAudio.play().catch(err => console.warn('Audio play failed:', err));
      }
  }
  
  function pauseGlobalMusic() {
      if (globalAudio && !globalAudio.paused) {
          globalAudio.pause();
          isGlobalMusicPausedForVideo = true;
      }
  }
  
  function resumeGlobalMusic() {
      if (globalAudio && isGlobalMusicPausedForVideo) {
          globalAudio.play().catch(err => console.warn('Audio play failed:', err));
          isGlobalMusicPausedForVideo = false;
      }
  }
  
  // Monitor video playback to pause/resume music
  setInterval(function() {
      const videos = document.querySelectorAll('video');
      let anyVideoPlaying = false;
      videos.forEach(video => {
          if (!video.paused && !video.ended && video.readyState > 2) {
              anyVideoPlaying = true;
          }
      });
      if (anyVideoPlaying && globalAudio && !globalAudio.paused) {
          pauseGlobalMusic();
      } else if (!anyVideoPlaying && isGlobalMusicPausedForVideo) {
          resumeGlobalMusic();
      }
  }, 500);

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
          // Only render automatic next button if no visible navigation button elements exist
          const currentIdx = project.screens.findIndex(s => s.id === screen.id);
          const hasNextScreen = currentIdx < project.screens.length - 1;
          const hasNavigationButtons = screen.elements.some(
              el => el.type === 'button' && 
              el.metadata?.action === 'navigate' && 
              el.metadata?.target === 'next' &&
              !el.metadata?.hidden  // Exclude hidden navigation buttons
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
                   const thumbsContainerHtml = images.length > 1 ? '<div id="' + galleryId + '_thumbs" style="display:flex; gap:6px; overflow-x:auto; overflow-y:hidden; padding:4px 0; scrollbar-width:thin; -webkit-overflow-scrolling: touch;">' + thumbnailsHtml + '</div>' : '';
                   
                   // Create onclick handler for gallery hero image to open lightbox
                   const galleryOpenFunc = 'openGalleryLightbox_' + galleryId;
                   const galleryOnClick = 'onclick="' + galleryOpenFunc + '()"';
                   
                   contentHtml = '<div id="' + galleryId + '" style="display:flex; flex-direction:column; width:100%; height:100%; padding:4px; box-sizing:border-box;">' +
                     '<div style="position:relative; width:100%; flex:1; min-height:60%; display:flex; align-items:center; justify-content:center; background-color:#f0f0f0; border-radius:8px; overflow:hidden; margin-bottom:8px;">' +
                       '<img id="' + galleryId + '_hero" src="' + initialImageSrc + '" style="width:100%; height:100%; object-fit:contain; object-position:center; cursor:pointer;" ' + galleryOnClick + ' />' +
                       buttonsHtml +
                     '</div>' +
                     thumbsContainerHtml +
                   '</div>';
                   
                   // Store gallery initialization code - scripts in innerHTML don't execute, so we'll run it after appendChild
                   // Escape the image source for use in JavaScript string - use JSON.stringify for proper escaping
                   const escapedImageSrc = JSON.stringify(initialImageSrc);
                   galleryInitCodes.push(\`(function() {
                     // Gallery lightbox opener
                     window['\${galleryOpenFunc}'] = function() {
                       openLightbox(\${escapedImageSrc}, 'image', \${JSON.stringify(images)}, \${initialIndex});
                     };
                     
                     // Gallery navigation
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
                       if (thumbsContainer.scrollTo) {
                         try {
                           thumbsContainer.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
                         } catch(e) {
                           thumbsContainer.scrollLeft = Math.max(0, scrollPos);
                         }
                       } else {
                         thumbsContainer.scrollLeft = Math.max(0, scrollPos);
                       }
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

export const buildExportHtml = async (project: Project): Promise<string> => {
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
    
    // Build CSS with embedded fonts
    const globalCSS = await buildGlobalCSS();
    
    // Disable minification to avoid breaking code - regex-based minifiers can't handle complex JavaScript safely
    const minifiedCSS = minifyCSS(globalCSS);
    const runtimeScript = getRuntimeScript(processedProject); // Don't minify JS - it breaks template literals and URLs
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${project.config.title}</title>
    <style>${minifiedCSS}</style>
</head>
<body>
    <div id="root"></div>
    <script>${runtimeScript}</script>
</body>
</html>`;
};
