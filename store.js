/*
 * 31chan data layer.
 *
 * All reads/writes go through window.ChanStore so the storage backend can be
 * swapped later (e.g. for a server API) without touching the UI code.
 *
 * Current backend: localStorage (per browser). Posts are stored as one flat,
 * creation-ordered list; threads are derived from it.
 */
(function () {
  'use strict';

  const KEY = '31chan:data:v1';
  const OWN_KEY = '31chan:own:v1';
  const SECRET_KEY = '31chan:secret:v1';

  const BOARDS = [
    { id: 'b', name: 'Rastgele', desc: 'Konu sınırı yok. Ne istersen paylaş.' },
    { id: 'g', name: 'Teknoloji', desc: 'Donanım, yazılım ve açık kaynak.' },
    { id: 'v', name: 'Oyunlar', desc: 'Oyunlar, retro ve incelemeler.' },
    { id: 'm', name: 'Müzik', desc: 'Dinlediğin, yaptığın, önerdiğin.' },
    { id: 'a', name: 'Sanat', desc: 'Çizim, fotoğraf ve dijital işler.' }
  ];

  const LIMITS = {
    threadsPerBoard: 100, // oldest threads are pruned beyond this
    bumpLimit: 300,       // replies after this no longer bump a thread
    maxPosts: 500,        // thread is locked after this many posts
    maxComment: 2000,
    maxName: 40,
    maxSubject: 80
  };

  let cache = null;

  /* ---------- storage ---------- */

  function load() {
    if (cache) return cache;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !Array.isArray(d.posts)) d = { seq: 0, posts: [] };
    if (!Number.isSafeInteger(d.seq) || d.seq < 0) d.seq = 0;
    cache = d;
    return d;
  }

  /* ---------- indexing ---------- */

  // Map<threadNo, {op, replies[], bump}>; replies keep creation order.
  function indexThreads(d) {
    const threads = new Map();
    for (const p of d.posts) {
      if (p.no === p.thread) threads.set(p.no, { op: p, replies: [], bump: p.time });
    }
    for (const p of d.posts) {
      if (p.no === p.thread) continue;
      const t = threads.get(p.thread);
      if (!t) continue;
      t.replies.push(p);
      if (!p.sage && t.replies.length <= LIMITS.bumpLimit) t.bump = p.time;
    }
    return threads;
  }

  // Removes the least recently bumped thread on the whole site, except `keep`.
  function pruneOldest(d, keep) {
    let oldest = null;
    for (const t of indexThreads(d).values()) {
      if (t.op.no === keep) continue;
      if (!oldest || t.bump < oldest.bump) oldest = t;
    }
    if (!oldest) return false;
    d.posts = d.posts.filter(p => p.thread !== oldest.op.no);
    return true;
  }

  // Drop stale ownership markers after quota cleanup or thread pruning.
  function reconcileOwn(posts) {
    const existing = new Set(posts.map(p => p.no));
    const own = ownSet();
    let changed = false;
    for (const no of own) {
      if (!existing.has(no)) {
        own.delete(no);
        changed = true;
      }
    }
    if (changed) {
      try { saveOwn(own); } catch (e) { /* Ownership metadata is best-effort. */ }
    }
  }

  // Writes to localStorage; if the quota is hit, prunes old threads and retries.
  function persist(d, keep) {
    for (;;) {
      try {
        localStorage.setItem(KEY, JSON.stringify(d));
        return;
      } catch (e) {
        if (!pruneOldest(d, keep)) {
          throw new Error('Depolama alanı dolu. Lütfen eski gönderilerinizi silin.');
        }
      }
    }
  }

  // Runs `fn(d)` against the data, persists it, and rolls back on failure.
  function transact(fn, keep) {
    const d = load();
    const snapshot = JSON.stringify(d);
    try {
      const result = fn(d);
      persist(d, keep);
      reconcileOwn(d.posts);
      return result;
    } catch (e) {
      cache = JSON.parse(snapshot);
      throw e;
    }
  }

  /* ---------- per-browser identity ---------- */

  function ownSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(OWN_KEY) || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  function saveOwn(set) {
    localStorage.setItem(OWN_KEY, JSON.stringify([...set]));
  }

  function secret() {
    let s = localStorage.getItem(SECRET_KEY);
    if (!s) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      s = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(SECRET_KEY, s);
    }
    return s;
  }

  // Short per-thread anonymous ID: same browser + same thread = same ID.
  function anonIdFor(threadNo) {
    const str = secret() + ':' + threadNo;
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36).padStart(8, '0').slice(-8);
  }

  /* ---------- helpers ---------- */

  function clean(text, max) {
    return String(text || '').replace(/\r/g, '').trim().slice(0, max);
  }

  function getBoard(id) {
    return BOARDS.find(b => b.id === id) || null;
  }

  function listThreads(boardId) {
    return [...indexThreads(load()).values()]
      .filter(t => t.op.board === boardId)
      .sort((a, b) => b.bump - a.bump);
  }

  function getThread(no) {
    return indexThreads(load()).get(no) || null;
  }

  function findPost(no) {
    return load().posts.find(p => p.no === no) || null;
  }

  function recentPosts(limit) {
    return load().posts.slice().sort((a, b) => b.time - a.time).slice(0, limit);
  }

  function stats() {
    const d = load();
    let threads = 0;
    for (const p of d.posts) if (p.no === p.thread) threads++;
    return { threads, posts: d.posts.length };
  }

  function isOwn(no) {
    return ownSet().has(no);
  }

  function rememberOwn(no) {
    const own = ownSet();
    own.add(no);
    saveOwn(own);
  }

  // Creates a post, enforces the per-board thread cap, and returns the post.
  function insertPost(fields, boardId) {
    const post = transact(d => {
      d.seq += 1;
      const p = Object.assign({ no: d.seq, time: Date.now() }, fields);
      if (!p.thread) p.thread = p.no;
      p.anon = anonIdFor(p.thread);
      d.posts.push(p);

      if (p.no === p.thread) {
        const threads = [...indexThreads(d).values()]
          .filter(t => t.op.board === boardId)
          .sort((a, b) => a.bump - b.bump);
        while (threads.length > LIMITS.threadsPerBoard) {
          const victim = threads.shift();
          if (victim.op.no === p.no) break;
          d.posts = d.posts.filter(x => x.thread !== victim.op.no);
        }
      }
      return p;
    }, fields.thread || load().seq + 1);
    rememberOwn(post.no);
    return post;
  }

  /* ---------- write API ---------- */

  function createThread(input) {
    const board = getBoard(input.board);
    if (!board) throw new Error('Pano bulunamadı.');
    if (!input.image) throw new Error('Yeni konu için bir görsel ekleyin.');
    return insertPost({
      board: board.id,
      name: clean(input.name, LIMITS.maxName) || 'Anonim',
      subject: clean(input.subject, LIMITS.maxSubject),
      comment: clean(input.comment, LIMITS.maxComment),
      image: input.image,
      sage: false
    }, board.id);
  }

  function createReply(input) {
    const thread = getThread(input.thread);
    if (!thread) throw new Error('Konu bulunamadı.');
    if (thread.replies.length + 2 > LIMITS.maxPosts) throw new Error('Bu konu kilitli.');
    const comment = clean(input.comment, LIMITS.maxComment);
    if (!comment && !input.image) throw new Error('Yorum veya görsel ekleyin.');
    return insertPost({
      board: thread.op.board,
      thread: thread.op.no,
      name: clean(input.name, LIMITS.maxName) || 'Anonim',
      comment,
      image: input.image || null,
      sage: !!input.sage
    }, thread.op.board);
  }

  // Only posts created in this browser can be deleted. Deleting a thread's
  // OP removes the whole thread.
  function deletePost(no) {
    if (!isOwn(no)) throw new Error('Yalnızca kendi gönderilerinizi silebilirsiniz.');
    transact(d => {
      const target = d.posts.find(p => p.no === no);
      if (!target) return;
      d.posts = target.no === target.thread
        ? d.posts.filter(p => p.thread !== no)
        : d.posts.filter(p => p.no !== no);
    });
    reconcileOwn(load().posts);
  }

  // Another tab may change the shared localStorage dataset. Invalidate the
  // in-memory snapshot so the next render reads the latest saved version.
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) {
      cache = null;
      window.dispatchEvent(new Event('31chan:storage'));
    }
  });

  window.ChanStore = {
    boards: () => BOARDS.slice(),
    getBoard,
    listThreads,
    getThread,
    findPost,
    recentPosts,
    stats,
    createThread,
    createReply,
    deletePost,
    isOwn,
    limits: LIMITS
  };
})();
