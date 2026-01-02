import type { Project, Screen, ScreenElement } from '../types/model';
import { calculateLayout } from '../templates/registry';

const escapeHtml = (input: string): string =>
  (input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const resolveMedia = (value: string, project: Project): string =>
  project.mediaLibrary[value]?.data || value;

const rand = (min: number, max: number): number => Math.random() * (max - min) + min;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

async function embedGoogleFonts(): Promise<string> {
  const fontUrl =
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';

  try {
    const cssResponse = await fetch(fontUrl);
    const cssText = await cssResponse.text();
    const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
    const fontFaces: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = fontFaceRegex.exec(cssText)) !== null) {
      const fontFaceContent = match[1];
      const familyMatch = fontFaceContent.match(/font-family:\s*['"]?([^'";}]+)['"]?/i);
      if (!familyMatch) continue;
      const fontFamily = familyMatch[1].trim();

      const weightMatch = fontFaceContent.match(/font-weight:\s*(\d+)/i);
      const weight = weightMatch ? weightMatch[1] : '400';

      const styleMatch = fontFaceContent.match(/font-style:\s*(\w+)/i);
      const style = styleMatch ? styleMatch[1] : 'normal';

      const srcMatch = fontFaceContent.match(/src:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (!srcMatch) continue;
      let fontFileUrl = srcMatch[1].trim();

      if (fontFileUrl.startsWith('//')) fontFileUrl = 'https:' + fontFileUrl;
      else if (fontFileUrl.startsWith('/')) fontFileUrl = 'https://fonts.gstatic.com' + fontFileUrl;

      try {
        const fontResponse = await fetch(fontFileUrl);
        const fontBlob = await fontResponse.blob();
        const base64 = await blobToBase64(fontBlob);

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
      } catch {
        // fallback silently
      }
    }
    return fontFaces.join('\n');
  } catch {
    return '';
  }
}

