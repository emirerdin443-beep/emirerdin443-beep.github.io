/*
 * 31chan data layer backed by the Cloudflare Worker API.
 * The server is authoritative; localStorage keeps only this browser's
 * ownership token and list of posts it may delete.
 */
(function () {
  'use strict';

  const API = 'https://31chan-api.emirerdin443.workers.dev';
  const OWN_KEY = '31chan:own:v1';
  const SECRET_KEY = '31chan:secret:v1';
  const DEVICE_KEY = '31chan:device:v1';
  const BOARDS = [
    { id: 'b', name: 'Rastgele', desc: 'Konu sınırı yok. Ne istersen paylaş.' },
    { id: 'g', name: 'Teknoloji', desc: 'Donanım, yazılım ve açık kaynak.' },
    { id: 'v', name: 'Oyunlar', desc: 'Oyunlar, retro ve incelemeler.' },
    { id: 'm', name: 'Müzik', desc: 'Dinlediğin, yaptığın, önerdiğin.' },
    { id: 'a', name: 'Sanat', desc: 'Çizim, fotoğraf ve dijital işler.' },
    { id: 'sc', name: 'Soru Cevap', desc: 'Sorularını sor, topluluktan cevap al.' }
  ];
  const LIMITS = {
    threadsPerBoard: 100,
    bumpLimit: 300,
    maxPosts: 500,
    maxComment: 2000,
    maxName: 40,
    maxSubject: 80
  };

  let posts = [];
  let loaded = false;

  function ownSet() {
    try { return new Set(JSON.parse(localStorage.getItem(OWN_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveOwn(set) {
    localStorage.setItem(OWN_KEY, JSON.stringify([...set]));
  }
  function secret() {
    let s = localStorage.getItem(SECRET_KEY);
    if (!s) {
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      s = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(SECRET_KEY, s);
    }
    return s;
  }
  function deviceToken() {
    let token = localStorage.getItem(DEVICE_KEY);
    if (!token) {
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DEVICE_KEY, token);
    }
    return token;
  }
  function anonIdFor(threadNo) {
    const str = secret() + ':' + threadNo;
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36).padStart(8, '0').slice(-8);
  }
  function clean(value, max) {
    return String(value || '').replace(/\r/g, '').trim().slice(0, max);
  }
  function getBoard(id) { return BOARDS.find(b => b.id === id) || null; }

  function normalize(row) {
    let image = null;
    if (row.image && typeof row.image === 'object') image = row.image;
    else if (row.image_url) {
      try { image = JSON.parse(row.image_url); }
      catch (e) { image = null; }
    }
    const no = Number(row.no ?? row.id);
    const thread = Number(row.thread ?? row.thread_id ?? no);
    let time = Number(row.time);
    if (!Number.isFinite(time) || time <= 0) {
      time = Date.parse(String(row.created_at || '').replace(' ', 'T') + 'Z');
    }
    return {
      no, thread, board: String(row.board || 'b'),
      name: String(row.name || 'Anonim'),
      subject: String(row.subject || ''),
      comment: String(row.comment ?? row.content ?? ''),
      image,
      sage: !!row.sage,
      anon: String(row.anon || ''),
      time: Number.isFinite(time) ? time : Date.now()
    };
  }

  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Token': secret(),
        'X-Device-Token': deviceToken(),
        ...(options.headers || {})
      }
    });
    let data;
    try { data = await response.json(); }
    catch (e) { throw new Error('API geçerli JSON döndürmedi.'); }
    if (!response.ok || data.error) throw new Error(data.error || 'API isteği başarısız (' + response.status + ').');
    return data;
  }

  async function refresh() {
    const data = await request('/api/posts');
    if (!Array.isArray(data.posts)) throw new Error('API yanıtında posts listesi bulunamadı.');
    posts = data.posts.map(normalize).filter(p => Number.isSafeInteger(p.no) && p.no > 0);
    loaded = true;
    reconcileOwn();
    return posts;
  }

  function reconcileOwn() {
    const existing = new Set(posts.map(p => p.no));
    const own = ownSet();
    let changed = false;
    for (const no of own) {
      if (!existing.has(no)) { own.delete(no); changed = true; }
    }
    if (changed) {
      try { saveOwn(own); } catch (e) { /* best effort */ }
    }
  }

  function indexThreads() {
    const threads = new Map();
    for (const p of posts) {
      if (p.no === p.thread) threads.set(p.no, { op: p, replies: [], bump: p.time });
    }
    for (const p of posts) {
      if (p.no === p.thread) continue;
      const t = threads.get(p.thread);
      if (!t) continue;
      t.replies.push(p);
      if (!p.sage && t.replies.length <= LIMITS.bumpLimit) t.bump = p.time;
    }
    return threads;
  }
  function listThreads(boardId) {
    return [...indexThreads().values()].filter(t => t.op.board === boardId).sort((a, b) => b.bump - a.bump);
  }
  function getThread(no) { return indexThreads().get(Number(no)) || null; }
  function findPost(no) { return posts.find(p => p.no === Number(no)) || null; }
  function recentPosts(limit) { return posts.slice().sort((a, b) => b.time - a.time).slice(0, limit); }
  function stats() {
    let threads = 0;
    for (const p of posts) if (p.no === p.thread) threads++;
    return { threads, posts: posts.length };
  }
  function isOwn(no) { return ownSet().has(Number(no)); }
  function rememberOwn(no) {
    const own = ownSet(); own.add(Number(no)); saveOwn(own);
  }

  async function createThread(input) {
    const board = getBoard(input.board);
    if (!board) throw new Error('Pano bulunamadı.');
    if (board.id !== 'sc' && !input.image) throw new Error('Yeni konu için bir görsel ekleyin.');
    if (board.id === 'sc' && !clean(input.comment, LIMITS.maxComment)) throw new Error('Sorunun ayrıntılarını yazın.');
    const result = await request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        board: board.id,
        name: clean(input.name, LIMITS.maxName) || 'Anonim',
        subject: clean(input.subject, LIMITS.maxSubject),
        content: clean(input.comment, LIMITS.maxComment),
        image: input.image,
        sage: false,
        owner_token: secret()
      })
    });
    if (!result.ok || !result.id) throw new Error('Konu kaydedilemedi.');
    const no = Number(result.id);
    rememberOwn(no);
    await refresh();
    return findPost(no);
  }

  async function createReply(input) {
    const thread = getThread(input.thread);
    if (!thread) throw new Error('Konu bulunamadı veya yenilenmesi gerekiyor.');
    if (thread.replies.length + 2 > LIMITS.maxPosts) throw new Error('Bu konu kilitli.');
    const comment = clean(input.comment, LIMITS.maxComment);
    if (!comment && !input.image) throw new Error('Yorum veya görsel ekleyin.');
    const result = await request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        board: thread.op.board,
        thread: thread.op.no,
        name: clean(input.name, LIMITS.maxName) || 'Anonim',
        content: comment,
        image: input.image || null,
        sage: !!input.sage,
        owner_token: secret()
      })
    });
    if (!result.ok || !result.id) throw new Error('Yanıt kaydedilemedi.');
    const no = Number(result.id);
    rememberOwn(no);
    await refresh();
    return findPost(no);
  }

  async function reportPost(no, reason, details) {
    await request('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        post_id: Number(no),
        reason: String(reason || ''),
        details: clean(details, 500),
        reporter_token: secret()
      })
    });
  }

  async function checkOwner() {
    const result = await request('/api/owner/check', {
      method: 'POST',
      body: JSON.stringify({ owner_token: secret() })
    });
    return result.owner === true;
  }

  async function deletePost(no, ownerMode = false) {
    if (!ownerMode && !isOwn(no)) throw new Error('Yalnızca kendi gönderilerini silebilirsin.');
    await request('/api/posts/' + Number(no), {
      method: 'DELETE',
      body: JSON.stringify({ owner_token: secret() })
    });
    await refresh();
  }

  async function adminState() {
    return request('/api/admin/state', { headers: { 'X-Owner-Token': secret() } });
  }

  async function adminAction(action, payload = {}) {
    return request('/api/admin/action', {
      method: 'POST',
      headers: { 'X-Owner-Token': secret() },
      body: JSON.stringify({ action, ...payload })
    });
  }

  window.ChanStore = {
    boards: () => BOARDS.slice(),
    getBoard, listThreads, getThread, findPost, recentPosts, stats,
    createThread, createReply, deletePost, reportPost, isOwn, checkOwner, refresh, adminState, adminAction, limits: LIMITS
  };
})();