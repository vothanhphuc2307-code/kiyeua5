/* NƠI LƯU GIỮ THANH XUÂN A5 — frontend powered by Supabase */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const REACTIONS = ['🩷', '❤️', '😂', '😭', '🥹', '😍', '✨', '🫶', '🔥', '🤡', '👍', '💯'];
  const FONT_ALLOWLIST = ['Nunito', 'Patrick Hand', 'Playfair Display', 'DM Sans'];
  const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
  const PHOTO_MAX = 15 * 1024 * 1024;
  const VIDEO_MAX = 50 * 1024 * 1024;
  const AVATAR_MAX = 5 * 1024 * 1024;
  const MEDIA_BUCKET = 'memory-media';
  const AVATAR_BUCKET = 'profile-avatars';

  let supabase = null;
  let currentUser = null;
  let currentProfile = null;
  let profiles = [];
  let mediaItems = [];
  let reactionItems = [];
  let commentCounts = new Map();
  let commentsEnabled = true;
  let activeCommentsMediaId = null;
  let editingCommentId = null;
  let homeMonthFilter = 'all';
  let galleryMonthFilter = 'all';
  let signedUrlCache = new Map();
  let activeTab = 'home';
  let homeFilter = 'all';
  let galleryFilter = 'all';
  let searchTerm = '';
  let currentUploadType = 'photo';
  let selectedUploadFiles = [];
  let selectedAvatarFile = null;
  let pendingDeleteMediaId = null;
  let lastUserId = null;
  let pageLoadToken = 0;
  let isUploading = false;
  let activeCropIndex = 0;
  let cropImage = null;
  let cropObjectUrl = null;
  let cropView = { zoom: 1, scale: 1, width: 800, height: 800, displayWidth: 0, displayHeight: 0, x: 0, y: 0, dragging: false, pointerX: 0, pointerY: 0 };
  let activeTrimIndex = 0;
  let trimObjectUrl = null;
  let trimDuration = 0;
  let isTrimming = false;

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function escapeAttr(value) { return escapeHTML(value).replace(/`/g, '&#96;'); }
  function safeColor(value) { return /^#[0-9a-fA-F]{6}$/.test(String(value)) ? value : '#b64f73'; }
  function safeFont(value) { return FONT_ALLOWLIST.includes(value) ? value : 'Nunito'; }
  function shortInitial(name) { const text = String(name || 'A5').trim(); return escapeHTML(text ? [...text][0].toUpperCase() : 'A'); }
  function displayName(profile) { return profile?.display_name || profile?.nickname || 'Bạn A5'; }
  function humanBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function formatDate(value, withSeconds = true) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), hour12: false
    });
  }
  function formatMonth(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
  }
  function monthKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  function monthLabel(key) {
    if (!/^\d{4}-\d{2}$/.test(String(key))) return 'Tất cả các tháng';
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }
  function populateMonthFilters() {
    const currentMonth = monthKey(new Date());
    const months = [...new Set([currentMonth, ...mediaItems.map(item => monthKey(item.created_at)).filter(Boolean)])].sort().reverse();
    for (const [id, value] of [['homeMonthFilter', homeMonthFilter], ['galleryMonthFilter', galleryMonthFilter]]) {
      const select = $(`#${id}`);
      if (!select) continue;
      const previous = value || select.value || 'all';
      select.innerHTML = `<option value="all">Tất cả các tháng</option><option value="${currentMonth}">🌷 ${escapeHTML(monthLabel(currentMonth))} (tháng này)</option>` + months.filter(month => month !== currentMonth).map(month => `<option value="${month}">${escapeHTML(monthLabel(month))}</option>`).join('');
      select.value = months.includes(previous) || previous === 'all' ? previous : 'all';
    }
    const count = mediaItems.filter(item => monthKey(item.created_at) === currentMonth).length;
    const note = $('#homeMonthNote');
    if (note) note.textContent = count ? `🌷 Tháng này, A5 đã lưu ${count} kỷ niệm. Mỗi tấm hình là một mảnh ghép thanh xuân!` : `🌷 Tháng này chưa có kỷ niệm mới — ai sẽ mở đầu cuốn lưu bút nhỉ?`;
  }
  function safeFileName(name) {
    return String(name || 'memory-file').normalize('NFC').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '').slice(-90) || 'memory-file';
  }
  function uniqueId() {
    return (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function toast(message, type = 'success', duration = 3300) {
    const region = $('#toastRegion');
    if (!region) return;
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.setAttribute('role', type === 'error' ? 'alert' : 'status');
    node.textContent = message;
    region.appendChild(node);
    window.setTimeout(() => { node.style.opacity = '0'; node.style.transform = 'translateX(12px)'; window.setTimeout(() => node.remove(), 240); }, duration);
  }
  function isConfigured() {
    const config = window.A5_CONFIG || {};
    return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
      !String(config.SUPABASE_URL).includes('YOUR_SUPABASE') &&
      !String(config.SUPABASE_ANON_KEY).includes('YOUR_SUPABASE'));
  }
  function showAuthScreen() {
    $('#appShell').classList.add('hidden');
    $('#authScreen').classList.remove('hidden');
    if (!isConfigured() || !window.supabase?.createClient) {
      $('#setupNotice').classList.remove('hidden');
      $('#authHint').textContent = !isConfigured()
        ? 'Hoàn tất phần kết nối ở README để bật đăng nhập và lưu trữ.'
        : 'Chưa tải được thư viện kết nối. Kiểm tra kết nối mạng rồi tải lại trang nhé.';
    } else {
      $('#setupNotice').classList.add('hidden');
      $('#authHint').textContent = 'Tài khoản của cậu sẽ có một góc riêng để quản lý bài đăng.';
    }
  }
  function showAppShell() {
    $('#authScreen').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
  }

  async function initialize() {
    window.setTimeout(() => $('#splash')?.classList.add('done'), 700);
    bindEvents();
    if (!isConfigured() || !window.supabase?.createClient) {
      showAuthScreen();
      return;
    }
    const cfg = window.A5_CONFIG;
    try {
      supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data?.session) await handleSession(data.session);
      else showAuthScreen();
      supabase.auth.onAuthStateChange((event, session) => {
        // Defer application calls so the auth callback cannot hold the auth lock.
        window.setTimeout(() => {
          if (event === 'SIGNED_OUT') {
            currentUser = null; currentProfile = null; profiles = []; mediaItems = []; reactionItems = []; lastUserId = null;
            showAuthScreen();
          } else if (session?.user) {
            handleSession(session).catch(error => {
              console.error('Auth session handling error:', error);
              toast('Chưa tải được góc lưu bút. Cậu thử tải lại trang nhé.', 'error');
            });
          }
        }, 0);
      });
    } catch (error) {
      console.error('Supabase initialization error:', error);
      showAuthScreen();
      toast('Không kết nối được backend. Hãy kiểm tra URL và anon key trong config.js.', 'error', 6000);
    }
  }

  async function signIn(provider) {
    if (!isConfigured() || !supabase) {
      $('#setupNotice')?.classList.remove('hidden');
      toast('Cậu cần kết nối Supabase trước khi đăng nhập.', 'info', 4800);
      return;
    }
    const buttons = [$('#googleLogin'), $('#facebookLogin')];
    buttons.forEach(button => { if (button) button.disabled = true; });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
      });
      if (error) throw error;
    } catch (error) {
      console.error('OAuth sign-in failed:', error);
      toast(`${provider === 'google' ? 'Google' : 'Facebook'} chưa đăng nhập được. Kiểm tra cấu hình OAuth trong Supabase.`, 'error', 5000);
      buttons.forEach(button => { if (button) button.disabled = false; });
    }
  }

  async function handleSession(session) {
    if (!session?.user) { showAuthScreen(); return; }
    const sameUser = lastUserId === session.user.id && !$('#appShell').classList.contains('hidden');
    currentUser = session.user;
    showAppShell();
    if (sameUser) {
      await syncLinkedProviders();
      renderProfile();
      return;
    }
    lastUserId = session.user.id;
    await loadData(true);
    await syncLinkedProviders();
    renderAll();
  }

  async function signOut() {
    if (!supabase) return;
    const button = $('#logoutButton');
    if (button) button.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (button) button.disabled = false;
    if (error) { console.error(error); toast('Chưa đăng xuất được. Thử lại nhé.', 'error'); return; }
    currentUser = null; currentProfile = null; profiles = []; mediaItems = []; reactionItems = []; lastUserId = null;
    signedUrlCache.clear(); showAuthScreen(); toast('Hẹn gặp cậu ở cuốn lưu bút nhé ♡', 'success');
  }

  async function resolveSignedUrl(bucket, path) {
    if (!path || !supabase) return '';
    const key = `${bucket}:${path}`;
    const cached = signedUrlCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.url;
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 86400);
      if (error) throw error;
      const url = data?.signedUrl || '';
      signedUrlCache.set(key, { url, expiresAt: Date.now() + 22 * 60 * 60 * 1000 });
      return url;
    } catch (error) {
      console.warn(`Could not sign ${bucket} path`, error);
      return '';
    }
  }

  async function loadData(showLoading = false) {
    if (!supabase || !currentUser) return;
    const token = ++pageLoadToken;
    if (showLoading) {
      $('#homeMediaGrid').innerHTML = loadingCard('Đang tìm lại những kỷ niệm...');
      $('#galleryMediaGrid').innerHTML = loadingCard('Đang xếp album...');
      $('#peopleGrid').innerHTML = loadingCard('Đang gọi tên những người bạn...');
    }
    try {
      const [profileResult, mediaResult] = await Promise.all([
        supabase.from('profiles').select('id,display_name,nickname,bio,avatar_path,profile_color,linked_providers,created_at,updated_at').order('created_at', { ascending: true }),
        supabase.from('media_items').select('id,user_id,media_type,storage_path,caption,note_color,note_font,created_at,updated_at,profiles(id,display_name,nickname,bio,avatar_path,profile_color,linked_providers,created_at)').order('created_at', { ascending: false }).limit(200)
      ]);
      if (profileResult.error) throw profileResult.error;
      if (mediaResult.error) throw mediaResult.error;
      const rawProfiles = profileResult.data || [];
      const profileResolved = await Promise.all(rawProfiles.map(async profile => ({
        ...profile, avatar_url: await resolveSignedUrl(AVATAR_BUCKET, profile.avatar_path)
      })));
      if (token !== pageLoadToken) return;
      profiles = profileResolved;
      currentProfile = profiles.find(profile => profile.id === currentUser.id) || null;
      if (!currentProfile) {
        // A profile trigger should create this row; reload once in case the auth trigger was still running.
        await ensureOwnProfile();
        const retry = await supabase.from('profiles').select('id,display_name,nickname,bio,avatar_path,profile_color,linked_providers,created_at,updated_at').eq('id', currentUser.id).maybeSingle();
        if (retry.data) {
          const resolved = { ...retry.data, avatar_url: await resolveSignedUrl(AVATAR_BUCKET, retry.data.avatar_path) };
          profiles = [...profiles.filter(p => p.id !== resolved.id), resolved]; currentProfile = resolved;
        }
      }
      const rawMedia = mediaResult.data || [];
      mediaItems = await Promise.all(rawMedia.map(async item => {
        const owner = profiles.find(profile => profile.id === item.user_id) || item.profiles || null;
        const mediaUrl = await resolveSignedUrl(MEDIA_BUCKET, item.storage_path);
        return { ...item, url: mediaUrl, profiles: owner };
      }));
      if (token !== pageLoadToken) return;
      await loadReactions();
      await loadCommentCounts();
      renderAll();
      if (!currentProfile) toast('Chưa tải được hồ sơ tài khoản. Hãy kiểm tra lại schema SQL trong Supabase.', 'error', 6000);
    } catch (error) {
      console.error('loadData failed:', error);
      const message = error?.message || 'Không rõ nguyên nhân';
      $('#homeMediaGrid').innerHTML = errorCard('Không tải được album', 'Kiểm tra schema SQL, quyền truy cập và kết nối Supabase.');
      $('#galleryMediaGrid').innerHTML = errorCard('Album chưa sẵn sàng', 'Hãy kiểm tra thiết lập backend theo README.');
      $('#peopleGrid').innerHTML = errorCard('Chưa tải được thành viên', 'Hãy kiểm tra thiết lập backend theo README.');
      toast(`Tải dữ liệu thất bại: ${message.slice(0, 95)}`, 'error', 6500);
    }
  }

  async function ensureOwnProfile() {
    if (!currentUser || !supabase) return;
    const meta = currentUser.user_metadata || {};
    const name = String(meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'Bạn A5').slice(0, 40);
    const { error } = await supabase.from('profiles').upsert({
      id: currentUser.id, display_name: name, nickname: '', bio: '', linked_providers: linkedProviders(currentUser)
    }, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.warn('Profile bootstrap fallback did not complete:', error.message);
  }

  function linkedProviders(user = currentUser) {
    const providers = new Set();
    (user?.identities || []).forEach(identity => { if (identity?.provider) providers.add(identity.provider); });
    if (user?.app_metadata?.provider) providers.add(user.app_metadata.provider);
    (user?.app_metadata?.providers || []).forEach(provider => providers.add(provider));
    return [...providers].filter(provider => ['google', 'facebook', 'email', 'apple', 'github'].includes(provider));
  }

  async function syncLinkedProviders() {
    if (!supabase || !currentUser || !currentProfile) return;
    const providers = linkedProviders(currentUser);
    const existing = [...(currentProfile.linked_providers || [])].sort().join(',');
    const incoming = [...providers].sort().join(',');
    if (existing === incoming) return;
    const { data, error } = await supabase.from('profiles').update({ linked_providers: providers }).eq('id', currentUser.id).select('id,display_name,nickname,bio,avatar_path,profile_color,linked_providers,created_at,updated_at').maybeSingle();
    if (error) { console.warn('Could not sync linked providers:', error.message); return; }
    if (data) {
      currentProfile = { ...currentProfile, ...data };
      profiles = profiles.map(profile => profile.id === currentUser.id ? { ...profile, ...data } : profile);
    }
  }

  async function loadReactions() {
    if (!supabase || !currentUser) return;
    const ids = mediaItems.map(item => item.id);
    if (!ids.length) { reactionItems = []; return; }
    const { data, error } = await supabase.from('reactions')
      .select('id,media_id,user_id,emoji,created_at,profiles(id,display_name,nickname,avatar_path)')
      .in('media_id', ids);
    if (error) throw error;
    reactionItems = (data || []).map(item => ({ ...item, profile: profiles.find(profile => profile.id === item.user_id) || item.profiles || null }));
    mediaItems = mediaItems.map(item => ({ ...item, reactions: reactionItems.filter(reaction => reaction.media_id === item.id) }));
  }

  async function loadCommentCounts() {
    commentCounts = new Map();
    commentsEnabled = true;
    if (!supabase || !currentUser || !mediaItems.length) return;
    try {
      const ids = mediaItems.map(item => item.id);
      const { data, error } = await supabase.from('media_comments').select('media_id').in('media_id', ids).limit(1000);
      if (error) throw error;
      (data || []).forEach(row => commentCounts.set(row.media_id, (commentCounts.get(row.media_id) || 0) + 1));
    } catch (error) {
      commentsEnabled = false;
      console.warn('Comments feature needs the v2 database migration:', error?.message || error);
    }
  }

  function loadingCard(text) { return `<div class="loading-card"><span class="loading-flower">✿</span><p>${escapeHTML(text)}</p></div>`; }
  function errorCard(title, message) { return `<div class="loading-card"><span class="loading-flower">♡</span><p><strong>${escapeHTML(title)}</strong></p><p>${escapeHTML(message)}</p></div>`; }
  function avatarHTML(profile, className = 'avatar') {
    const url = profile?.avatar_url;
    const label = displayName(profile);
    return `<span class="${className}" title="${escapeAttr(label)}">${url ? `<img src="${escapeAttr(url)}" alt="Ảnh đại diện ${escapeAttr(label)}" loading="lazy"/>` : shortInitial(label)}</span>`;
  }
  function userReactionSet(item) {
    const result = new Map();
    (item.reactions || reactionItems.filter(reaction => reaction.media_id === item.id)).forEach(reaction => {
      if (!result.has(reaction.emoji)) result.set(reaction.emoji, []);
      result.get(reaction.emoji).push(reaction);
    });
    return result;
  }
  function renderMediaCard(item, index = 0) {
    const owner = profiles.find(profile => profile.id === item.user_id) || item.profiles || {};
    const own = currentUser && item.user_id === currentUser.id;
    const reactions = userReactionSet(item);
    const date = new Date(item.created_at);
    const iso = Number.isNaN(date.getTime()) ? '' : date.toISOString();
    const timestamp = escapeHTML(formatDate(item.created_at, true));
    const mediaLabel = item.media_type === 'video' ? '▶ VIDEO' : '▧ ẢNH';
    const media = item.url
      ? (item.media_type === 'video'
        ? `<video src="${escapeAttr(item.url)}" controls playsinline preload="metadata" aria-label="Video kỷ niệm của ${escapeAttr(displayName(owner))}"></video>`
        : `<img src="${escapeAttr(item.url)}" alt="Kỷ niệm của ${escapeAttr(displayName(owner))}" loading="lazy"/>`)
      : `<div class="media-visual-fallback">${item.media_type === 'video' ? '▷' : '✿'}</div>`;
    const caption = item.caption ? `<p class="media-note" style="--note-color:${safeColor(item.note_color)};--note-font:'${safeFont(item.note_font)}'">${escapeHTML(item.caption)}</p>` : '';
    const visibleEmojis = [...new Set([...REACTIONS.slice(0, 3), ...reactions.keys()])];
    const reactButtons = visibleEmojis.map(emoji => {
      const group = reactions.get(emoji) || [];
      const mine = group.some(reaction => reaction.user_id === currentUser?.id);
      return `<span class="reaction-pill ${mine ? 'mine' : ''}"><button class="reaction-emoji" data-action="toggle-reaction" data-media-id="${escapeAttr(item.id)}" data-emoji="${escapeAttr(emoji)}" aria-label="Thả ${escapeAttr(emoji)}">${escapeHTML(emoji)}</button><button class="reaction-count" data-action="who-reacted" data-media-id="${escapeAttr(item.id)}" data-emoji="${escapeAttr(emoji)}" aria-label="Xem ai đã thả ${escapeAttr(emoji)}">${group.length}</button></span>`;
    }).join('');
    const downloadText = item.media_type === 'video' ? 'Tải video về máy' : 'Tải ảnh về máy';
    return `<article class="memory-card" style="animation-delay:${Math.min(index * 35, 280)}ms" data-media-card="${escapeAttr(item.id)}">
      <div class="media-visual">${media}<span class="media-type-tag">${mediaLabel}</span>${own ? `<div class="media-owner-actions"><button class="tiny-action" data-action="edit-media" data-media-id="${escapeAttr(item.id)}" aria-label="Sửa kỷ niệm" title="Chỉnh sửa">✎</button><button class="tiny-action" data-action="delete-media" data-media-id="${escapeAttr(item.id)}" aria-label="Xóa kỷ niệm" title="Xóa">⌫</button></div>` : ''}</div>
      <div class="media-card-body"><button class="media-download-button" type="button" data-action="download-media" data-media-id="${escapeAttr(item.id)}" ${item.url ? '' : 'disabled'}><span aria-hidden="true">⇩</span> ${downloadText}</button>${caption}<div class="media-meta">${avatarHTML(owner)}<span class="media-owner-name" data-action="view-profile" data-user-id="${escapeAttr(item.user_id)}" role="button" tabindex="0">${escapeHTML(displayName(owner))}</span><time class="media-timestamp" datetime="${escapeAttr(iso)}" title="Thời gian chính xác: ${escapeAttr(iso)}">${timestamp}</time></div><div class="card-divider"></div><div class="reaction-row">${reactButtons}<button class="react-more" data-action="more-reactions" data-media-id="${escapeAttr(item.id)}" aria-label="Chọn thêm cảm xúc" title="Thêm cảm xúc">＋</button><button class="card-react-prompt" data-action="who-reacted" data-media-id="${escapeAttr(item.id)}" title="Xem các cảm xúc">ai thả?</button></div><button class="comment-open-button" data-action="open-comments" data-media-id="${escapeAttr(item.id)}"><span>💬 Bình luận</span><strong>${commentCounts.get(item.id) || 0}</strong></button></div>
    </article>`;
  }

  function searchable(item) {
    if (!searchTerm) return true;
    const owner = profiles.find(profile => profile.id === item.user_id) || {};
    const haystack = [item.caption, displayName(owner), owner.nickname, owner.bio, item.media_type].join(' ').toLocaleLowerCase('vi');
    return haystack.includes(searchTerm);
  }
  function renderHomeMedia() {
    let items = mediaItems.filter(searchable);
    if (homeFilter !== 'all') items = items.filter(item => item.media_type === homeFilter);
    if (homeMonthFilter !== 'all') items = items.filter(item => monthKey(item.created_at) === homeMonthFilter);
    const matchedCount = items.length;
    items = items.slice(0, 6);
    $('#homeMediaGrid').innerHTML = items.length ? items.map(renderMediaCard).join('') : '';
    $('#homeEmpty').classList.toggle('hidden', items.length !== 0);
    $('#homeMediaGrid').classList.toggle('hidden', items.length === 0);
    $('#homeMediaCount').textContent = `${matchedCount} kỷ niệm khớp bộ lọc`;
    const filteredEmpty = mediaItems.length > 0 && (Boolean(searchTerm) || homeFilter !== 'all' || homeMonthFilter !== 'all');
    $('#homeEmpty h3').textContent = filteredEmpty ? 'Chưa có kỷ niệm khớp bộ lọc' : 'Trang lưu bút vẫn đang chờ!';
    $('#homeEmpty p').textContent = filteredEmpty ? 'Thử chọn tháng khác, bỏ bộ lọc hoặc tìm bằng từ khóa khác nhé.' : 'Hãy là người đầu tiên góp một khoảnh khắc vào album A5 nhé.';
    $$('[data-home-filter]').forEach(button => button.classList.toggle('active', button.dataset.homeFilter === homeFilter));
  }
  function renderGallery() {
    let items = mediaItems.filter(searchable);
    if (galleryFilter === 'photo' || galleryFilter === 'video') items = items.filter(item => item.media_type === galleryFilter);
    if (galleryFilter === 'mine') items = items.filter(item => item.user_id === currentUser?.id);
    if (galleryMonthFilter !== 'all') items = items.filter(item => monthKey(item.created_at) === galleryMonthFilter);
    if ($('#gallerySort')?.value === 'oldest') items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    $('#galleryMediaGrid').innerHTML = items.map(renderMediaCard).join('');
    $('#galleryEmpty').classList.toggle('hidden', items.length !== 0);
    $('#galleryMediaGrid').classList.toggle('hidden', items.length === 0);
    $$('[data-gallery-filter]').forEach(button => button.classList.toggle('active', button.dataset.galleryFilter === galleryFilter));
  }
  function renderPeople() {
    const query = searchTerm;
    const people = profiles.filter(profile => {
      if (!query) return true;
      return [displayName(profile), profile.nickname, profile.bio].join(' ').toLocaleLowerCase('vi').includes(query);
    });
    const tint = ['#fde9ed', '#eee8ff', '#fff2d4', '#e5f3e8', '#fce9e0'];
    $('#peopleCount').textContent = profiles.length;
    $('#heroPeopleCount').textContent = `${profiles.length} thành viên`;
    $('#heroAvatarStack').innerHTML = profiles.slice(0, 3).map((profile, index) => profile.avatar_url
      ? `<span style="padding:0;overflow:hidden;background:${tint[index % tint.length]}"><img src="${escapeAttr(profile.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></span>`
      : `<span style="background:${tint[index % tint.length]}">${shortInitial(displayName(profile))}</span>`).join('') || '<span>✿</span><span>♡</span><span>☼</span>';
    $('#peopleGrid').innerHTML = people.map((profile, index) => {
      const ownMedia = mediaItems.filter(item => item.user_id === profile.id);
      const bio = profile.bio || 'đang viết tiếp câu chuyện thanh xuân...';
      return `<article class="person-card" data-action="view-profile" data-user-id="${escapeAttr(profile.id)}" tabindex="0" role="button" style="--person-tint:${tint[index % tint.length]};animation-delay:${Math.min(index * 30, 240)}ms"><div class="person-avatar">${profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện ${escapeAttr(displayName(profile))}" loading="lazy"/>` : shortInitial(displayName(profile))}</div><h3>${escapeHTML(displayName(profile))}</h3><p class="person-nickname">${escapeHTML(profile.nickname ? `“${profile.nickname}”` : 'một mảnh ghép của A5')}</p><p class="person-bio">${escapeHTML(bio)}</p><div class="person-statline"><span>▧ <b>${ownMedia.filter(item => item.media_type === 'photo').length}</b> ảnh</span><span>▷ <b>${ownMedia.filter(item => item.media_type === 'video').length}</b> video</span></div><span class="person-view-button">Ghé thăm góc nhỏ ↗</span></article>`;
    }).join('');
    $('#peopleEmpty').classList.toggle('hidden', people.length !== 0);
    $('#peopleGrid').classList.toggle('hidden', people.length === 0);
  }
  function renderProfile() {
    if (!currentProfile || !currentUser) return;
    const profile = currentProfile;
    const name = displayName(profile);
    $('#sidebarUser').innerHTML = `${avatarHTML(profile)}<div class="sidebar-user-info"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(profile.nickname || 'Thành viên A5')}</small></div>`;
    $('#topAvatarButton').innerHTML = profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện"/>` : shortInitial(name);
    $('#helloName').textContent = profile.nickname || name.split(/\s+/)[0] || 'người bạn A5';
    $('#profileLargeAvatar').innerHTML = profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện"/>` : shortInitial(name);
    $('#profileDisplayName').textContent = name;
    $('#profileNickname').textContent = profile.nickname ? `“${profile.nickname}”` : 'chưa có biệt danh';
    $('#profileBio').textContent = profile.bio || 'Mỗi ngày đi học là một trang trong cuốn lưu bút.';
    $('#profileBanner').style.background = `linear-gradient(112deg, ${safeColor(profile.profile_color || '#f6dce5')}, #fff0e3 68%, #f0e9ff)`;
    $('#myEmail').textContent = currentUser.email || 'Email không được cung cấp';
    const providers = new Set(profile.linked_providers || linkedProviders(currentUser));
    setProviderStatus('google', providers.has('google'));
    setProviderStatus('facebook', providers.has('facebook'));
    $('#memberSince').textContent = formatDate(profile.created_at, false);
    const mine = mediaItems.filter(item => item.user_id === currentUser.id);
    $('#myPhotoCount').textContent = mine.filter(item => item.media_type === 'photo').length;
    $('#myVideoCount').textContent = mine.filter(item => item.media_type === 'video').length;
    const myIds = new Set(mine.map(item => item.id));
    $('#myReactionCount').textContent = reactionItems.filter(reaction => myIds.has(reaction.media_id) && reaction.user_id !== currentUser.id).length;
    $('#profileMediaGrid').innerHTML = mine.slice(0, 6).map(renderMediaCard).join('');
    $('#profileMediaEmpty').classList.toggle('hidden', mine.length !== 0);
    $('#profileMediaGrid').classList.toggle('hidden', mine.length === 0);
  }
  function setProviderStatus(provider, connected) {
    const title = provider === 'google' ? 'googleStatus' : 'facebookStatus';
    const button = $(`[data-action="link-${provider}"]`);
    $(`#${title}`).textContent = connected ? 'Đã liên kết với tài khoản này' : 'Chưa liên kết';
    if (button) {
      button.textContent = connected ? 'Đã liên kết ✓' : 'Liên kết ↗';
      button.disabled = connected;
      button.title = connected ? 'Tài khoản đã được liên kết' : `Liên kết ${provider === 'google' ? 'Google' : 'Facebook'}`;
    }
  }
  function renderAll() {
    populateMonthFilters();
    renderProfile(); renderHomeMedia(); renderGallery(); renderPeople(); updateActiveTab();
  }
  function switchTab(tab) {
    if (!['home', 'gallery', 'people', 'profile'].includes(tab)) return;
    activeTab = tab;
    updateActiveTab();
    if (tab === 'gallery') renderGallery();
    if (tab === 'people') renderPeople();
    if (tab === 'profile') renderProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updateActiveTab() {
    const names = { home: 'Trang chủ', gallery: 'Album kỷ niệm', people: 'Thành viên A5', profile: 'Góc của tớ' };
    $$('.page-view').forEach(page => page.classList.toggle('active', page.id === `page-${activeTab}`));
    $$('[data-tab]').forEach(item => item.classList.toggle('active', item.dataset.tab === activeTab));
    $('#breadcrumbCurrent').textContent = names[activeTab] || names.home;
  }

  function openModal(id) {
    const modal = $(`#${id}`);
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input:not([type=hidden]):not([type=file]),textarea,button:not(.modal-close)');
    if (firstInput) window.setTimeout(() => firstInput.focus({ preventScroll: true }), 80);
  }
  function closeModals(force = false) {
    if (isTrimming && !force) { toast('Đang cắt video, đừng đóng trang cho tới khi hoàn tất nhé.', 'info', 3000); return; }
    $$('.modal-backdrop,.confirm-backdrop').forEach(modal => modal.classList.add('hidden'));
    document.body.style.overflow = '';
    pendingDeleteMediaId = null;
    if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); cropObjectUrl = null; }
    cropImage = null;
    const trimVideo = $('#trimPreviewVideo');
    if (trimVideo) { trimVideo.pause(); trimVideo.removeAttribute('src'); trimVideo.load(); }
    if (trimObjectUrl) { URL.revokeObjectURL(trimObjectUrl); trimObjectUrl = null; }
  }
  function openUpload(type = 'photo') {
    if (!currentUser) return toast('Đăng nhập để lưu kỷ niệm cùng A5 nhé.', 'info');
    setUploadType(type);
    selectedUploadFiles = []; activeCropIndex = 0; activeTrimIndex = 0;
    $('#mediaFiles').value = '';
    $('#selectedFiles').textContent = 'Chưa chọn tệp nào';
    if ($('#cropStatus')) { $('#cropStatus').dataset.custom = ''; $('#cropStatus').textContent = 'Ảnh gốc được giữ nguyên cho tới khi cậu áp dụng phần cắt.'; }
    updateMediaTools();
    $('#uploadCaption').value = '';
    $('#uploadNoteColor').value = '#b64f73';
    $('#uploadNoteFont').value = 'Nunito';
    $('#uploadProgress').classList.add('hidden');
    $('#uploadSubmit').disabled = false;
    $('#uploadSubmit').innerHTML = 'Lưu vào album A5 <span>♡</span>';
    openModal('uploadModal');
  }
  function setUploadType(type) {
    currentUploadType = type === 'video' ? 'video' : 'photo';
    const isVideo = currentUploadType === 'video';
    $('#mediaFiles').accept = isVideo ? VIDEO_TYPES.join(',') : PHOTO_TYPES.join(',');
    $('#mediaFiles').multiple = true;
    $('#fileLimits').textContent = isVideo ? 'Tối đa 50 MB mỗi video · MP4, MOV, WEBM' : 'Tối đa 15 MB mỗi ảnh · có thể chọn nhiều ảnh';
    $('#uploadModalTitle').textContent = isVideo ? 'Gửi một thước phim nhé!' : 'Cất một khoảnh khắc nhé!';
    $('#uploadModalSubtitle').textContent = isVideo ? 'Một đoạn video nhỏ cũng đủ làm cả lớp nhớ mãi.' : 'Mỗi kỷ niệm là một mảnh ghép của A5.';
    $$('.upload-type').forEach(button => button.classList.toggle('active', button.dataset.uploadType === currentUploadType));
    updateSelectedFileLabel();
    updateMediaTools();
  }
  function validateSelectedFiles(files, type) {
    const allowed = type === 'video' ? VIDEO_TYPES : PHOTO_TYPES;
    const maxSize = type === 'video' ? VIDEO_MAX : PHOTO_MAX;
    for (const file of files) {
      if (!allowed.includes(file.type)) return `Tệp “${file.name}” không phải ${type === 'video' ? 'video được hỗ trợ' : 'ảnh được hỗ trợ'}.`;
      if (file.size > maxSize) return `Tệp “${file.name}” lớn hơn giới hạn ${type === 'video' ? '50 MB' : '15 MB'}.`;
      if (file.size === 0) return `Tệp “${file.name}” đang trống.`;
    }
    return '';
  }
  function updateSelectedFileLabel() {
    const element = $('#selectedFiles');
    if (!selectedUploadFiles.length) { element.textContent = 'Chưa chọn tệp nào'; updateMediaTools(); return; }
    if (selectedUploadFiles.length === 1) element.textContent = `${selectedUploadFiles[0].name} · ${humanBytes(selectedUploadFiles[0].size)}`;
    else element.textContent = `Đã chọn ${selectedUploadFiles.length} tệp · ${humanBytes(selectedUploadFiles.reduce((sum, file) => sum + file.size, 0))}`;
    updateMediaTools();
  }

  function fileSelectOptions(type, selectedIndex = 0) {
    const files = selectedUploadFiles;
    return files.map((file, index) => `<option value="${index}" ${index === selectedIndex ? 'selected' : ''}>${escapeHTML(file.name)} · ${humanBytes(file.size)}</option>`).join('');
  }
  function updateMediaTools() {
    const photos = currentUploadType === 'photo' ? selectedUploadFiles : [];
    const videos = currentUploadType === 'video' ? selectedUploadFiles : [];
    $('#photoTools')?.classList.toggle('hidden', !photos.length);
    $('#videoTools')?.classList.toggle('hidden', !videos.length);
    if (photos.length) {
      const select = $('#cropTargetSelect');
      const keep = Math.min(Number(select?.value || activeCropIndex), photos.length - 1);
      activeCropIndex = Math.max(0, keep);
      select.innerHTML = fileSelectOptions('photo', activeCropIndex);
      const cropStatus = $('#cropStatus');
      if (cropStatus && !cropStatus.dataset.custom) cropStatus.textContent = 'Ảnh gốc được giữ nguyên cho tới khi cậu áp dụng phần cắt.';
    }
    if (videos.length) {
      const select = $('#trimTargetSelect');
      const keep = Math.min(Number(select?.value || activeTrimIndex), videos.length - 1);
      activeTrimIndex = Math.max(0, keep);
      select.innerHTML = fileSelectOptions('video', activeTrimIndex);
    }
  }

  function aspectRatioForCrop() {
    const choice = $('#cropAspectSelect')?.value || '1';
    if (choice === 'original' && cropImage) return cropImage.naturalWidth / cropImage.naturalHeight;
    return Number(choice) || 1;
  }
  function resetCropOffsets() {
    if (!cropImage) return;
    const base = Math.max(cropView.width / cropImage.naturalWidth, cropView.height / cropImage.naturalHeight);
    cropView.scale = base * cropView.zoom;
    cropView.displayWidth = cropImage.naturalWidth * cropView.scale;
    cropView.displayHeight = cropImage.naturalHeight * cropView.scale;
    cropView.x = (cropView.width - cropView.displayWidth) / 2;
    cropView.y = (cropView.height - cropView.displayHeight) / 2;
    cropView.x = Math.min(0, Math.max(cropView.width - cropView.displayWidth, cropView.x));
    cropView.y = Math.min(0, Math.max(cropView.height - cropView.displayHeight, cropView.y));
  }
  function resetCropViewport() {
    if (!cropImage) return;
    const canvas = $('#imageCropCanvas');
    cropView.width = 800;
    cropView.height = Math.max(240, Math.round(800 / aspectRatioForCrop()));
    canvas.width = cropView.width; canvas.height = cropView.height;
    cropView.zoom = Number($('#cropZoom').value) || 1;
    $('#cropZoomValue').textContent = `${Math.round(cropView.zoom * 100)}%`;
    resetCropOffsets(); drawCropPreview();
  }
  function drawCropPreview() {
    if (!cropImage) return;
    const canvas = $('#imageCropCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8e7ed'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cropImage, cropView.x, cropView.y, cropView.displayWidth, cropView.displayHeight);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.96)'; ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.strokeStyle = 'rgba(120,70,94,.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 3; i++) { const x = canvas.width * i / 3; const y = canvas.height * i / 3; ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke(); ctx.restore();
  }
  function openImageCropper() {
    if (currentUploadType !== 'photo' || !selectedUploadFiles.length) return toast('Cậu chọn ảnh trước nhé.', 'info');
    activeCropIndex = Math.max(0, Math.min(Number($('#cropTargetSelect').value) || 0, selectedUploadFiles.length - 1));
    const file = selectedUploadFiles[activeCropIndex];
    if (!file || !file.type.startsWith('image/')) return toast('Tệp đã chọn không phải ảnh.', 'error');
    if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
    cropObjectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      cropImage = image;
      $('#cropFilename').textContent = `${file.name} · kéo ảnh để căn khung`;
      $('#cropAspectSelect').value = '1'; $('#cropZoom').value = '1';
      cropView.zoom = 1; resetCropViewport(); openModal('imageCropModal');
    };
    image.onerror = () => { if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl); cropObjectUrl = null; toast('Không mở được ảnh này để cắt.', 'error'); };
    image.src = cropObjectUrl;
  }
  function startCropDrag(event) {
    if (!cropImage) return;
    cropView.dragging = true; cropView.pointerX = event.clientX; cropView.pointerY = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function moveCropDrag(event) {
    if (!cropView.dragging || !cropImage) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const factorX = cropView.width / Math.max(1, rect.width);
    const factorY = cropView.height / Math.max(1, rect.height);
    cropView.x += (event.clientX - cropView.pointerX) * factorX;
    cropView.y += (event.clientY - cropView.pointerY) * factorY;
    cropView.pointerX = event.clientX; cropView.pointerY = event.clientY;
    cropView.x = Math.min(0, Math.max(cropView.width - cropView.displayWidth, cropView.x));
    cropView.y = Math.min(0, Math.max(cropView.height - cropView.displayHeight, cropView.y));
    drawCropPreview();
  }
  function endCropDrag() { cropView.dragging = false; }
  async function applyImageCrop() {
    if (!cropImage || !selectedUploadFiles[activeCropIndex]) return;
    const button = $('#applyCropButton');
    button.disabled = true;
    try {
      const scale = cropView.scale;
      const sx = Math.max(0, -cropView.x / scale);
      const sy = Math.max(0, -cropView.y / scale);
      const sw = Math.min(cropImage.naturalWidth - sx, cropView.width / scale);
      const sh = Math.min(cropImage.naturalHeight - sy, cropView.height / scale);
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(sw)); out.height = Math.max(1, Math.round(sh));
      const ctx = out.getContext('2d', { alpha: false });
      ctx.drawImage(cropImage, sx, sy, sw, sh, 0, 0, out.width, out.height);
      const original = selectedUploadFiles[activeCropIndex];
      const mime = original.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const downscale = Math.min(1, 4096 / Math.max(sw, sh));
      if (downscale < 1) { out.width = Math.max(1, Math.round(sw * downscale)); out.height = Math.max(1, Math.round(sh * downscale)); ctx.drawImage(cropImage, sx, sy, sw, sh, 0, 0, out.width, out.height); }
      const blob = await new Promise((resolve, reject) => out.toBlob(result => result ? resolve(result) : reject(new Error('Trình duyệt chưa xuất được ảnh đã cắt.')), mime, 0.93));
      const stem = original.name.replace(/\.[^.]+$/, '') || 'a5-memory';
      selectedUploadFiles[activeCropIndex] = new File([blob], `${stem}-cropped.${mime === 'image/png' ? 'png' : 'jpg'}`, { type: mime, lastModified: Date.now() });
      $('#cropStatus').dataset.custom = '1';
      $('#cropStatus').textContent = `Đã cắt: ${selectedUploadFiles[activeCropIndex].name}`;
      $('#mediaFiles').value = '';
      updateSelectedFileLabel();
      closeModals();
      toast('Đã áp dụng khung cắt cho ảnh ♡', 'success');
    } catch (error) {
      console.error('Image crop failed:', error); toast(error.message || 'Chưa cắt được ảnh này.', 'error', 5000);
    } finally { button.disabled = false; }
  }

  function fmtTrimTime(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    const min = Math.floor(value / 60);
    const sec = value - min * 60;
    return `${String(min).padStart(2, '0')}:${sec.toFixed(1).padStart(4, '0')}`;
  }
  function updateTrimLabels() {
    const start = Number($('#trimStartRange').value) || 0;
    const end = Number($('#trimEndRange').value) || 0;
    $('#trimStartLabel').textContent = fmtTrimTime(start);
    $('#trimEndLabel').textContent = fmtTrimTime(end);
    $('#trimLengthLabel').textContent = fmtTrimTime(Math.max(0, end - start));
    $('#applyTrimButton').disabled = isTrimming || !trimDuration || end - start < 0.2;
  }
  function updateTrimRange(which, value) {
    const start = $('#trimStartRange'), end = $('#trimEndRange');
    const minimumGap = 0.2;
    if (which === 'start') {
      const v = Math.max(0, Math.min(value, Number(end.value) - minimumGap)); start.value = String(v);
    } else {
      const v = Math.min(trimDuration, Math.max(value, Number(start.value) + minimumGap)); end.value = String(v);
    }
    const video = $('#trimPreviewVideo');
    if (video && !video.paused) video.pause();
    updateTrimLabels();
  }
  function openVideoTrimmer() {
    if (currentUploadType !== 'video' || !selectedUploadFiles.length) return toast('Cậu chọn video trước nhé.', 'info');
    activeTrimIndex = Math.max(0, Math.min(Number($('#trimTargetSelect').value) || 0, selectedUploadFiles.length - 1));
    const file = selectedUploadFiles[activeTrimIndex];
    if (trimObjectUrl) URL.revokeObjectURL(trimObjectUrl);
    trimObjectUrl = URL.createObjectURL(file);
    const video = $('#trimPreviewVideo');
    video.src = trimObjectUrl; video.load();
    $('#trimFilename').textContent = `${file.name} · chọn điểm bắt đầu và kết thúc`;
    $('#trimStatus').textContent = 'Đoạn cắt sẽ được xuất thành video mới; tệp gốc vẫn được giữ nếu cậu hủy.';
    $('#applyTrimButton').disabled = true;
    video.onloadedmetadata = () => {
      trimDuration = Number.isFinite(video.duration) ? video.duration : 0;
      $('#trimStartRange').min = '0'; $('#trimStartRange').max = String(trimDuration);
      $('#trimStartRange').step = '0.1'; $('#trimStartRange').value = '0';
      $('#trimEndRange').min = '0.2'; $('#trimEndRange').max = String(trimDuration);
      $('#trimEndRange').step = '0.1'; $('#trimEndRange').value = String(trimDuration);
      updateTrimLabels();
    };
    video.onerror = () => { $('#trimStatus').textContent = 'Không xem trước được video này trong trình duyệt. Thử đổi sang MP4 hoặc WebM.'; };
    openModal('videoTrimModal');
  }
  async function applyVideoTrim() {
    if (isTrimming || !selectedUploadFiles[activeTrimIndex]) return;
    const video = $('#trimPreviewVideo');
    const start = Number($('#trimStartRange').value) || 0;
    const end = Number($('#trimEndRange').value) || 0;
    if (end - start < 0.2) return toast('Đoạn video cần dài ít nhất 0,2 giây.', 'error');
    const capture = video.captureStream || video.mozCaptureStream;
    if (!capture || !window.MediaRecorder) {
      $('#trimStatus').textContent = 'Trình duyệt này không hỗ trợ cắt video trực tiếp. Hãy thử Chrome hoặc Edge mới nhất.';
      return toast('Trình duyệt chưa hỗ trợ cắt video trực tiếp. Hãy dùng Chrome hoặc Edge nhé.', 'error', 6000);
    }
    const mimeCandidates = ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mimeType = typeof MediaRecorder.isTypeSupported === 'function' ? (mimeCandidates.find(type => MediaRecorder.isTypeSupported(type)) || '') : '';
    if (!mimeType && typeof MediaRecorder.isTypeSupported === 'function') return toast('Trình duyệt không có định dạng ghi video phù hợp.', 'error');
    isTrimming = true;
    const applyButton = $('#applyTrimButton');
    const closeButton = $('#videoTrimModal [data-action="close-modal"]');
    applyButton.disabled = true; closeButton.disabled = true;
    $('#trimStatus').textContent = `Đang xử lý đoạn ${fmtTrimTime(start)} – ${fmtTrimTime(end)} theo thời gian thực. Đừng đóng hoặc chuyển tab...`;
    video.controls = false;
    let stream = null;
    try {
      stream = capture.call(video);
      const options = { videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 };
      if (mimeType) options.mimeType = mimeType;
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      const result = new Promise((resolve, reject) => {
        let finished = false;
        const finish = error => {
          if (finished) return; finished = true;
          clearTimeout(watchdog); video.removeEventListener('timeupdate', onTimeUpdate);
          try { video.pause(); } catch (_) {}
          if (stream) stream.getTracks().forEach(track => track.stop());
          if (error) reject(error);
          else {
            const type = recorder.mimeType || mimeType || 'video/webm';
            resolve(new Blob(chunks, { type: type.split(';')[0] }));
          }
        };
        const onTimeUpdate = () => { if (video.currentTime >= end || video.ended) { if (recorder.state !== 'inactive') recorder.stop(); } };
        const watchdog = setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); finish(new Error('Đã hết thời gian xử lý. Hãy thử một đoạn ngắn hơn.')); }, Math.max(15000, (end - start + 12) * 1000));
        recorder.addEventListener('dataavailable', event => { if (event.data?.size) chunks.push(event.data); });
        recorder.addEventListener('error', () => finish(new Error('Trình duyệt gặp lỗi khi ghi lại đoạn video.')));
        recorder.addEventListener('stop', () => finish());
        video.addEventListener('timeupdate', onTimeUpdate);
        video.currentTime = start;
        recorder.start(250);
        const playPromise = video.play();
        if (playPromise?.catch) playPromise.catch(() => { if (recorder.state !== 'inactive') recorder.stop(); finish(new Error('Không thể phát video để cắt. Hãy bấm phát thử video trước rồi thử lại.')); });
      });
      const blob = await result;
      if (!blob.size) throw new Error('Đoạn video xuất ra đang trống. Hãy thử chọn đoạn khác.');
      const original = selectedUploadFiles[activeTrimIndex];
      const mime = blob.type.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
      const extension = mime === 'video/mp4' ? 'mp4' : 'webm';
      const stem = original.name.replace(/\.[^.]+$/, '') || 'a5-memory';
      const trimmedFile = new File([blob], `${stem}-cut.${extension}`, { type: mime, lastModified: Date.now() });
      if (trimmedFile.size > VIDEO_MAX) throw new Error(`Đoạn cắt mới nặng ${humanBytes(trimmedFile.size)}, vượt giới hạn ${humanBytes(VIDEO_MAX)}. Hãy chọn đoạn ngắn hơn.`);
      selectedUploadFiles[activeTrimIndex] = trimmedFile;
      $('#mediaFiles').value = '';
      updateSelectedFileLabel();
      closeModals(true);
      toast(`Đã cắt xong video (${humanBytes(trimmedFile.size)}) ♡`, 'success', 4500);
    } catch (error) {
      console.error('Video trim failed:', error);
      $('#trimStatus').textContent = error.message || 'Chưa cắt được video này.';
      toast(error.message || 'Chưa cắt được video này.', 'error', 6500);
    } finally {
      if (stream) stream.getTracks().forEach(track => track.stop());
      isTrimming = false; video.controls = true; applyButton.disabled = false; closeButton.disabled = false; updateTrimLabels();
    }
  }

  async function downloadMedia(mediaId, button) {
    const item = mediaItems.find(entry => entry.id === mediaId);
    if (!item?.storage_path || !supabase) return toast('Chưa có đường dẫn tải tệp. Hãy tải lại album.', 'error');
    const originalHtml = button.innerHTML;
    button.disabled = true; button.innerHTML = '<span aria-hidden="true">…</span> Đang chuẩn bị';
    const when = new Date(item.created_at);
    const dateStamp = Number.isNaN(when.getTime()) ? 'ky-niem' : `${when.getFullYear()}-${String(when.getMonth()+1).padStart(2,'0')}-${String(when.getDate()).padStart(2,'0')}`;
    const rawExtension = (item.storage_path || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
    const validExtensions = item.media_type === 'video' ? ['mp4', 'webm', 'mov', 'm4v'] : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
    const extension = validExtensions.includes(rawExtension) ? rawExtension : (item.media_type === 'video' ? 'mp4' : 'jpg');
    const filename = `A5-ky-niem-${dateStamp}.${extension}`;
    try {
      const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(item.storage_path, 60, { download: filename });
      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Không tạo được liên kết tải tạm thời.');
      const anchor = document.createElement('a');
      anchor.href = data.signedUrl; anchor.download = filename; anchor.rel = 'noopener';
      anchor.style.display = 'none'; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      toast(`Đã bắt đầu tải ${item.media_type === 'video' ? 'video' : 'ảnh'} về máy ♡`, 'success');
    } catch (error) {
      console.error('Media download failed:', error);
      if (item.url) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
        toast('Đã mở tệp trong tab mới. Nếu trình duyệt không tự tải, dùng menu lưu tệp của trình duyệt nhé.', 'info', 6000);
      } else toast('Chưa tải được tệp. Hãy thử tải lại album rồi bấm lại nhé.', 'error', 5500);
    } finally { button.disabled = false; button.innerHTML = originalHtml; }
  }

  async function uploadSelectedFiles(event) {
    event.preventDefault();
    if (isUploading) return;
    if (!selectedUploadFiles.length) return toast('Cậu chọn tệp trước khi lưu nhé.', 'error');
    const validation = validateSelectedFiles(selectedUploadFiles, currentUploadType);
    if (validation) return toast(validation, 'error', 5000);
    if (!currentUser || !supabase) return toast('Phiên đăng nhập đã hết. Hãy đăng nhập lại nhé.', 'error');
    isUploading = true;
    const files = [...selectedUploadFiles];
    const caption = $('#uploadCaption').value.trim();
    const noteColor = safeColor($('#uploadNoteColor').value);
    const noteFont = safeFont($('#uploadNoteFont').value);
    const submit = $('#uploadSubmit');
    const progress = $('#uploadProgress');
    const bar = $('#uploadProgressBar');
    const progressText = $('#uploadProgressText');
    submit.disabled = true; progress.classList.remove('hidden');
    const savedPaths = [];
    let complete = 0;
    try {
      for (const file of files) {
        progressText.textContent = `Đang tải ${file.name}... (${complete + 1}/${files.length})`;
        bar.style.width = `${Math.max(8, Math.round((complete / files.length) * 100))}%`;
        const path = `${currentUser.id}/${Date.now()}-${uniqueId()}-${safeFileName(file.name)}`;
        const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
          cacheControl: '3600', upsert: false, contentType: file.type
        });
        if (storageError) throw storageError;
        savedPaths.push(path);
        const { error: insertError } = await supabase.from('media_items').insert({
          user_id: currentUser.id, media_type: currentUploadType, storage_path: path,
          caption, note_color: noteColor, note_font: noteFont
        });
        if (insertError) {
          await supabase.storage.from(MEDIA_BUCKET).remove([path]);
          savedPaths.pop();
          throw insertError;
        }
        complete++;
      }
      bar.style.width = '100%'; progressText.textContent = 'Đã cất vào cuốn lưu bút ♡';
      closeModals();
      toast(files.length === 1 ? 'Kỷ niệm đã được cất vào album A5! ♡' : `Đã lưu ${files.length} kỷ niệm vào album A5! ♡`, 'success');
      signedUrlCache.clear(); await loadData(false);
      switchTab('gallery');
    } catch (error) {
      console.error('Upload failed:', error);
      if (savedPaths.length) {
        console.warn('Some files were stored before the upload failed:', savedPaths);
        await loadData(false);
      }
      progressText.textContent = 'Chưa tải lên được. Cậu thử lại nhé.';
      toast(`Tải tệp thất bại: ${(error?.message || 'Hãy kiểm tra giới hạn storage và quyền truy cập.').slice(0, 130)}`, 'error', 6500);
    } finally {
      isUploading = false; submit.disabled = false;
      submit.innerHTML = 'Lưu vào album A5 <span>♡</span>';
      bar.style.width = '0%';
    }
  }

  function openProfileEditor() {
    if (!currentProfile) return;
    selectedAvatarFile = null;
    $('#displayNameInput').value = currentProfile.display_name || '';
    $('#nicknameInput').value = currentProfile.nickname || '';
    $('#bioInput').value = currentProfile.bio || '';
    $('#profileColorInput').value = safeColor(currentProfile.profile_color || '#f6dce5');
    $('#avatarFile').value = '';
    $('#editAvatarPreview').innerHTML = currentProfile.avatar_url ? `<img src="${escapeAttr(currentProfile.avatar_url)}" alt="Ảnh đại diện hiện tại"/>` : shortInitial(displayName(currentProfile));
    openModal('editProfileModal');
  }
  async function saveProfile(event) {
    event.preventDefault();
    if (!supabase || !currentUser || !currentProfile) return;
    const display_name = $('#displayNameInput').value.trim();
    const nickname = $('#nicknameInput').value.trim();
    const bio = $('#bioInput').value.trim();
    const profile_color = safeColor($('#profileColorInput').value);
    if (display_name.length < 1) return toast('Tên hiển thị không được để trống.', 'error');
    if (display_name.length > 40 || nickname.length > 32 || bio.length > 180) return toast('Một trong các mục đã vượt quá số ký tự cho phép.', 'error');
    const button = $('#saveProfileButton'); button.disabled = true; button.textContent = 'Đang lưu...';
    const previousAvatarPath = currentProfile.avatar_path || null;
    let avatarPath = previousAvatarPath;
    let uploadedNewAvatar = null;
    try {
      if (selectedAvatarFile) {
        if (!PHOTO_TYPES.includes(selectedAvatarFile.type)) throw new Error('Ảnh đại diện cần là JPG, PNG, WEBP, GIF hoặc AVIF.');
        if (selectedAvatarFile.size > AVATAR_MAX) throw new Error('Ảnh đại diện tối đa 5 MB.');
        const path = `${currentUser.id}/${Date.now()}-${uniqueId()}-${safeFileName(selectedAvatarFile.name)}`;
        const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, selectedAvatarFile, { upsert: false, contentType: selectedAvatarFile.type, cacheControl: '3600' });
        if (uploadError) throw uploadError;
        avatarPath = path; uploadedNewAvatar = path;
      }
      const { data, error } = await supabase.from('profiles').update({ display_name, nickname, bio, profile_color, avatar_path: avatarPath }).eq('id', currentUser.id).select('id,display_name,nickname,bio,avatar_path,profile_color,linked_providers,created_at,updated_at').single();
      if (error) throw error;
      const resolved = { ...data, avatar_url: await resolveSignedUrl(AVATAR_BUCKET, data.avatar_path) };
      currentProfile = resolved; profiles = profiles.map(profile => profile.id === resolved.id ? resolved : profile);
      if (uploadedNewAvatar && previousAvatarPath && previousAvatarPath !== uploadedNewAvatar) {
        const { error: oldAvatarError } = await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
        if (oldAvatarError) console.warn('Avatar was updated but the previous file could not be removed:', oldAvatarError.message);
      }
      closeModals(); renderAll(); toast('Góc nhỏ của cậu đã được cập nhật! ♡', 'success');
    } catch (error) {
      console.error('Profile update failed:', error);
      if (uploadedNewAvatar) await supabase.storage.from(AVATAR_BUCKET).remove([uploadedNewAvatar]);
      toast(`Chưa lưu được hồ sơ: ${(error?.message || 'Lỗi không xác định').slice(0, 130)}`, 'error', 6000);
    } finally { button.disabled = false; button.innerHTML = 'Lưu thay đổi <span>♡</span>'; }
  }

  function openEditMedia(id) {
    const item = mediaItems.find(media => media.id === id);
    if (!item || item.user_id !== currentUser?.id) return toast('Chỉ chủ bài đăng mới có thể chỉnh sửa.', 'error');
    $('#editMediaId').value = item.id;
    $('#editMediaCaption').value = item.caption || '';
    $('#editMediaColor').value = safeColor(item.note_color);
    $('#editMediaFont').value = safeFont(item.note_font);
    openModal('editMediaModal');
  }
  async function saveMediaEdit(event) {
    event.preventDefault();
    const id = $('#editMediaId').value;
    const item = mediaItems.find(media => media.id === id);
    if (!item || item.user_id !== currentUser?.id) return toast('Cậu không có quyền chỉnh sửa kỷ niệm này.', 'error');
    const { error } = await supabase.from('media_items').update({
      caption: $('#editMediaCaption').value.trim(), note_color: safeColor($('#editMediaColor').value), note_font: safeFont($('#editMediaFont').value)
    }).eq('id', id).eq('user_id', currentUser.id);
    if (error) { console.error(error); return toast('Chỉnh sửa chưa được lưu. Cậu thử lại nhé.', 'error'); }
    closeModals(); toast('Đã làm mới lời nhắn cho kỷ niệm ♡', 'success'); await loadData(false);
  }

  function askDeleteMedia(id) {
    const item = mediaItems.find(media => media.id === id);
    if (!item || item.user_id !== currentUser?.id) return toast('Chỉ chủ bài đăng mới có thể xóa.', 'error');
    pendingDeleteMediaId = id;
    $('#confirmTitle').textContent = 'Xóa kỷ niệm này?';
    $('#confirmMessage').textContent = 'Ảnh/video và các cảm xúc gắn với bài đăng sẽ bị xóa. Việc này không thể hoàn tác.';
    $('#confirmDeleteButton').textContent = 'Xóa kỷ niệm';
    $('#confirmDeleteButton').disabled = false;
    openModal('confirmModal');
  }
  async function confirmDeleteMedia() {
    const id = pendingDeleteMediaId;
    const item = mediaItems.find(media => media.id === id);
    if (!id || !item || item.user_id !== currentUser?.id) { closeModals(); return; }
    const button = $('#confirmDeleteButton'); button.disabled = true; button.textContent = 'Đang xóa...';
    try {
      const { error } = await supabase.from('media_items').delete().eq('id', id).eq('user_id', currentUser.id);
      if (error) throw error;
      const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
      if (storageError) console.warn('Media record deleted but storage cleanup failed:', storageError.message);
      reactionItems = reactionItems.filter(reaction => reaction.media_id !== id);
      mediaItems = mediaItems.filter(media => media.id !== id);
      signedUrlCache.delete(`${MEDIA_BUCKET}:${item.storage_path}`);
      closeModals(); renderAll(); toast('Kỷ niệm đã được xóa khỏi album.', 'success');
    } catch (error) {
      console.error('Delete failed:', error); toast(`Không xóa được kỷ niệm: ${(error?.message || '').slice(0, 100)}`, 'error');
    } finally { button.disabled = false; button.textContent = 'Xóa kỷ niệm'; }
  }

  async function openComments(mediaId) {
    const item = mediaItems.find(media => media.id === mediaId);
    if (!item) return toast('Không tìm thấy kỷ niệm này.', 'error');
    activeCommentsMediaId = mediaId;
    editingCommentId = null;
    $('#commentMediaId').value = mediaId;
    $('#editingCommentId').value = '';
    $('#commentInput').value = '';
    $('#commentSubmitButton').textContent = 'Gửi bình luận ♡';
    $('#cancelCommentEdit').classList.add('hidden');
    const owner = profiles.find(profile => profile.id === item.user_id) || {};
    $('#commentsContextLine').textContent = `Một lời nhắn cho kỷ niệm của ${displayName(owner)} · ${formatDate(item.created_at, false)}`;
    if (!commentsEnabled) {
      $('#commentsList').innerHTML = '<div class="comments-migration-note"><strong>💬 Bình luận sắp được mở!</strong><p>Cơ sở dữ liệu cần chạy file <code>supabase/upgrade-v2.sql</code> một lần. Sau khi quản trị viên chạy migration và tải lại trang, bình luận sẽ hoạt động.</p></div>';
      openModal('commentsModal');
      return;
    }
    $('#commentsList').innerHTML = '<div class="comments-empty">Đang tải những lời nhắn...</div>';
    openModal('commentsModal');
    await refreshComments(mediaId);
  }

  async function refreshComments(mediaId) {
    if (!supabase || !currentUser || !commentsEnabled) return;
    try {
      const { data, error } = await supabase.from('media_comments')
        .select('id,media_id,user_id,body,created_at,updated_at,profiles(id,display_name,nickname,avatar_path)')
        .eq('media_id', mediaId).order('created_at', { ascending: true }).limit(300);
      if (error) throw error;
      const item = mediaItems.find(media => media.id === mediaId);
      const canModerate = item?.user_id === currentUser.id;
      const rows = data || [];
      commentCounts.set(mediaId, rows.length);
      $('#commentsList').innerHTML = rows.length ? rows.map(comment => {
        const profile = profiles.find(person => person.id === comment.user_id) || comment.profiles || {};
        const ownComment = comment.user_id === currentUser.id;
        const canDelete = ownComment || canModerate;
        return `<article class="comment-row" data-comment-row="${escapeAttr(comment.id)}"><div class="comment-avatar">${avatarHTML(profile, 'avatar')}</div><div class="comment-bubble"><div class="comment-topline"><strong>${escapeHTML(displayName(profile))}${ownComment ? ' <span class="comment-me">· cậu</span>' : ''}</strong><time title="${escapeAttr(new Date(comment.created_at).toISOString())}">${escapeHTML(formatDate(comment.created_at, true))}</time></div><p>${escapeHTML(comment.body)}</p>${ownComment || canDelete ? `<div class="comment-actions">${ownComment ? `<button type="button" data-action="edit-comment" data-comment-id="${escapeAttr(comment.id)}">Sửa</button>` : ''}${canDelete ? `<button type="button" data-action="delete-comment" data-comment-id="${escapeAttr(comment.id)}">Xóa</button>` : ''}</div>` : ''}</div></article>`;
      }).join('') : '<div class="comments-empty"><span>💌</span><strong>Chưa có bình luận nào</strong><p>Hãy để lại lời nhắn đầu tiên cho kỷ niệm này nhé.</p></div>';
      renderHomeMedia(); renderGallery(); renderProfile();
    } catch (error) {
      console.error('Load comments failed:', error);
      const msg = String(error?.message || '');
      if (/does not exist|schema cache|relation/i.test(msg)) commentsEnabled = false;
      $('#commentsList').innerHTML = `<div class="comments-empty">${commentsEnabled ? 'Chưa tải được bình luận. Cậu thử tải lại nhé.' : 'Cần chạy file supabase/upgrade-v2.sql trong Supabase SQL Editor trước khi dùng bình luận.'}</div>`;
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!supabase || !currentUser) return toast('Đăng nhập để bình luận cùng A5 nhé.', 'info');
    if (!commentsEnabled) return toast('Quản trị viên cần chạy migration v2 trong Supabase trước.', 'info', 5000);
    const mediaId = $('#commentMediaId').value || activeCommentsMediaId;
    const body = $('#commentInput').value.trim();
    const editingId = $('#editingCommentId').value;
    if (!mediaId) return;
    if (!body) return toast('Bình luận chưa có nội dung.', 'error');
    if (body.length > 800) return toast('Bình luận tối đa 800 ký tự.', 'error');
    const button = $('#commentSubmitButton');
    button.disabled = true;
    try {
      let result;
      if (editingId) {
        result = await supabase.from('media_comments').update({ body }).eq('id', editingId).eq('user_id', currentUser.id);
      } else {
        result = await supabase.from('media_comments').insert({ media_id: mediaId, user_id: currentUser.id, body });
      }
      if (result.error) throw result.error;
      $('#commentInput').value = ''; $('#editingCommentId').value = ''; editingCommentId = null;
      $('#commentSubmitButton').textContent = 'Gửi bình luận ♡'; $('#cancelCommentEdit').classList.add('hidden');
      await refreshComments(mediaId);
      toast(editingId ? 'Đã cập nhật lời nhắn ♡' : 'Đã gửi bình luận ♡', 'success');
    } catch (error) {
      console.error('Save comment failed:', error);
      toast(`Chưa gửi được bình luận: ${(error?.message || 'Hãy kiểm tra migration v2 và quyền truy cập.').slice(0, 120)}`, 'error', 6000);
    } finally { button.disabled = false; }
  }

  function beginEditComment(commentId) {
    const mediaId = $('#commentMediaId').value || activeCommentsMediaId;
    refreshCommentsForEdit(mediaId, commentId).catch(error => {
      console.error(error); toast('Chưa mở được bình luận để sửa.', 'error');
    });
  }
  async function refreshCommentsForEdit(mediaId, commentId) {
    const { data, error } = await supabase.from('media_comments').select('id,user_id,body').eq('id', commentId).maybeSingle();
    if (error) throw error;
    if (!data || data.user_id !== currentUser?.id) return toast('Chỉ người viết mới sửa được bình luận này.', 'error');
    editingCommentId = commentId;
    $('#editingCommentId').value = commentId;
    $('#commentInput').value = data.body;
    $('#commentSubmitButton').textContent = 'Lưu chỉnh sửa ♡';
    $('#cancelCommentEdit').classList.remove('hidden');
    $('#commentInput').focus();
  }
  async function deleteComment(commentId) {
    if (!supabase || !currentUser) return;
    const item = mediaItems.find(media => media.id === activeCommentsMediaId);
    const { data: row, error: readError } = await supabase.from('media_comments').select('id,user_id').eq('id', commentId).maybeSingle();
    if (readError) return toast('Chưa kiểm tra được quyền xóa bình luận.', 'error');
    if (!row || (row.user_id !== currentUser.id && item?.user_id !== currentUser.id)) return toast('Cậu không có quyền xóa bình luận này.', 'error');
    if (!window.confirm('Xóa bình luận này nhé?')) return;
    const { error } = await supabase.from('media_comments').delete().eq('id', commentId);
    if (error) { console.error(error); return toast('Chưa xóa được bình luận.', 'error'); }
    await refreshComments(activeCommentsMediaId);
    toast('Đã xóa bình luận.', 'success');
  }

  function openReactionPicker(mediaId) {
    if (!mediaItems.some(item => item.id === mediaId)) return toast('Không tìm thấy kỷ niệm này.', 'error');
    $('#reactionPickerGrid').innerHTML = REACTIONS.map(emoji => `<button type="button" class="reaction-picker-choice" data-action="pick-reaction" data-media-id="${escapeAttr(mediaId)}" data-emoji="${escapeAttr(emoji)}"><span>${escapeHTML(emoji)}</span><small>${escapeHTML(reactionName(emoji))}</small></button>`).join('');
    openModal('reactionPickerModal');
  }
  function reactionName(emoji) {
    return ({ '🩷':'Thương thương', '❤️':'Yêu thích', '😂':'Cười xỉu', '😭':'Khóc mất thôi', '🥹':'Cảm động', '😍':'Quá xinh', '✨':'Lung linh', '🫶':'Gửi yêu thương', '🔥':'Quá đỉnh', '🤡':'Dìm hàng', '👍':'Tuyệt vời', '💯':'Chuẩn luôn' })[emoji] || 'Cảm xúc';
  }

  async function toggleReaction(mediaId, emoji) {
    if (!currentUser || !supabase) return;
    const found = reactionItems.find(reaction => reaction.media_id === mediaId && reaction.user_id === currentUser.id && reaction.emoji === emoji);
    try {
      if (found) {
        const { error } = await supabase.from('reactions').delete().eq('id', found.id).eq('user_id', currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({ media_id: mediaId, user_id: currentUser.id, emoji });
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      }
      await loadReactions(); renderAll();
    } catch (error) { console.error('Reaction error:', error); toast('Chưa gửi được cảm xúc. Cậu thử lại nhé.', 'error'); }
  }
  function openReactions(mediaId, emojiFilter = '') {
    const item = mediaItems.find(media => media.id === mediaId);
    const all = reactionItems.filter(reaction => reaction.media_id === mediaId && (!emojiFilter || reaction.emoji === emojiFilter)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    $('#reactionModalTitle').textContent = emojiFilter ? `Ai đã thả ${emojiFilter}?` : 'Ai đã gửi cảm xúc? ♡';
    $('#reactionList').innerHTML = all.length ? all.map(reaction => {
      const profile = profiles.find(person => person.id === reaction.user_id) || reaction.profile || {};
      return `<div class="reaction-list-row"><span class="reaction-list-emoji">${escapeHTML(reaction.emoji)}</span><div class="reaction-list-info"><strong>${escapeHTML(displayName(profile))}${reaction.user_id === currentUser?.id ? ' · cậu' : ''}</strong><small>${escapeHTML(profile.nickname ? `“${profile.nickname}”` : 'một mảnh ghép của A5')}</small></div><time class="reaction-list-time" title="${escapeAttr(new Date(reaction.created_at).toISOString())}">${escapeHTML(formatDate(reaction.created_at, true))}</time></div>`;
    }).join('') : `<div class="reaction-empty">${emojiFilter ? `${emojiFilter} chưa được ai thả. Hãy là người đầu tiên nhé!` : 'Chưa có cảm xúc nào. Ai sẽ là người đầu tiên nhỉ? ♡'}</div>`;
    if (!item) toast('Không tìm thấy kỷ niệm này.', 'error');
    openModal('reactionModal');
  }

  function openPublicProfile(id) {
    const profile = profiles.find(person => person.id === id);
    if (!profile) return toast('Chưa tìm được hồ sơ của bạn ấy.', 'error');
    const own = mediaItems.filter(item => item.user_id === id);
    $('#publicProfileAvatar').innerHTML = profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện"/>` : shortInitial(displayName(profile));
    $('#publicProfileCover').style.background = `linear-gradient(115deg, ${safeColor(profile.profile_color || '#f6dce5')}, #fff0de 70%, #ece5ff)`;
    $('#publicProfileName').textContent = displayName(profile);
    $('#publicProfileNickname').textContent = profile.nickname ? `“${profile.nickname}”` : 'một mảnh ghép của A5';
    $('#publicProfileBio').textContent = profile.bio || 'đang viết tiếp câu chuyện thanh xuân...';
    $('#publicPhotoCount').textContent = own.filter(item => item.media_type === 'photo').length;
    $('#publicVideoCount').textContent = own.filter(item => item.media_type === 'video').length;
    $('#publicMemberSince').textContent = formatMonth(profile.created_at);
    const providers = new Set(profile.linked_providers || []);
    $('#publicProviders').innerHTML = `<span class="provider-chip ${providers.has('google') ? 'connected' : ''}">${providers.has('google') ? '✓ ' : ''}Google ${providers.has('google') ? 'đã liên kết' : 'chưa liên kết'}</span><span class="provider-chip ${providers.has('facebook') ? 'connected' : ''}">${providers.has('facebook') ? '✓ ' : ''}Facebook ${providers.has('facebook') ? 'đã liên kết' : 'chưa liên kết'}</span>`;
    const photos = own.slice(0, 8);
    $('#publicProfilePhotos').innerHTML = photos.map(item => item.url ? (item.media_type === 'video' ? `<div class="public-profile-photo video-thumb"><video src="${escapeAttr(item.url)}" muted playsinline preload="metadata"></video><span>▶</span></div>` : `<div class="public-profile-photo"><img src="${escapeAttr(item.url)}" alt="Kỷ niệm" loading="lazy"/></div>`) : '<div class="public-profile-photo">✿</div>').join('');
    $('#publicProfilePhotos').classList.toggle('hidden', photos.length === 0);
    openModal('publicProfileModal');
  }

  async function linkProvider(provider) {
    if (!currentUser || !supabase) return;
    const providers = new Set(currentProfile?.linked_providers || linkedProviders(currentUser));
    if (providers.has(provider)) return toast(`${provider === 'google' ? 'Google' : 'Facebook'} đã liên kết với hồ sơ rồi.`, 'info');
    try {
      const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo: `${window.location.origin}${window.location.pathname}` } });
      if (error) throw error;
      toast(`Đang mở ${provider === 'google' ? 'Google' : 'Facebook'} để xác nhận liên kết...`, 'info', 5000);
    } catch (error) {
      console.error('Link identity error:', error);
      toast('Chưa liên kết được. Hãy bật Identity Linking và cấu hình provider trong Supabase.', 'error', 6000);
    }
  }

  function bindEvents() {
    $('#googleLogin')?.addEventListener('click', () => signIn('google'));
    $('#facebookLogin')?.addEventListener('click', () => signIn('facebook'));
    $('#logoutButton')?.addEventListener('click', signOut);
    $('#topAvatarButton')?.addEventListener('click', () => switchTab('profile'));
    $('#topUploadButton')?.addEventListener('click', () => openUpload('photo'));
    $('#uploadForm')?.addEventListener('submit', uploadSelectedFiles);
    $('#openCropButton')?.addEventListener('click', openImageCropper);
    $('#applyCropButton')?.addEventListener('click', applyImageCrop);
    $('#cropTargetSelect')?.addEventListener('change', event => { activeCropIndex = Number(event.target.value) || 0; });
    $('#cropAspectSelect')?.addEventListener('change', resetCropViewport);
    $('#cropZoom')?.addEventListener('input', event => { cropView.zoom = Number(event.target.value) || 1; $('#cropZoomValue').textContent = `${Math.round(cropView.zoom * 100)}%`; resetCropOffsets(); drawCropPreview(); });
    $('#imageCropCanvas')?.addEventListener('pointerdown', startCropDrag);
    $('#imageCropCanvas')?.addEventListener('pointermove', moveCropDrag);
    $('#imageCropCanvas')?.addEventListener('pointerup', endCropDrag);
    $('#imageCropCanvas')?.addEventListener('pointercancel', endCropDrag);
    $('#imageCropCanvas')?.addEventListener('pointerleave', endCropDrag);
    $('#openTrimButton')?.addEventListener('click', openVideoTrimmer);
    $('#trimTargetSelect')?.addEventListener('change', event => { activeTrimIndex = Number(event.target.value) || 0; });
    $('#trimStartRange')?.addEventListener('input', event => updateTrimRange('start', Number(event.target.value)));
    $('#trimEndRange')?.addEventListener('input', event => updateTrimRange('end', Number(event.target.value)));
    $('#applyTrimButton')?.addEventListener('click', applyVideoTrim);
    $('#profileForm')?.addEventListener('submit', saveProfile);
    $('#commentForm')?.addEventListener('submit', submitComment);
    $('#cancelCommentEdit')?.addEventListener('click', () => { editingCommentId = null; $('#editingCommentId').value = ''; $('#commentInput').value = ''; $('#commentSubmitButton').textContent = 'Gửi bình luận ♡'; $('#cancelCommentEdit').classList.add('hidden'); });
    $('#homeMonthFilter')?.addEventListener('change', event => { homeMonthFilter = event.target.value || 'all'; renderHomeMedia(); });
    $('#galleryMonthFilter')?.addEventListener('change', event => { galleryMonthFilter = event.target.value || 'all'; renderGallery(); });
    $('#editMediaForm')?.addEventListener('submit', saveMediaEdit);
    $('#confirmDeleteButton')?.addEventListener('click', confirmDeleteMedia);
    $('#gallerySort')?.addEventListener('change', renderGallery);
    $('#mediaFiles')?.addEventListener('change', event => {
      selectedUploadFiles = [...(event.target.files || [])];
      const validation = validateSelectedFiles(selectedUploadFiles, currentUploadType);
      if (validation) { toast(validation, 'error', 5000); selectedUploadFiles = []; event.target.value = ''; }
      activeCropIndex = 0; activeTrimIndex = 0;
      if ($('#cropStatus')) { $('#cropStatus').dataset.custom = ''; $('#cropStatus').textContent = 'Ảnh gốc được giữ nguyên cho tới khi cậu áp dụng phần cắt.'; }
      updateSelectedFileLabel();
    });
    $('#avatarFile')?.addEventListener('change', event => {
      const file = event.target.files?.[0] || null;
      if (!file) return;
      if (!PHOTO_TYPES.includes(file.type)) { toast('Tệp này không phải định dạng ảnh được hỗ trợ.', 'error'); event.target.value = ''; return; }
      if (file.size > AVATAR_MAX) { toast('Ảnh đại diện tối đa 5 MB.', 'error'); event.target.value = ''; return; }
      selectedAvatarFile = file;
      const objectUrl = URL.createObjectURL(file);
      $('#editAvatarPreview').innerHTML = `<img src="${escapeAttr(objectUrl)}" alt="Ảnh đại diện mới"/>`;
    });
    $('#globalSearch')?.addEventListener('input', event => {
      searchTerm = event.target.value.trim().toLocaleLowerCase('vi');
      if (activeTab === 'home') renderHomeMedia();
      if (activeTab === 'gallery') renderGallery();
      if (activeTab === 'people') renderPeople();
    });
    $('#dropzone')?.addEventListener('dragover', event => { event.preventDefault(); $('#dropzone').classList.add('dragging'); });
    $('#dropzone')?.addEventListener('dragleave', () => $('#dropzone').classList.remove('dragging'));
    $('#dropzone')?.addEventListener('drop', event => {
      event.preventDefault(); $('#dropzone').classList.remove('dragging');
      const files = [...(event.dataTransfer?.files || [])];
      const validation = validateSelectedFiles(files, currentUploadType);
      if (validation) return toast(validation, 'error', 5000);
      selectedUploadFiles = files; activeCropIndex = 0; activeTrimIndex = 0;
      if ($('#cropStatus')) { $('#cropStatus').dataset.custom = ''; $('#cropStatus').textContent = 'Ảnh gốc được giữ nguyên cho tới khi cậu áp dụng phần cắt.'; }
      updateSelectedFileLabel();
    });
    document.addEventListener('click', async event => {
      const tab = event.target.closest('[data-tab]');
      if (tab) { event.preventDefault(); switchTab(tab.dataset.tab); return; }
      const homeFilterButton = event.target.closest('[data-home-filter]');
      if (homeFilterButton) { homeFilter = homeFilterButton.dataset.homeFilter; renderHomeMedia(); return; }
      const galleryFilterButton = event.target.closest('[data-gallery-filter]');
      if (galleryFilterButton) { galleryFilter = galleryFilterButton.dataset.galleryFilter; renderGallery(); return; }
      const typeButton = event.target.closest('[data-upload-type]');
      if (typeButton) { selectedUploadFiles = []; $('#mediaFiles').value = ''; setUploadType(typeButton.dataset.uploadType); updateSelectedFileLabel(); return; }
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const action = actionButton.dataset.action;
      if (action === 'upload-photo') openUpload('photo');
      else if (action === 'upload-video') openUpload('video');
      else if (action === 'edit-profile') openProfileEditor();
      else if (action === 'close-modal') closeModals();
      else if (action === 'edit-media') openEditMedia(actionButton.dataset.mediaId);
      else if (action === 'delete-media') askDeleteMedia(actionButton.dataset.mediaId);
      else if (action === 'toggle-reaction') await toggleReaction(actionButton.dataset.mediaId, actionButton.dataset.emoji);
      else if (action === 'more-reactions') openReactionPicker(actionButton.dataset.mediaId);
      else if (action === 'pick-reaction') { await toggleReaction(actionButton.dataset.mediaId, actionButton.dataset.emoji); closeModals(); }
      else if (action === 'who-reacted') openReactions(actionButton.dataset.mediaId, actionButton.dataset.emoji || '');
      else if (action === 'download-media') await downloadMedia(actionButton.dataset.mediaId, actionButton);
      else if (action === 'open-comments') await openComments(actionButton.dataset.mediaId);
      else if (action === 'edit-comment') beginEditComment(actionButton.dataset.commentId);
      else if (action === 'delete-comment') await deleteComment(actionButton.dataset.commentId);
      else if (action === 'preview-profile') openPublicProfile(currentUser?.id);
      else if (action === 'view-profile') openPublicProfile(actionButton.dataset.userId);
      else if (action === 'link-google') await linkProvider('google');
      else if (action === 'link-facebook') await linkProvider('facebook');
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModals();
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action="view-profile"][role="button"]')) {
        event.preventDefault(); openPublicProfile(event.target.dataset.userId);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); $('#globalSearch')?.focus();
      }
    });
    $$('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModals(); }));
    $('#confirmModal')?.addEventListener('click', event => { if (event.target.id === 'confirmModal') closeModals(); });
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