const GLOBAL_CSS_TEMPLATE = `
:root {
  --color-primary: #FF4D6D;
  --color-text: #2D2D2D;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Outfit', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { font-family: var(--font-body); background: #000; overflow: hidden; height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; touch-action: manipulation; }
#root { width: 100%; height: 100%; position: relative; background: white; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
#root.mobile, #root.responsive { max-width: 375px; max-height: calc(100vh - 40px); position: relative; padding-bottom: 177.78%; border-radius: 30px; }
@supports (aspect-ratio: 9 / 16) { #root.mobile, #root.responsive { padding-bottom: 0; aspect-ratio: 9 / 16; } }
@media (min-width: 768px) {
  #root.mobile, #root.responsive {
    max-width: 1200px;
    width: min(90vw, (100vh - 40px) * 16 / 9);
    padding-bottom: 56.25%;
    border-radius: 12px;
    height: auto;
  }
  @supports (aspect-ratio: 16 / 9) {
    #root.mobile, #root.responsive { padding-bottom: 0; aspect-ratio: 16 / 9; }
  }
}

.screen { position:absolute; inset:0; width:100%; height:100%; display:none; z-index:1; }
.screen:target { display:block; z-index:2; }
.screen.default-visible { display:block; z-index:1; }
.screen.content-screen { display:none; flex-direction:column; background:white; }
.screen.content-screen:target, .screen.content-screen.default-visible { display:flex; }
.content-wrapper { flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden; width:100%; position:relative; }

.background { position:absolute; inset:0; width:100%; height:100%; overflow:hidden; }
.background img, .background video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }

.nav-bar { position: relative; width:100%; height:60px; display:flex; align-items:center; z-index:100; padding:0 20px; pointer-events: none; flex-shrink:0; }
.nav-btn { pointer-events: auto; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.3); -webkit-backdrop-filter:blur(5px); backdrop-filter:blur(5px); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size: 20px; text-decoration:none; touch-action:manipulation; }
.screen-title { flex:1; text-align:center; color:white; font-family: var(--font-heading); font-weight:700; text-shadow:0 2px 4px rgba(0,0,0,0.2); }

.element { position: absolute; z-index: 10; cursor: pointer; }
.content-screen .element { position:relative !important; inset:auto !important; width:100% !important; height:auto !important; margin-bottom:12px; padding:0 20px; flex-shrink:0; }
.content-screen .element[data-type="gallery"],
.content-screen .element[data-type="image"],
.content-screen .element[data-type="video"] { flex-grow:1; flex-basis:0 !important; height:0 !important; display:flex; flex-direction:column; min-height:0; margin-bottom:0; padding:10px 20px; }
.content-screen .element[data-type="long-text"] { width:fit-content !important; max-width:100%; margin-left:auto; margin-right:auto; height:auto !important; }
.content-screen .element[data-type="image"] > a { display:block; width:100%; height:100%; }
.content-screen .element[data-type="video"] .video-wrapper { width:100%; height:100%; }
.element[data-type="sticker"] { animation: float 4s ease-in-out infinite; pointer-events: none; }
@keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
.element-button { display:flex; align-items:center; justify-content:center; background: var(--color-primary); color:white; border-radius:999px; font-weight:bold; border:none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); text-decoration:none; }
.element-button:active { transform: scale(0.95); }

.overlay-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; z-index: 1; }
.confetti { position: absolute; width: 10px; height: 10px; background-color: #f00; opacity: 0.8; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; top: -50px; }
@keyframes fall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; } 2% { opacity: 1; } 98% { opacity: 1; } 100% { transform: translateY(110vh) translateX(var(--drift-x, 0px)) rotate(var(--rotation-end, 720deg)); opacity: 0; } }
.heart { position: absolute; font-size: 24px; animation-name: floatUp; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; filter: drop-shadow(0 0 5px rgba(255, 100, 100, 0.5)); bottom: -50px; }
@keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 2% { opacity: 0.8; } 98% { opacity: 0.8; } 100% { transform: translateY(-110vh) scale(1.2); opacity: 0; } }
.star { position: absolute; color: #FFF; font-size: 16px; text-shadow: 0 0 5px #FFF; opacity: 0; }
.star-variable { animation: loopFade 12s ease-in-out infinite; }
@keyframes loopFade { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
.firework-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation-name: fireworkParticle; animation-timing-function: ease-out; animation-iteration-count: infinite; opacity: 0; }
@keyframes fireworkParticle { 0% { transform: translate(0, 0); opacity: 1; } 30% { transform: translate(var(--tx), var(--ty)); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)); opacity: 0; } }
.bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2)); box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); border: 1px solid rgba(255, 255, 255, 0.4); animation-name: floatBubble; animation-timing-function: linear; animation-iteration-count: infinite; }
@keyframes floatBubble { 0% { transform: translateY(110vh) translateX(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(-20vh) translateX(20px); opacity: 0; } }

.navigation-pills { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; padding:20px; z-index:10; overflow-y:auto; align-items:center; box-sizing:border-box; -webkit-overflow-scrolling: touch; }
.navigation-pills > * + * { margin-top: 10px; }
.nav-pill { background:rgba(255,255,255,0.3); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-radius:50px; padding:16px 24px; display:flex; align-items:center; justify-content:flex-start; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s,background 0.2s; border:2px solid rgba(255,255,255,0.3); width:100%; max-width:400px; min-height:60px; cursor:pointer; text-decoration:none; color:inherit; touch-action:manipulation; }
.nav-pill:hover { transform:translateX(4px); box-shadow:0 6px 16px rgba(0,0,0,0.2); background:rgba(255,255,255,1); }
.nav-pill-number { font-size:18px; font-weight:700; color:var(--color-primary); background:rgba(74,144,226,0.1); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:var(--font-heading); }
.nav-pill-title { font-size:16px; font-weight:600; color:var(--color-text); text-align:left; flex:1; font-family:var(--font-body); }

.next-button-container { position:relative; margin-top:auto; padding:12px 20px 20px 20px; z-index:150; width:100%; display:flex; justify-content:center; flex-shrink:0; }
.next-button { background:rgba(255,255,255,0.3); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); color:var(--color-primary); border:none; padding:12px 32px; border-radius:999px; font-size:1rem; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.15); transition:transform 0.2s,box-shadow 0.2s; display:flex; align-items:center; text-decoration:none; touch-action:manipulation; }
.next-button:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.2); }
.next-button:active { transform:translateY(0); transition:none; }

.gallery { display:flex; flex-direction:column; width:100%; height:100%; padding:6px; box-sizing:border-box; }
.gallery input[type="radio"] { display:none; }
.gallery-frame { position:relative; width:100%; flex:1; min-height:0; display:flex; align-items:center; justify-content:center; background-color:transparent; border-radius:10px; overflow:hidden; margin-bottom:8px; }
.gallery-slide { position:absolute; inset:0; opacity:0; display:flex; align-items:center; justify-content:center; pointer-events:none; visibility:hidden; }
.gallery-slide > a { display:block; width:100%; height:100%; }
.gallery-slide img { width:100%; height:100%; object-fit:contain; object-position:center; }
.gallery-thumbs { display:flex; gap:6px; overflow-x:auto; overflow-y:hidden; padding:4px 0; scrollbar-width:thin; -webkit-overflow-scrolling: touch; }
.gallery-thumb { flex-shrink:0; width:60px; height:60px; border-radius:6px; overflow:hidden; cursor:pointer; border:2px solid transparent; opacity:0.75; background-color:#f0f0f0; display:block; touch-action:manipulation; }
.gallery-thumb img { width:100%; height:100%; object-fit:cover; }
.gallery-nav { position:absolute; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); border:none; border-radius:50%; width:36px; height:36px; display:none; align-items:center; justify-content:center; cursor:pointer; color:white; z-index:10; font-size:20px; text-decoration:none; touch-action:manipulation; }
.gallery-nav.prev { left:8px; }
.gallery-nav.next { right:8px; }

.lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.95); display:none; align-items:center; justify-content:center; z-index:9999; padding:0; }
.lightbox:target { display:flex; }
.lightbox .lb-slide { display:none; position:relative; width:100%; height:100%; align-items:center; justify-content:center; }
.lightbox .lb-slide.active { display:flex; }
/* Backdrop handles click-outside-to-close */
.lightbox-backdrop { position:fixed; inset:0; width:100%; height:100%; z-index:1; cursor:default; }
.lightbox .gallery-nav { position:absolute; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.4); border:none; border-radius:50%; width:56px; height:56px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; font-size:32px; text-decoration:none; z-index:10; transition:background 0.2s; }
.lightbox .gallery-nav:hover { background:rgba(0,0,0,0.7); }
.lightbox .gallery-nav.prev { left:24px; }
.lightbox .gallery-nav.next { right:24px; }
.lightbox img { max-width:92vw; max-height:92vh; border-radius:8px; box-shadow:0 10px 40px rgba(0,0,0,0.5); position:relative; z-index:2; pointer-events:none; }
.lightbox video { max-width:90vw; max-height:90vh; border-radius:8px; box-shadow:0 10px 40px rgba(0,0,0,0.5); background:#000; position:relative; z-index:2; }
.lightbox-close { position:absolute; top:20px; right:20px; width:48px; height:48px; border:none; border-radius:50%; background:rgba(255,255,255,0.2); color:white; font-size:32px; cursor:pointer; text-decoration:none; display:flex; align-items:center; justify-content:center; z-index:20; transition:background 0.2s; touch-action:manipulation; }
.lightbox-close:hover { background:rgba(255,255,255,0.4); }
.video-wrapper { position:relative; width:100%; height:100%; }
.video-wrapper video { width:100%; height:100%; object-fit:contain; object-position:center; border-radius:inherit; pointer-events:none; }
.video-lightbox-trigger { position:absolute; inset:0; z-index:5; }

.audio-box { position:absolute; bottom:20px; right:20px; z-index:50; background:rgba(0,0,0,0.4); padding:10px 12px; border-radius:12px; }
.audio-box audio { display:block; }

.nav-pill-number, .nav-pill-title, .screen-title { pointer-events:none; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
`;

