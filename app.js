(function () {
  'use strict';

  const S = window.ChanStore;
  const app = document.getElementById('app');
  const boardNav = document.getElementById('boardNav');
  const themeBtn = document.getElementById('themeBtn');
  const L = S.limits;
  let ownerMode = false;

  /* ---------- utilities ---------- */

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);

  const fmtTime = t => new Date(t).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const snippet = (s, n) => {
    const t = String(s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
  };

  // Only accept image data URLs we produced (guards against tampered storage).
  const safeSrc = s => (typeof s === 'string' && /^data:image\/(jpeg|png|gif|webp);base64,/.test(s)) ? s : '';

  /* ---------- theme ---------- */

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    themeBtn.textContent = t === 'dark' ? 'Açık tema' : 'Koyu tema';
  }
  applyTheme(localStorage.getItem('31chan:theme') || 'dark');
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('31chan:theme', next);
    applyTheme(next);
  });

  /* ---------- routing ---------- */

  // Routes:  #/            home
  //          #/b           board (thread list)
  //          #/b/catalog   board catalog
  //          #/b/t/12      thread 12   (optional ?p=15 to highlight post 15)
  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const qIndex = raw.indexOf('?');
    const pathPart = qIndex === -1 ? raw : raw.slice(0, qIndex);
    const params = new URLSearchParams(qIndex === -1 ? '' : raw.slice(qIndex + 1));
    const parts = pathPart.split('/').filter(Boolean);

    if (parts.length === 0) return { view: 'home' };
    const board = S.getBoard(parts[0]);
    if (!board) return { view: 'notfound' };
    if (parts[1] === 'catalog') return { view: 'catalog', board };
    if (parts[1] === 't' && /^\d+$/.test(parts[2] || '')) {
      return {
        view: 'thread',
        board,
        no: Number(parts[2]),
        highlight: Number(params.get('p')) || null
      };
    }
    return { view: 'board', board };
  }

  /* ---------- rendering helpers ---------- */

  function renderNav(activeId) {
    boardNav.innerHTML = S.boards().map(b =>
      `<a href="#/${b.id}" class="${b.id === activeId ? 'active' : ''}" title="${esc(b.name)}">/${b.id}/ ${esc(b.name)}</a>`
    ).join('');
  }

  // Renders comment text: escapes HTML, greentext, and >>123 quote links.
  function formatComment(text) {
    if (!text) return '';
    return esc(text).split('\n').map(line => {
      const raw = line;
      const green = /^&gt;(?!&gt;)/.test(line); // starts with > but not >>
      let html = line.replace(/&gt;&gt;(\d+)/g, (m, n) => refLink(Number(n)));
      if (green) html = `<span class="greentext">${html}</span>`;
      return raw === '' ? '&nbsp;' : html;
    }).join('<br>');
  }

  function refLink(no) {
    const p = S.findPost(no);
    if (!p) return `<span class="ref dead">&gt;&gt;${no}</span>`;
    return `<a class="ref" href="#/${esc(p.board)}/t/${p.thread}?p=${no}">&gt;&gt;${no}</a>`;
  }

  function imageBlock(img, postNo) {
    const thumb = safeSrc(img.thumb) || safeSrc(img.full);
    const full = safeSrc(img.full) || thumb;
    if (!thumb) return '';
    return `<figure class="pimg">
      <a href="${full}" data-action="expand" data-full="${full}" data-thumb="${thumb}" title="Büyütmek için tıkla">
        <img src="${thumb}" alt="" loading="lazy">
      </a>
      <figcaption>${esc(img.name || 'görsel')} · ${img.w}×${img.h}</figcaption>
    </figure>`;
  }

  function postHTML(p, opts = {}) {
    const own = S.isOwn(p.no);
    const subject = opts.op && p.subject ? `<h3 class="psubj">${esc(p.subject)}</h3>` : '';
    const sage = p.sage ? ' <span class="sage">sage</span>' : '';
    const id = p.anon ? ` <span class="pid">ID: ${esc(p.anon)}</span>` : '';
    const ownTag = own ? ' <span class="own">(Sen)</span>' : '';
    const del = (own || ownerMode) ? ` <button class="link danger" data-action="delete" data-no="${p.no}">${ownerMode && !own ? '[Owner: Sil]' : '[Sil]'}</button>` : '';
    const adminTag = '';
    const report = ` <button class="link" data-action="report" data-no="${p.no}">[Raporla]</button>`;
    return `<article class="post ${opts.op ? 'op' : 'reply'}" id="p${p.no}">
      <header class="phead">
        <span class="pname">${esc(p.name || 'Anonim')}</span>${sage}
        <time>${fmtTime(p.time)}</time>${id}
        <a class="pno" href="#/${esc(p.board)}/t/${p.thread}?p=${p.no}" data-action="reply" data-no="${p.no}">No.${p.no}</a>${ownTag}${adminTag}${del}
      </header>
      ${subject}
      <div class="pbody">
        ${p.image ? imageBlock(p.image, p.no) : ''}
        ${p.comment ? `<div class="pcomment">${formatComment(p.comment)}</div>` : ''}
      </div>
    </article>`;
  }

  function postForm(kind, board, threadNo) {
    const isThread = kind === 'thread';
    const isQuestionBoard = board.id === 'sc';
    const accept = 'image/png,image/jpeg,image/webp,image/gif';
    return `<form class="postform" data-form="${kind}" data-board="${board.id}" ${isThread ? '' : `data-thread="${threadNo}"`} autocomplete="off">
      <h2>${isThread ? (isQuestionBoard ? 'Yeni soru sor' : 'Yeni konu aç') : (isQuestionBoard ? 'Cevap yaz' : 'Yanıt yaz')}</h2>
      <div class="row">
        <label>İsim<input name="name" maxlength="${L.maxName}" placeholder="Anonim"></label>
        ${isThread ? `<label>${isQuestionBoard ? 'Soru başlığı' : 'Konu'}<input name="subject" maxlength="${L.maxSubject}" ${isQuestionBoard ? 'required' : ''}></label>` : ''}
      </div>
      <label>${isQuestionBoard ? (isThread ? 'Sorunun ayrıntıları' : 'Cevabın') : 'Yorum'}<textarea name="comment" rows="${isThread ? 4 : 3}" maxlength="${L.maxComment}" ${isQuestionBoard && isThread ? 'required' : ''} ${isThread ? '' : 'id="replyComment"'}></textarea></label>
      <div class="row">
        <label class="file">Görsel ${isThread && !isQuestionBoard ? '(zorunlu)' : '(isteğe bağlı)'}
          <input type="file" name="image" accept="${accept}" ${isThread && !isQuestionBoard ? 'required' : ''}>
        </label>
        ${isThread ? '' : `<label class="check"><input type="checkbox" name="sage"> sage (konuyu öne çıkarma)</label>`}
      </div>
      <div class="row actions">
        <button type="submit" class="primary">${isThread ? (isQuestionBoard ? 'Soruyu gönder' : 'Konuyu aç') : (isQuestionBoard ? 'Cevabı gönder' : 'Gönder')}</button>
        <span class="form-msg" role="status"></span>
      </div>
      <p class="hint">${isQuestionBoard ? 'Soru başlığı ve ayrıntıları zorunludur. Görsel eklemek isteğe bağlıdır.' : 'JPG, PNG, WEBP veya GIF · en fazla 8 MB · büyük görseller küçültülür.'}</p>
    </form>`;
  }
  /* ---------- views ---------- */

  function homeView() {
    const st = S.stats();
    const boards = S.boards().map(b => {
      const threads = S.listThreads(b.id);
      const posts = threads.reduce((n, t) => n + 1 + t.replies.length, 0);
      return `<a class="boardcard" href="#/${b.id}">
        <strong>/${b.id}/ · ${esc(b.name)}</strong>
        <span>${esc(b.desc)}</span>
        <small>${threads.length} konu · ${posts} gönderi</small>
      </a>`;
    }).join('');

    const recent = S.recentPosts(10).map(p => `
      <li>
        <a href="#/${esc(p.board)}/t/${p.thread}?p=${p.no}">
          <span class="tag">/${esc(p.board)}/</span>
          <b>${esc(p.name || 'Anonim')}</b>
          <span class="muted">No.${p.no}</span>
           <span class="snip">${esc(snippet(p.comment || p.subject || '[görsel]', 120))}</span>
        </a>
        ${ownerMode ? `<button class="link danger" data-action="delete" data-no="${p.no}">[Owner: Sil]</button>` : ''}
      </li>`).join('');

    return `
      ${ownerMode ? '<p class="own" style="font-weight:700;margin:8px 0">[Owner modu etkin]</p>' : ''}
      <section class="hero">
        <h1>31chan</h1>
        <p>Anonim imageboard. Hesap yok, kayıt yok, e-posta yok.</p>
        <p class="muted small">${st.threads} konu · ${st.posts} gönderi (bu tarayıcıda)</p>
      </section>
      <section>
        <h2 class="section-title">Panolar</h2>
        <div class="boards">${boards}</div>
      </section>
      <section>
        <h2 class="section-title">Son gönderiler</h2>
        ${recent ? `<ul class="recent">${recent}</ul>` : '<p class="muted">Henüz gönderi yok. İlk konuyu sen aç.</p>'}
      </section>
      <section class="rules">
        <h2 class="section-title">Kurallar</h2>
        <ol>
          <li>Yasa dışı içerik paylaşmak yasaktır.</li>
          <li>Başkalarının kişisel bilgilerini (adres, telefon vb.) paylaşma.</li>
          <li>Spam ve tekrar eden gönderiler yapma.</li>
          <li>Paylaştığın görsellerin telif haklarına saygı göster.</li>
        </ol>
      </section>`;
  }

  function boardView(board) {
    const threads = S.listThreads(board.id);
    const body = threads.length
      ? threads.map(t => {
          const omitted = Math.max(0, t.replies.length - 3);
          const preview = t.replies.slice(-3);
          return `<section class="thread">
            ${postHTML(t.op, { op: true })}
            ${omitted ? `<p class="omitted">${omitted} yanıt atlandı.</p>` : ''}
            ${preview.map(r => postHTML(r)).join('')}
            <a class="more" href="#/${board.id}/t/${t.op.no}">Konuyu aç · ${t.replies.length} yanıt</a>
          </section>`;
        }).join('')
      : `<p class="muted">Bu panoda henüz ${board.id === 'sc' ? 'soru' : 'konu'} yok. Aşağıdan ilk ${board.id === 'sc' ? 'soruyu sorabilirsin' : 'konuyu açabilirsin'}.</p>`;

    return `
      <div class="boardhead">
        <h1>/${board.id}/ · ${esc(board.name)}</h1>
        <p class="muted">${esc(board.desc)}</p>
        <nav class="subnav"><a class="active" href="#/${board.id}">Liste</a><a href="#/${board.id}/catalog">Katalog</a></nav>
      </div>
      ${postForm('thread', board)}
      <div class="threads">${body}</div>`;
  }

  function catalogView(board) {
    const threads = S.listThreads(board.id);
    const cards = threads.map(t => {
      const img = t.op.image;
      const thumb = img && safeSrc(img.thumb);
      return `<div class="card">
        <a href="#/${board.id}/t/${t.op.no}">
          <div class="cthumb">${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : '<span class="muted">Görsel yok</span>'}</div>
          <div class="csub">${esc(t.op.subject || '(konusuz)')}</div>
          <div class="cmeta">R: ${t.replies.length} · ${esc(snippet(t.op.comment, 60))}</div>
        </a>
        ${ownerMode ? '<button class="link danger" data-action="delete" data-no="' + t.op.no + '">[Owner: Sil]</button>' : ''}
      </div>`;
    }).join('');
    return `
      <div class="boardhead">
        <h1>/${board.id}/ · ${esc(board.name)} · Katalog</h1>
        <nav class="subnav"><a href="#/${board.id}">Liste</a><a class="active" href="#/${board.id}/catalog">Katalog</a></nav>
      </div>
      ${threads.length ? `<div class="catalog">${cards}</div>` : '<p class="muted">Bu panoda henüz konu yok.</p>'}`;
  }

  function threadView(board, no) {
    const thread = S.getThread(no);
    if (!thread || thread.op.board !== board.id) return notFoundView();
    const locked = thread.replies.length + 2 > L.maxPosts;
    return `
      <div class="boardhead">
        <nav class="subnav">
          <a href="#/${board.id}">← /${board.id}/ ${esc(board.name)}</a>
          <a href="#/${board.id}/catalog">Katalog</a>
          <button class="link" type="button" data-action="refresh">Yenile</button>
        </nav>
        <h1 class="thread-title">${esc(thread.op.subject || '(konusuz)')}</h1>
        <p class="muted">${thread.replies.length} ${board.id === 'sc' ? 'cevap' : 'yanıt'}</p>
      </div>
      <section class="thread full">
        ${postHTML(thread.op, { op: true })}
        ${thread.replies.map(r => postHTML(r)).join('')}
      </section>
      ${locked ? '<p class="notice">Bu konu kilitlendi.</p>' : postForm('reply', board, no)}`;
  }

  function notFoundView() {
    return `<div class="boardhead"><h1>Bulunamadı</h1>
      <p class="muted">Bu pano veya konu yok ya da silinmiş.</p>
      <p><a href="#/">Ana sayfaya dön</a></p></div>`;
  }

  /* ---------- render loop ---------- */

  async function render() {
    try {
      ownerMode = await S.checkOwner();
      await S.refresh();
    } catch (err) {
      app.innerHTML = `<section class="hero"><h1>31chan bağlantı hatası</h1><p class="muted">${esc(err.message || 'API’ye ulaşılamadı.')}</p><button type="button" data-action="refresh">Yeniden dene</button></section>`;
      return;
    }
    const r = parseRoute();
    renderNav(r.board ? r.board.id : null);
    let html;
    let title = '31chan';

    switch (r.view) {
      case 'home':
        html = homeView();
        break;
      case 'board':
        html = boardView(r.board);
        title = `/${r.board.id}/ ${r.board.name} · 31chan`;
        break;
      case 'catalog':
        html = catalogView(r.board);
        title = `/${r.board.id}/ Katalog · 31chan`;
        break;
      case 'thread': {
        html = threadView(r.board, r.no);
        const t = S.getThread(r.no);
        if (t) title = `${t.op.subject || 'Konu'} · /${r.board.id}/ · 31chan`;
        break;
      }
      default:
        html = notFoundView();
    }
    document.title = title;
    app.innerHTML = (ownerMode ? '<div class="own" style="font-weight:700;padding:8px 0">[Owner modu etkin]</div>' : '') + html;

    if (r.highlight) {
      const el = document.getElementById('p' + r.highlight);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.classList.add('hl');
        setTimeout(() => el.classList.remove('hl'), 2000);
      }
    }
  }

  function insertQuote(textarea, no) {
    const sep = textarea.value && !textarea.value.endsWith('\n') ? '\n' : '';
    textarea.value += sep + '>>' + no + '\n';
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  /* ---------- image handling ---------- */

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error('Dosya okunamadı.'));
      fr.readAsDataURL(file);
    });
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Görsel okunamadı.')); };
      img.src = url;
    });
  }

  // Draws the image scaled to fit `max` px (white background, for JPEG output).
  function scaledJpeg(img, max, quality) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * s));
    c.height = Math.max(1, Math.round(h * s));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  }

  async function readImage(file) {
    if (!file) return null;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Yalnızca JPG, PNG, WEBP veya GIF yükleyebilirsin.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Görsel 8 MB\'den büyük olamaz.');
    const img = await loadImage(file);
    // Small GIFs keep their animation; everything else is re-encoded as JPEG.
    const keepGif = file.type === 'image/gif' && file.size <= 1.5 * 1024 * 1024;
    const full = keepGif ? await readAsDataURL(file) : scaledJpeg(img, 1024, 0.75);
    return {
      full,
      thumb: scaledJpeg(img, 220, 0.7),
      name: file.name.slice(0, 120),
      w: img.naturalWidth,
      h: img.naturalHeight
    };
  }

  /* ---------- events ---------- */

  app.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'reply') {
      const ta = document.getElementById('replyComment');
      if (ta) {
        e.preventDefault();
        insertQuote(ta, Number(el.dataset.no));
      }
      // otherwise let the link navigate to the thread
    } else if (action === 'expand') {
      e.preventDefault();
      const img = el.querySelector('img');
      const expanded = el.dataset.expanded === '1';
      img.src = expanded ? el.dataset.thumb : el.dataset.full;
      el.dataset.expanded = expanded ? '0' : '1';
    } else if (action === 'delete') {
      e.preventDefault();
      const no = Number(el.dataset.no);
      const target = S.findPost(no);
      const isOp = !!target && target.no === target.thread;
      const msg = 'Bu gönderiyi silmek istiyor musun?' + (isOp ? '\nKonunun tüm yanıtları da silinecek.' : '');
      if (!confirm(msg)) return;
      try {
        await S.deletePost(no, ownerMode);
        render();
      } catch (err) {
        alert(err.message);
      }
    } else if (action === 'report') {
      e.preventDefault();
      const no = Number(el.dataset.no);
      const reason = prompt('Rapor nedeni: Spam, Taciz, Kişisel bilgi, Yasa dışı içerik veya Diğer', 'Spam');
      if (reason === null) return;
      const normalized = reason.trim().toLocaleLowerCase('tr-TR');
      const reasons = {
        'spam': 'Spam',
        'taciz': 'Taciz',
        'kişisel bilgi': 'Kişisel bilgi',
        'yasa dışı içerik': 'Yasa dışı içerik',
        'diğer': 'Diğer',
        'diger': 'Diğer'
      };
      const selected = reasons[normalized];
      if (!selected) {
        alert('Geçerli neden: Spam, Taciz, Kişisel bilgi, Yasa dışı içerik veya Diğer.');
        return;
      }
      const details = prompt('Ek açıklama (isteğe bağlı, en fazla 500 karakter):', '') || '';
      try {
        await S.reportPost(no, selected, details);
        alert('Rapor gönderildi. Teşekkürler.');
      } catch (err) {
        alert(err.message || 'Rapor gönderilemedi.');
      }
    } else if (action === 'refresh') {
      render();
    }
  });

  app.addEventListener('submit', async e => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();

    const msg = form.querySelector('.form-msg');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.textContent = 'İşleniyor…';

    try {
      const fd = new FormData(form);
      const file = fd.get('image');
      const hasFile = file && file.size > 0;
      const image = hasFile ? await readImage(file) : null;
      const name = String(fd.get('name') || '');
      const comment = String(fd.get('comment') || '');
      const boardId = form.dataset.board;

      if (form.dataset.form === 'thread') {
        const post = await S.createThread({ board: boardId, name, subject: String(fd.get('subject') || ''), comment, image });
        location.hash = `#/${boardId}/t/${post.no}`;
      } else {
        const threadNo = Number(form.dataset.thread);
        const post = await S.createReply({ thread: threadNo, name, comment, image, sage: fd.get('sage') === 'on' });
        location.hash = `#/${boardId}/t/${threadNo}?p=${post.no}`; // hashchange re-renders
      }
    } catch (err) {
      msg.textContent = err.message || 'Bir hata oluştu.';
      btn.disabled = false;
    }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('31chan:storage', render);
  window.addEventListener('storage', event => {
    if (event.key === '31chan:theme' || event.key === null) {
      applyTheme(localStorage.getItem('31chan:theme') || 'dark');
    }
  });

  /* ---------- start ---------- */

  render();
})();