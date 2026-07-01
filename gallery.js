/* ==========================================
   IMPOSTER GALLERY SYSTEM v2
   Arc layout + Grid toggle + Video + Lightbox
   ========================================== */
(function () {

  /* -------- Inject HTML -------- */
  document.body.insertAdjacentHTML('beforeend', `
  <div id="galModal" class="gal-modal" role="dialog" aria-modal="true">
    <div class="gal-backdrop" id="galBackdrop"></div>

    <div class="gal-shell">
      <!-- Header -->
      <div class="gal-header">
        <h2 class="gal-title" id="galTitle"></h2>
        <div class="gal-header-right">
          <button class="gal-view-btn active" id="btnArc"  title="Arc view">◑</button>
          <button class="gal-view-btn"        id="btnGrid" title="Grid view">⊞</button>
          <button class="gal-close" id="galClose">✕</button>
        </div>
      </div>

      <!-- ARC VIEW -->
      <div class="gal-arc-view" id="galArcView">
        <button class="gal-nav gal-prev" id="galPrev">‹</button>
        <div class="gal-arc-stage" id="galArcStage">
          <div class="gal-arc-track" id="galArcTrack"></div>
        </div>
        <button class="gal-nav gal-next" id="galNext">›</button>
        <p class="gal-counter" id="galCounter"></p>
      </div>

      <!-- GRID VIEW -->
      <div class="gal-grid-view hidden" id="galGridView">
        <div class="gal-grid" id="galGrid"></div>
      </div>
    </div>

    <!-- Lightbox -->
    <div class="gal-lb" id="galLb">
      <button class="gal-lb-close" id="galLbClose">✕</button>
      <button class="gal-lb-nav gal-lb-prev" id="galLbPrev">‹</button>
      <div class="gal-lb-media" id="galLbMedia"></div>
      <button class="gal-lb-nav gal-lb-next" id="galLbNext">›</button>
      <p class="gal-lb-caption" id="galLbCaption"></p>
    </div>
  </div>`);

  /* -------- Refs -------- */
  const modal      = document.getElementById('galModal');
  const backdrop   = document.getElementById('galBackdrop');
  const galClose   = document.getElementById('galClose');
  const title      = document.getElementById('galTitle');
  const arcView    = document.getElementById('galArcView');
  const gridView   = document.getElementById('galGridView');
  const arcTrack   = document.getElementById('galArcTrack');
  const gridEl     = document.getElementById('galGrid');
  const counter    = document.getElementById('galCounter');
  const btnArc     = document.getElementById('btnArc');
  const btnGrid    = document.getElementById('btnGrid');
  const galPrev    = document.getElementById('galPrev');
  const galNext    = document.getElementById('galNext');
  const lb         = document.getElementById('galLb');
  const lbMedia    = document.getElementById('galLbMedia');
  const lbCaption  = document.getElementById('galLbCaption');
  const lbClose    = document.getElementById('galLbClose');
  const lbPrev     = document.getElementById('galLbPrev');
  const lbNext     = document.getElementById('galLbNext');

  let items        = [];
  let arcIndex     = 0;   // centre card index
  let lbIndex      = 0;
  const ARC_SLOTS  = 7;   // visible cards in arc

  /* -------- OPEN -------- */
  window.openGallery = function (key) {
    const data = window.GALLERY_DATA && window.GALLERY_DATA[key];
    if (!data) return;
    items    = data.items || [];
    arcIndex = 0;
    title.textContent = data.label;
    buildArc();
    buildGrid();
    setView('arc');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  /* -------- CLOSE -------- */
  function closeModal() {
    modal.classList.remove('active');
    lb.classList.remove('active');
    pauseAllVideos();
    document.body.style.overflow = '';
  }
  galClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  /* -------- VIEW TOGGLE -------- */
  function setView(v) {
    if (v === 'arc') {
      arcView.classList.remove('hidden');
      gridView.classList.add('hidden');
      btnArc.classList.add('active');
      btnGrid.classList.remove('active');
    } else {
      arcView.classList.add('hidden');
      gridView.classList.remove('hidden');
      btnGrid.classList.add('active');
      btnArc.classList.remove('active');
    }
  }
  btnArc.addEventListener('click',  () => setView('arc'));
  btnGrid.addEventListener('click', () => setView('grid'));

  /* -------- BUILD ARC -------- */
  function buildArc() {
    arcTrack.innerHTML = '';
    if (!items.length) return;
    counter.textContent = `${arcIndex + 1} / ${items.length}`;

    const total   = items.length;
    const half    = Math.floor(ARC_SLOTS / 2);
    const radius  = Math.min(window.innerWidth * 0.38, 320);
    const startDeg = -160, endDeg = -20;
    const slotCount = Math.min(ARC_SLOTS, total);
    const step    = slotCount > 1 ? (endDeg - startDeg) / (slotCount - 1) : 0;

    for (let s = 0; s < slotCount; s++) {
      const itemIdx = ((arcIndex - half + s) + total) % total;
      const isCentre = s === half;
      const angle   = (startDeg + step * s) * (Math.PI / 180);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const rot = startDeg + step * s + 90;

      const card = document.createElement('div');
      card.className = 'gal-card' + (isCentre ? ' centre' : '');
      card.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
      card.style.animationDelay = `${s * 60}ms`;

      const item = items[itemIdx];
      if (item.type === 'video') {
        card.innerHTML = `
          <video src="${item.src}" muted loop playsinline preload="metadata"></video>
          <div class="gal-play-icon">▶</div>`;
        card.querySelector('video').addEventListener('mouseenter', e => e.target.play());
        card.querySelector('video').addEventListener('mouseleave', e => { e.target.pause(); e.target.currentTime = 0; });
      } else {
        const img = document.createElement('img');
        img.src   = item.src;
        img.alt   = item.title;
        img.loading = 'lazy';
        img.onerror = () => card.classList.add('gal-broken');
        card.appendChild(img);
      }

      card.addEventListener('click', () => {
        if (isCentre) { openLb(itemIdx); }
        else { arcIndex = itemIdx; buildArc(); }
      });

      arcTrack.appendChild(card);
    }
  }

  /* -------- ARC NAV -------- */
  galPrev.addEventListener('click', () => { arcIndex = (arcIndex - 1 + items.length) % items.length; buildArc(); });
  galNext.addEventListener('click', () => { arcIndex = (arcIndex + 1) % items.length; buildArc(); });

  // Swipe
  let touchX = 0;
  arcTrack.addEventListener('touchstart', e => touchX = e.touches[0].clientX, {passive:true});
  arcTrack.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { arcIndex = (arcIndex + (dx < 0 ? 1 : -1) + items.length) % items.length; buildArc(); }
  }, {passive:true});

  // Mouse wheel
  arcTrack.addEventListener('wheel', e => {
    e.preventDefault();
    arcIndex = (arcIndex + (e.deltaY > 0 ? 1 : -1) + items.length) % items.length;
    buildArc();
  }, {passive:false});

  /* -------- BUILD GRID -------- */
  function buildGrid() {
    gridEl.innerHTML = '';
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'gal-grid-card';

      if (item.type === 'video') {
        card.innerHTML = `
          <video src="${item.src}" muted loop playsinline preload="metadata"></video>
          <div class="gal-play-icon">▶</div>
          <span class="gal-tag-vid">VIDEO</span>`;
        card.querySelector('video').addEventListener('mouseenter', e => e.target.play());
        card.querySelector('video').addEventListener('mouseleave', e => { e.target.pause(); e.target.currentTime = 0; });
      } else {
        const img = document.createElement('img');
        img.src = item.src; img.alt = item.title; img.loading = 'lazy';
        img.onerror = () => card.classList.add('gal-broken');
        card.appendChild(img);
      }

      const cap = document.createElement('p');
      cap.className = 'gal-grid-cap';
      cap.textContent = item.title;
      card.appendChild(cap);
      card.addEventListener('click', () => openLb(i));
      gridEl.appendChild(card);
    });
  }

  /* -------- LIGHTBOX -------- */
  function openLb(i) {
    lbIndex = i;
    renderLb();
    lb.classList.add('active');
  }

  function renderLb() {
    pauseAllVideos();
    lbMedia.innerHTML = '';
    const item = items[lbIndex];
    lbCaption.textContent = `${item.title}  (${lbIndex + 1} / ${items.length})`;

    if (item.type === 'video') {
      const vid = document.createElement('video');
      vid.src = item.src; vid.controls = true; vid.autoplay = true;
      vid.className = 'gal-lb-vid';
      lbMedia.appendChild(vid);
    } else {
      const img = document.createElement('img');
      img.src = item.src; img.alt = item.title;
      img.className = 'gal-lb-img';
      lbMedia.appendChild(img);
    }
  }

  function closeLb() { lb.classList.remove('active'); pauseAllVideos(); }
  lbClose.addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  lbPrev.addEventListener('click', () => { lbIndex = (lbIndex - 1 + items.length) % items.length; renderLb(); });
  lbNext.addEventListener('click', () => { lbIndex = (lbIndex + 1) % items.length; renderLb(); });

  /* -------- KEYBOARD -------- */
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') { lb.classList.contains('active') ? closeLb() : closeModal(); }
    if (lb.classList.contains('active')) {
      if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % items.length; renderLb(); }
      if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + items.length) % items.length; renderLb(); }
    } else {
      if (e.key === 'ArrowRight') { arcIndex = (arcIndex + 1) % items.length; buildArc(); }
      if (e.key === 'ArrowLeft')  { arcIndex = (arcIndex - 1 + items.length) % items.length; buildArc(); }
    }
  });

  function pauseAllVideos() {
    document.querySelectorAll('#galModal video').forEach(v => { v.pause(); v.currentTime = 0; });
  }

})();