const buildGlobalCSS = async (): Promise<string> => {
  const embeddedFonts = await embedGoogleFonts();
  return embeddedFonts + GLOBAL_CSS_TEMPLATE;
};

const buildOverlayHtml = (screen: Screen): string => {
  if (!screen.background.overlay || screen.background.overlay === 'none') return '';
  const overlayType = screen.background.overlay;
  const nodes: string[] = [];

  if (overlayType === 'confetti') {
    for (let i = 0; i < 30; i++) {
      nodes.push(
        `<div class="confetti" style="left:${rand(0, 100)}%;width:${rand(6, 12)}px;height:${rand(
          6,
          12
        )}px;background-color:rgba(${Math.floor(rand(100, 255))},${Math.floor(
          rand(80, 200)
        )},${Math.floor(rand(80, 200))},0.9);animation-delay:${rand(0, 9)}s;animation-duration:${rand(
          6,
          9
        )}s;--drift-x:${rand(-50, 50)}px;--rotation-end:${rand(-180, 180) + 720}deg;"></div>`
      );
    }
  } else if (overlayType === 'hearts') {
    for (let i = 0; i < 15; i++) {
      nodes.push(
        `<div class="heart" style="left:${rand(0, 100)}%;font-size:${rand(
          20,
          40
        )}px;color:${Math.random() > 0.5 ? '#FF4D6D' : '#FFb3c6'};animation-delay:${rand(
          0,
          16
        )}s;animation-duration:${rand(10, 16)}s;">❤️</div>`
      );
    }
  } else if (overlayType === 'stars') {
    for (let i = 0; i < 15; i++) {
      nodes.push(
        `<div class="star star-variable" style="left:${rand(0, 100)}%;top:${rand(
          0,
          100
        )}%;font-size:${rand(10, 20)}px;animation-delay:${i < 5 ? rand(-7, -5) : rand(
          0,
          12
        )}s;"></div>`
      );
    }
  } else if (overlayType === 'bubbles') {
    for (let i = 0; i < 20; i++) {
      const size = rand(20, 60);
      nodes.push(
        `<div class="bubble" style="left:${rand(0, 100)}%;width:${size}px;height:${size}px;animation-delay:${rand(
          -25,
          0
        )}s;animation-duration:${rand(15, 25)}s;"></div>`
      );
    }
  } else if (overlayType === 'fireworks') {
    const count = Math.floor(rand(20, 31));
    for (let i = 0; i < count; i++) {
      const duration = rand(3, 6);
      const burstLeft = rand(10, 90);
      const burstTop = rand(10, 70);
      const particleCount = Math.floor(rand(8, 17));
      for (let j = 0; j < particleCount; j++) {
        const angle = rand(0, 360) * (Math.PI / 180);
        const dist = rand(80, 150);
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        nodes.push(
          `<div class="firework-particle" style="left:${burstLeft}%;top:${burstTop}%;background-color:rgba(${Math.floor(
            rand(100, 255)
          )},${Math.floor(rand(100, 255))},${Math.floor(rand(100, 255))},1);animation-delay:${rand(
            0,
            6
          )}s;animation-duration:${duration}s;--tx:${tx}px;--ty:${ty}px;"></div>`
        );
      }
    }
  }

  return `<div class="overlay-container">${nodes.join('')}</div>`;
};

type GalleryBuild = { html: string; lightboxes: string[] };

const buildGalleryHtml = (elem: ScreenElement, project: Project, screenId: string): GalleryBuild => {
  let images: string[] = [];
  try {
    images = JSON.parse(elem.content);
  } catch {
    images = [elem.content];
  }
  if (!Array.isArray(images)) images = [elem.content];
  images = images.map((id) => resolveMedia(id, project));

  const galleryId = `gallery-${elem.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const inputs = images
    .map((_, idx) => `<input type="radio" name="${galleryId}" id="${galleryId}-${idx}" ${idx === 0 ? 'checked' : ''}>`)
    .join('');



  const slides = images
    .map(
      (src, idx) => `<div class="gallery-slide slide-${idx}">
        <a href="#lb-${galleryId}-${idx}" data-gallery-open><img src="${src}" alt="" loading="lazy" decoding="async"></a>
      </div>`
    )
    .join('');

  const thumbs = images
    .map(
      (src, idx) =>
        `<label class="gallery-thumb thumb-${idx}" for="${galleryId}-${idx}"><img src="${src}" alt="" loading="lazy" decoding="async"></label>`
    )
    .join('');

  const navPrevNext =
    images.length > 1
      ? images
        .map((_, idx) => {
          const prevIdx = (idx - 1 + images.length) % images.length;
          const nextIdx = (idx + 1) % images.length;
          return `
            <label class="gallery-nav prev nav-prev-${idx}" for="${galleryId}-${prevIdx}">‹</label>
            <label class="gallery-nav next nav-next-${idx}" for="${galleryId}-${nextIdx}">›</label>
          `;
        })
        .join('')
      : '';

  const lightboxes = images.map((src, idx) => {
    const prevIdx = (idx - 1 + images.length) % images.length;
    const nextIdx = (idx + 1) % images.length;
    return `
      <div class="lightbox" id="lb-${galleryId}-${idx}">
        <a class="lightbox-backdrop" href="#screen-${screenId}" aria-label="Close"></a>
        <a class="lightbox-close" href="#screen-${screenId}" aria-label="Close">×</a>
        <img src="${src}" alt="">
        ${images.length > 1
        ? `
              <a class="gallery-nav prev" href="#lb-${galleryId}-${prevIdx}">‹</a>
              <a class="gallery-nav next" href="#lb-${galleryId}-${nextIdx}">›</a>
            `
        : ''
      }
      </div>
    `;
  });

  const cssBindings = images
    .map(
      (_, idx) => `
      #${galleryId}-${idx}:checked ~ .gallery-frame .slide-${idx} { opacity:1; position:absolute; display:flex; pointer-events:auto; visibility:visible; }
      #${galleryId}-${idx}:checked ~ .gallery-thumbs .thumb-${idx} { border:3px solid var(--color-primary); opacity:1; }
      #${galleryId}-${idx}:checked ~ .gallery-frame .nav-prev-${idx},
      #${galleryId}-${idx}:checked ~ .gallery-frame .nav-next-${idx} { display:flex; }
    `
    )
    .join('');

  const html = `
    <style>${cssBindings}</style>
    <div class="gallery" id="${galleryId}">
      ${inputs}
      <div class="gallery-frame">
        ${slides}
        ${navPrevNext}
      </div>
      ${images.length > 1 ? `<div class="gallery-thumbs">${thumbs}</div>` : ''}

    </div>
  `;

  return { html, lightboxes };
};

type ElementBuild = { html: string; lightboxes: string[] };

const buildElementHtml = (
  screen: Screen,
  elem: ScreenElement,
  project: Project,
  prevId: string | null,
  nextId: string | null
): ElementBuild => {
  const isContentScreen = screen.type === 'content';
  const safeAreaTop = 10;
  const safeAreaBottom = 85;
  const safeAreaHeight = safeAreaBottom - safeAreaTop;

  let adjustedY = elem.position.y;
  let adjustedHeight = elem.size.height;
  if (isContentScreen) {
    adjustedY = safeAreaTop + (elem.position.y / 100) * safeAreaHeight;
    if (adjustedHeight) adjustedHeight = (adjustedHeight / 100) * safeAreaHeight;
  }

  const fontScaleFactor = 1.1;
  const scaledFontSize = elem.styles?.fontSize ? elem.styles.fontSize * fontScaleFactor : undefined;

  let style = ``;
  if (!isContentScreen) {
    style = `
    left:${elem.position.x}%; top:${adjustedY}%;
    width:${elem.size.width ? elem.size.width + '%' : 'auto'};
    height:${adjustedHeight ? adjustedHeight + '%' : 'auto'};
    `;
  }

  style += `
    color:${elem.styles?.color || 'inherit'};
    background-color:${elem.styles?.backgroundColor || 'transparent'};
    font-size:${scaledFontSize ? scaledFontSize + 'px' : ''};
    font-family:${elem.styles?.fontFamily || ''};
    text-align:${elem.styles.textAlign || 'left'};
    border-radius:${elem.styles.borderRadius || 0}px;
    transform: rotate(${elem.styles.rotation || 0}deg);
    z-index:${elem.styles.zIndex || 10};
    ${elem.styles.shadow ? 'box-shadow: 0 4px 10px rgba(0,0,0,0.2);' : ''}
    ${elem.styles.opacity ? 'opacity:' + elem.styles.opacity + ';' : ''}
  `;

  let contentHtml = '';
  let className = 'element';
  let lightboxes: string[] = [];

  if (elem.type === 'text') {
    contentHtml = escapeHtml(elem.content);
  } else if (elem.type === 'image') {
    const imageSrc = resolveMedia(elem.content, project);
    const lbId = `lb-${elem.id}`;
    contentHtml = `<a href="#${lbId}"><img src="${imageSrc}" alt="" style="width:100%; height:100%; object-fit:contain; object-position:center; display:block; border-radius:inherit;" /></a>`;
    lightboxes.push(
      `<div class="lightbox" id="${lbId}">
        <a class="lightbox-backdrop" href="#screen-${screen.id}" aria-label="Close"></a>
        <a class="lightbox-close" href="#screen-${screen.id}" aria-label="Close">×</a>
        <img src="${imageSrc}" alt="">
      </div>`
    );
    className += '" data-type="image';
  } else if (elem.type === 'button') {
    className += ' element-button';
    const target = elem.metadata?.target;
    let href = `#screen-${screen.id}`;
    if (target === 'next' && nextId) href = `#${nextId}`;
    else if (target === 'back' && prevId) href = `#${prevId}`;
    else if (target === 'nav-screen') href = '#screen-nav';
    else if (target) href = `#screen-${target}`;
    contentHtml = `<a href="${href}" style="color:inherit; text-decoration:none;">${escapeHtml(elem.content)}</a>`;
  } else if (elem.type === 'sticker') {
    contentHtml = escapeHtml(elem.content);
    style += `font-size:${elem.styles.fontSize || 40}px;`;
    className += '" data-type="sticker';
  } else if (elem.type === 'gallery') {
    const gallery = buildGalleryHtml(elem, project, screen.id);
    contentHtml = gallery.html;
    lightboxes = gallery.lightboxes;
    className += '" data-type="gallery'; // Add data attribute for CSS targeting
  } else if (elem.type === 'video') {
    const videoSrc = resolveMedia(elem.content, project);
    const lbId = `lb-video-${elem.id}`;
    contentHtml = `<div class="video-wrapper"><a class="video-lightbox-trigger" href="#${lbId}" aria-label="Open video"></a><video src="${videoSrc}" style="width:100%; height:100%; object-fit:contain; object-position:center; border-radius:inherit;" controls preload="metadata"></video></div>`;
    lightboxes.push(
      `<div class="lightbox" id="${lbId}">
        <a class="lightbox-backdrop" href="#screen-${screen.id}" aria-label="Close"></a>
        <a class="lightbox-close" href="#screen-${screen.id}" aria-label="Close">×</a>
        <video src="${videoSrc}" controls preload="metadata"></video>
      </div>`
    );
    className += '" data-type="video';
  } else if (elem.type === 'long-text') {
    const textContent = escapeHtml(elem.content);
    contentHtml = `<div style="padding:16px; background-color:${elem.styles.backgroundColor || 'rgba(255,255,255,0.9)'}; border-radius:${elem.styles.borderRadius || 16}px; width:100%; height:100%; display:flex; align-items:flex-start; justify-content:flex-start; box-sizing:border-box;">
      <div style="display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; white-space:pre-wrap; word-wrap:break-word; width:100%; height:100%; -webkit-line-clamp:999; line-clamp:999; color:${elem.styles.color || 'inherit'}; font-size:${elem.styles.fontSize ? elem.styles.fontSize + 'px' : 'inherit'}; font-family:${elem.styles.fontFamily || 'inherit'}; font-weight:${elem.styles.fontWeight || 'normal'}; text-align:${elem.styles.textAlign || 'left'};">${textContent}</div>
    </div>`;
    className += '" data-type="long-text';
  } else if (elem.type === 'shape') {
    const isCircle = elem.styles.borderRadius && elem.styles.borderRadius >= 50;
    contentHtml = `<div style="width:100%; height:100%; background-color:${elem.styles.backgroundColor || '#ccc'}; border-radius:${isCircle ? '50%' : (elem.styles.borderRadius || 0) + 'px'};"></div>`;
  }

  return {
    html: `<div class="${className}" style="${style}">${contentHtml}</div>`,
    lightboxes
  };
};

const buildBackgroundHtml = (screen: Screen, project: Project): string => {
  if (screen.background.type === 'solid') {
    return `<div class="background" style="background-color:${screen.background.value};"></div>`;
  }
  if (screen.background.type === 'gradient') {
    return `<div class="background" style="background-image:${screen.background.value};"></div>`;
  }
  if (screen.background.type === 'image') {
    const src = resolveMedia(screen.background.value, project);
    return `<div class="background"><img src="${src}" aria-hidden="true" /></div>`;
  }
  if (screen.background.type === 'video') {
    const src = resolveMedia(screen.background.value, project);
    return `<div class="background"><video src="${src}" autoplay loop muted playsinline></video></div>`;
  }
  return `<div class="background"></div>`;
};

const buildNavigationBar = (screen: Screen, prevId: string | null): string => {
  if (screen.type !== 'content') return '';
  const prevHref = prevId ? `#${prevId}` : `#screen-${screen.id}`;
  return `
    <div class="nav-bar">
      <a class="nav-btn" href="${prevHref}">←</a>
      <div class="screen-title">${escapeHtml(screen.title)}</div>
      <a class="nav-btn" href="#screen-nav">☰</a>
    </div>
  `;
};

const buildNextButton = (screen: Screen, nextId: string | null): string => {
  if (screen.type !== 'content' || !nextId) return '';
  return `
    <div class="next-button-container">
      <a class="next-button" href="#${nextId}">Next →</a>
    </div>
  `;
};

const buildNavPills = (screen: Screen, project: Project): string => {
  if (screen.type !== 'navigation') return '';
  const pills = project.screens
    .map(
      (navScreen, idx) => `
        <a class="nav-pill" href="#screen-${navScreen.id}">
          <span class="nav-pill-number">${idx + 1}</span>
          <span class="nav-pill-title">${escapeHtml(navScreen.title)}</span>
        </a>
      `
    )
    .join('');
  return `<div class="navigation-pills">${pills}</div>`;
};

type ScreenBuild = { html: string; lightboxes: string[] };

const buildScreenHtml = (screen: Screen, project: Project, idx: number, audioHtml: string): ScreenBuild => {
  const prevId = idx > 0 ? `screen-${project.screens[idx - 1].id}` : null;
  const nextId = idx < project.screens.length - 1 ? `screen-${project.screens[idx + 1].id}` : null;
  const navBar = buildNavigationBar(screen, prevId);
  const navPills = buildNavPills(screen, project);
  const nextButton = buildNextButton(screen, nextId);

  // Filter out explicit next buttons for content screens to avoid duplication with footer button
  const elementsToRender = screen.elements.filter(el =>
    screen.type !== 'content' || el.type !== 'button' || el.metadata?.target !== 'next'
  );

  const elementsSorted = [...elementsToRender].sort((a, b) => {
    if (screen.type === 'content') {
      return a.position.y - b.position.y;
    }
    return (a.styles?.zIndex || 10) - (b.styles?.zIndex || 10);
  });
  const elementBuilds = elementsSorted.map((el) => buildElementHtml(screen, el, project, prevId, nextId));
  const elementsHtml = elementBuilds.map((b) => b.html).join('');
  const overlayHtml = buildOverlayHtml(screen);
  const bgHtml = buildBackgroundHtml(screen, project);

  const lightboxes = elementBuilds.flatMap((b) => b.lightboxes);

  let innerContent = elementsHtml;
  if (screen.type === 'content') {
    innerContent = `<div class="content-wrapper">${elementsHtml}</div>`;
  }

  return {
    html: `
    <section class="screen${idx === 0 ? ' default-visible' : ''}${screen.type === 'content' ? ' content-screen' : ''}" id="screen-${screen.id}">
      ${bgHtml}
      ${overlayHtml}
      ${navBar}
      ${navPills}
      ${innerContent}
      ${nextButton}
      ${audioHtml}
    </section>
  `,
    lightboxes
  };
};

const buildGlobalAudio = (project: Project): string => {
  if (!project.config.globalMusic || !project.mediaLibrary[project.config.globalMusic]) return '';
  const audioSrc = project.mediaLibrary[project.config.globalMusic].data;
  return `<div class="audio-box"><audio controls preload="auto" src="${audioSrc}"></audio></div>`;
};

const minifyCSS = (css: string): string =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([:;{}])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

export const buildExportHtml = async (project: Project): Promise<string> => {
  const processedProject: Project = {
    ...project,
    screens: project.screens.map((screen) => {
      if (screen.type === 'content') {
        return { ...screen, elements: calculateLayout(screen.elements, 'mobile') };
      }
      return screen;
    })
  };

  const css = minifyCSS(await buildGlobalCSS());

  const globalAudio = buildGlobalAudio(processedProject);
  let audioInjected = false;
  const screenBuilds = processedProject.screens.map((screen, idx) => {
    const shouldInject = (!audioInjected && screen.type === 'overlay') || (!audioInjected && idx === 0);
    const audioHtml = shouldInject ? (audioInjected = true, globalAudio) : '';
    return buildScreenHtml(screen, processedProject, idx, audioHtml);
  });
  const screensHtml = screenBuilds.map((b) => b.html).join('');
  const allLightboxes = screenBuilds.flatMap((b) => b.lightboxes).join('');

  const deviceClass = 'responsive';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${escapeHtml(project.config.title)}</title>
  <style>${css}</style>
</head>
<body>
  <div id="root" class="${deviceClass}">
    ${screensHtml}
  </div>
  ${allLightboxes}
</body>
</html>`;
};

