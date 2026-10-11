/* NƠI LƯU GIỮ THANH XUÂN A5 — frontend powered by Supabase */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const REACTIONS = ['🩷', '❤️', '😂', '😭', '🥹', '😍', '✨', '🫶', '🔥', '🤡', '👍', '💯'];
  const A5_MUSIC_TRACKS = [
    { key: 'dong-bang', title: 'Mình cùng nhau đóng băng', artist: 'Thùy Chi · Official M/V', videoId: 'zCpJ9Irw4EQ', source: '1989s Entertainment', url: 'https://www.youtube.com/watch?v=zCpJ9Irw4EQ' },
    { key: 'hen-thanh-xuan', title: 'Có hẹn với thanh xuân', artist: 'MONSTAR · Official MV', videoId: 'vpRi8S6uXAg', source: 'ST.319 Entertainment', url: 'https://www.youtube.com/watch?v=vpRi8S6uXAg' },
    { key: 'nhu-ngay-hom-qua', title: 'Như ngày hôm qua', artist: 'Sơn Tùng M-TP · YouTube Music', videoId: 'YtkgtlfKaxM', source: 'Sơn Tùng M-TP', url: 'https://www.youtube.com/watch?v=YtkgtlfKaxM' },
    { key: 'thanh-xuan', title: 'Thanh Xuân', artist: 'Da LAB · Official MV', videoId: 'GgQFO8dL5XQ', source: 'Da LAB Official', url: 'https://www.youtube.com/watch?v=GgQFO8dL5XQ' },
    { key: 'link-ban-gui', title: 'Video trong đường link cậu gửi', artist: 'YouTube · bắt đầu từ 16:31', videoId: 'Rz1pbtqBdVQ', start: 991, source: 'Liên kết do cậu cung cấp', url: 'https://www.youtube.com/watch?v=Rz1pbtqBdVQ&list=RDRz1pbtqBdVQ&start_radio=1&t=991s' }
  ];
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
  let notificationItems = [];
  let notificationsEnabled = true;
  let activeViewerMediaId = null;
  let homeAlbumFilter = 'all';
  let galleryAlbumFilter = 'all';
  let backupBusy = false;
  let activeCommentsMediaId = null;
  let editingCommentId = null;
  let homeMonthFilter = 'all';
  let galleryMonthFilter = 'all';
  let signedUrlCache = new Map();
  let activeTab = 'home';
  let yearbookOpened = false;
  let yearbookSpreadIndex = 0;
  let yearbookTurning = false;
  let yearbookMediaCache = null;
  let yearbookSignedUrls = new Map();
  let yearbookLoading = false;
  let yearbookLoadGeneration = 0;
  let yearbookRenderGeneration = 0;
  let yearbookTouchStart = null;
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
  let activeMusicTrackKey = null;
  let classroomSeats = [];
  let classroomFeatureAvailable = false;
  let peopleMode = 'classroom';
  let seatPromptShownForUserId = null;
  let seatSaving = false;
  let classOfficerAssignments = [];
  let officersFeatureAvailable = false;
  let isA5SiteAdmin = false;

  // Live updates: update data and visible sections in-place; never reload the document.
  let a5RealtimeChannel = null;
  let a5RealtimeActivityChannel = null;
  let a5RealtimeUserId = null;
  let a5RealtimeSubscribed = false;
  let a5RealtimeFallbackTimer = null;
  let a5RealtimeDebounceTimer = null;
  let a5RealtimePendingKinds = new Set();
  let a5RealtimeSyncBusy = false;
  let a5RealtimeMediaSignature = '';
  let a5RealtimeProfileSignature = '';
  let a5ReactionLoadSequence = 0;
  const a5ReactionMutationLocks = new Set();
  let a5YearbookPendingLiveUpdate = false;
  let a5RealtimeLifecycleBound = false;
  let deferredA5InstallPrompt = null;
  let a5ServiceWorkerRegistration = null;
  const A5_PUSH_PUBLIC_KEY = String(window.A5_PUSH_CONFIG?.VAPID_PUBLIC_KEY || '').trim();

  // A5 PWA installation: use the native browser prompt when available, otherwise explain the manual path.
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredA5InstallPrompt = event;
    updateA5InstallButtons();
  });
  window.addEventListener('appinstalled', () => {
    deferredA5InstallPrompt = null;
    updateA5InstallButtons();
    if (typeof toast === 'function') toast('Đã đưa app A5 về thiết bị rồi nè ♡', 'success');
  });

  function isA5Standalone() {
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  }
  function updateA5InstallButtons() {
    const installed = isA5Standalone();
    ['#installAppButton', '#authInstallButton'].forEach(selector => {
      const button = $(selector);
      if (!button) return;
      button.classList.toggle('is-installed', installed);
      button.setAttribute('aria-label', installed ? 'A5 đã được cài trên thiết bị' : 'Cài app A5 lên thiết bị');
      if (selector === '#installAppButton') {
        const label = $('.pwa-install-label', button);
        if (label) label.textContent = installed ? 'Đã cài' : 'Cài app';
        button.title = installed ? 'A5 đã được cài' : 'Cài app A5';
      }
    });
  }
  async function installA5App() {
    if (isA5Standalone()) return toast('Cậu đang mở app A5 đã cài rồi nè ♡', 'info');
    if (deferredA5InstallPrompt) {
      const promptEvent = deferredA5InstallPrompt;
      deferredA5InstallPrompt = null;
      try {
        await promptEvent.prompt();
        const result = await promptEvent.userChoice;
        if (result?.outcome === 'accepted') toast('Đang cài app A5 lên thiết bị của cậu ♡', 'success');
        updateA5InstallButtons();
        return;
      } catch (error) {
        console.warn('Native PWA install prompt unavailable:', error);
      }
    }
    openModal('installHelpModal');
  }
  async function registerA5ServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
    try {
      a5ServiceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      return a5ServiceWorkerRegistration;
    } catch (error) {
      console.warn('A5 service worker registration failed:', error);
      return null;
    }
  }
  function base64UrlToUint8Array(value) {
    const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const raw = atob(padded);
    return Uint8Array.from(raw, character => character.charCodeAt(0));
  }
  function isA5PushSupported() {
    return Boolean(window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  }
  async function getA5CurrentPushSubscription() {
    if (!isA5PushSupported()) return null;
    try {
      const registration = a5ServiceWorkerRegistration || await navigator.serviceWorker.getRegistration('/') || await registerA5ServiceWorker();
      if (!registration) return null;
      a5ServiceWorkerRegistration = registration;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.warn('Could not read A5 push subscription:', error);
      return null;
    }
  }
  async function updateA5PushSettingsUi() {
    const enable = $('#enablePushButton');
    const disable = $('#disablePushButton');
    const test = $('#testPushButton');
    const status = $('#pushSettingsStatus');
    if (!enable || !disable || !test || !status) return;
    if (!isA5PushSupported()) {
      enable.classList.remove('hidden'); disable.classList.add('hidden'); test.classList.add('hidden');
      enable.disabled = true;
      status.textContent = 'Trình duyệt này chưa hỗ trợ Web Push trong phiên hiện tại. Hãy thử Chrome/Edge trên PC hoặc cài A5 lên màn hình chính trên iPhone/iPad.';
      return;
    }
    enable.disabled = false;
    const subscription = await getA5CurrentPushSubscription();
    const subscribed = Boolean(subscription && Notification.permission === 'granted');
    enable.classList.toggle('hidden', subscribed);
    disable.classList.toggle('hidden', !subscribed);
    test.classList.toggle('hidden', !subscribed);
    if (Notification.permission === 'denied') {
      status.textContent = 'Thông báo đang bị chặn trong cài đặt trình duyệt. Hãy cho phép thông báo cho website A5 trong quyền của trang web rồi tải lại.';
    } else if (subscribed) {
      status.textContent = 'Thông báo đang bật trên thiết bị này. Khi bạn khác bình luận hoặc thả cảm xúc vào kỷ niệm của cậu, A5 có thể gửi thông báo ngoài website.';
    } else if (!A5_PUSH_PUBLIC_KEY || /PASTE|REPLACE|YOUR_/i.test(A5_PUSH_PUBLIC_KEY)) {
      status.textContent = 'Cài app dùng được ngay. Để bật thông báo nền, quản trị viên cần hoàn tất cấu hình Web Push trong thư mục supabase/functions và push-config.js.';
    } else {
      status.textContent = 'Bật để nhận lời nhắn mới ngoài website. Trình duyệt sẽ hỏi quyền trước khi đăng ký.';
    }
  }
  async function enableA5PushNotifications() {
    if (!supabase || !currentUser) return toast('Đăng nhập vào tài khoản A5 trước nhé.', 'info');
    if (!isA5PushSupported()) {
      openModal('installHelpModal');
      return toast('Thiết bị/trình duyệt này chưa sẵn sàng cho thông báo nền.', 'info', 5000);
    }
    if (!A5_PUSH_PUBLIC_KEY || /PASTE|REPLACE|YOUR_/i.test(A5_PUSH_PUBLIC_KEY)) {
      await updateA5PushSettingsUi();
      return toast('Phần cài app đã sẵn sàng; để bật thông báo nền cần hoàn tất cấu hình VAPID và Edge Function theo hướng dẫn PWA trong ZIP.', 'info', 6500);
    }
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !isA5Standalone()) {
      openModal('installHelpModal');
      return toast('Trên iPhone/iPad, hãy thêm A5 vào Màn hình chính rồi mở app trước khi bật thông báo.', 'info', 6500);
    }
    const button = $('#enablePushButton');
    if (button) button.disabled = true;
    try {
      const registration = a5ServiceWorkerRegistration || await registerA5ServiceWorker();
      if (!registration) throw new Error('Không đăng ký được service worker. Hãy mở website bằng HTTPS rồi tải lại.');
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') {
        await updateA5PushSettingsUi();
        return toast('Cậu chưa cấp quyền thông báo cho A5.', 'info', 5000);
      }
      const sub = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(A5_PUSH_PUBLIC_KEY) });
      const raw = sub.toJSON();
      if (!raw?.keys?.p256dh || !raw?.keys?.auth) throw new Error('Trình duyệt chưa trả về đủ thông tin đăng ký push.');
      const { error } = await supabase.from('a5_push_subscriptions').upsert({
        user_id: currentUser.id,
        endpoint: sub.endpoint,
        p256dh: raw.keys.p256dh,
        auth: raw.keys.auth,
        user_agent: String(navigator.userAgent || '').slice(0, 500),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,endpoint' });
      if (error) throw error;
      toast('Đã bật đăng ký thông báo trên thiết bị này ♡', 'success', 5000);
      await updateA5PushSettingsUi();
    } catch (error) {
      console.error('Enable A5 push failed:', error);
      const message = String(error?.message || 'Chưa bật được thông báo.');
      if (/a5_push_subscriptions|relation|schema cache|does not exist/i.test(message)) {
        toast('Chưa tạo bảng thông báo nền. Quản trị viên cần chạy supabase/a5-push-subscriptions.sql trước.', 'error', 6500);
      } else {
        toast(`Chưa bật được thông báo: ${message.slice(0, 140)}`, 'error', 6500);
      }
    } finally {
      if (button) button.disabled = false;
    }
  }
  async function disableA5PushNotifications(silent = false) {
    const subscription = await getA5CurrentPushSubscription();
    try {
      if (subscription && supabase && currentUser) {
        const { error } = await supabase.from('a5_push_subscriptions').delete().eq('user_id', currentUser.id).eq('endpoint', subscription.endpoint);
        if (error) throw error;
      }
      if (subscription) await subscription.unsubscribe();
      await updateA5PushSettingsUi();
      if (!silent) toast('Đã tắt thông báo nền trên thiết bị này.', 'success');
    } catch (error) {
      console.error('Disable A5 push failed:', error);
      if (!silent) toast('Chưa tắt được thông báo hoàn toàn. Cậu có thể chặn quyền trong cài đặt trình duyệt.', 'error', 5000);
    }
  }
  async function testA5PushNotification() {
    if (!supabase || !currentUser) return toast('Đăng nhập vào A5 trước nhé.', 'info');
    try {
      const { data, error } = await supabase.functions.invoke('a5-web-push', { body: { action: 'test' } });
      if (error) throw error;
      if (!data?.sent) return toast('Chưa gửi được thông báo thử. Kiểm tra Edge Function và khóa VAPID trong hướng dẫn.', 'error', 6500);
      toast('Đã gửi yêu cầu thông báo thử. Kiểm tra trung tâm thông báo của thiết bị nhé ♡', 'success', 5000);
    } catch (error) {
      console.error('A5 test push failed:', error);
      toast('Chưa gửi được thông báo thử. Có thể Edge Function hoặc secrets chưa được cấu hình.', 'error', 6500);
    }
  }
  async function dispatchA5ActivityPush(mediaId, type) {
    if (!supabase || !currentUser || !A5_PUSH_PUBLIC_KEY || /PASTE|REPLACE|YOUR_/i.test(A5_PUSH_PUBLIC_KEY)) return;
    try {
      const { error } = await supabase.functions.invoke('a5-web-push', { body: { action: 'activity', media_id: mediaId, notification_type: type } });
      if (error) console.info('A5 background push was not dispatched:', error.message || error);
    } catch (error) {
      // Push must never block a normal comment or reaction if push services are not configured.
      console.info('A5 background push unavailable:', error);
    }
  }
  function clearA5PushOnSignOut() {
    return disableA5PushNotifications(true);
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function escapeAttr(value) { return escapeHTML(value).replace(/`/g, '&#96;'); }
  function safeColor(value) { return /^#[0-9a-fA-F]{6}$/.test(String(value)) ? value : '#b64f73'; }
  function safeFont(value) { return FONT_ALLOWLIST.includes(value) ? value : 'Nunito'; }
  function shortInitial(name) { const text = String(name || 'A5').trim(); return escapeHTML(text ? [...text][0].toUpperCase() : 'A'); }
  function displayName(profile) { return profile?.display_name || profile?.nickname || 'Bạn A5'; }
  function findMediaItem(mediaId) {
    const feedItem = mediaItems.find(item => item.id === mediaId);
    if (feedItem) return feedItem;
    const bookItem = Array.isArray(yearbookMediaCache) ? yearbookMediaCache.find(item => item.id === mediaId) : null;
    if (!bookItem) return null;
    return { ...bookItem, url: yearbookSignedUrls.get(bookItem.id) || bookItem.url || '' };
  }
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
  function populateAlbumFilters() {
    const albums = [...new Set(mediaItems.map(item => String(item.album_name || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    for (const [id, value] of [['homeAlbumFilter', homeAlbumFilter], ['galleryAlbumFilter', galleryAlbumFilter]]) {
      const select = $(`#${id}`);
      if (!select) continue;
      select.innerHTML = '<option value="all">Tất cả sự kiện</option>' + albums.map(album => `<option value="${escapeAttr(album)}">${escapeHTML(album)}</option>`).join('');
      select.value = albums.includes(value) ? value : 'all';
    }
  }
  async function ensureJSZip() {
    if (window.JSZip) return window.JSZip;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-a5-jszip]');
      if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      script.setAttribute('data-a5-jszip', 'true');
      script.onload = resolve; script.onerror = () => reject(new Error('Không tải được công cụ ZIP. Kiểm tra kết nối mạng rồi thử lại.'));
      document.head.appendChild(script);
    });
    if (!window.JSZip) throw new Error('Thư viện ZIP chưa sẵn sàng.');
    return window.JSZip;
  }
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function populateMonthFilters() {
    populateAlbumFilters();
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
  function renderMusicTrackList() {
    const list = $('#a5MusicTrackList');
    if (!list) return;
    const count = $('#a5MusicTrackCount');
    if (count) count.textContent = `${A5_MUSIC_TRACKS.length} bài`;
    list.innerHTML = A5_MUSIC_TRACKS.map((track, index) => `
      <button type="button" class="a5-music-track" data-action="select-music-track" data-music-track="${escapeAttr(track.key)}" role="listitem" aria-pressed="false">
        <span class="a5-music-track-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="a5-music-track-copy"><strong>${escapeHTML(track.title)}</strong><small>${escapeHTML(track.artist)}</small></span>
        <span class="a5-music-track-play" aria-hidden="true">▶</span>
      </button>`).join('');
  }

  function updateMusicCompactControls(isCompact) {
    const widget = $('#a5MusicWidget');
    const panel = $('#a5MusicPanel');
    const compactButton = $('.a5-music-minimize');
    const toggle = $('#a5MusicToggle');
    if (widget) widget.classList.toggle('is-compact', isCompact);
    if (panel) panel.classList.toggle('is-compact', isCompact);
    if (compactButton) {
      compactButton.textContent = isCompact ? '☷' : '−';
      compactButton.setAttribute('aria-label', isCompact ? 'Mở danh sách bài hát' : 'Thu nhỏ trình phát, nhạc vẫn tiếp tục');
      compactButton.title = isCompact ? 'Mở danh sách bài hát' : 'Thu nhỏ · nhạc vẫn phát';
    }
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.classList.add('is-open');
  }

  function openMusicPanel() {
    const widget = $('#a5MusicWidget');
    const panel = $('#a5MusicPanel');
    const toggle = $('#a5MusicToggle');
    if (!widget || !panel || widget.classList.contains('hidden')) return;
    panel.classList.remove('hidden');
    updateMusicCompactControls(false);
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.classList.add('is-open');
  }

  function toggleMusicCompact() {
    const panel = $('#a5MusicPanel');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
      openMusicPanel();
      return;
    }
    const goingCompact = !panel.classList.contains('is-compact');
    if (goingCompact && !activeMusicTrackKey) {
      toast('Chọn một bài trước rồi thu nhỏ trình phát nhé ♡', 'info');
      return;
    }
    updateMusicCompactControls(goingCompact);
  }

  function resetMusicPlayerContent() {
    const wrap = $('#a5MusicPlayerWrap');
    if (wrap) wrap.innerHTML = '<div class="a5-music-empty-player"><span aria-hidden="true">🎶</span><strong>Một giai điệu cho ngày đi học</strong><p>Chọn bài ở danh sách bên dưới. Video sẽ phát ngay trong web bằng trình phát YouTube chính thức.</p></div>';
    const title = $('#a5MusicCurrentTitle');
    const artist = $('#a5MusicCurrentArtist');
    const badge = $('#a5MusicPlayingBadge');
    const external = $('#a5MusicOpenYoutube');
    if (title) title.textContent = 'Chưa chọn bài hát';
    if (artist) artist.textContent = 'Nhạc mặc định tắt · chọn một bài để bắt đầu';
    if (badge) badge.textContent = 'READY';
    if (external) { external.classList.add('hidden'); external.href = 'https://www.youtube.com/'; }
    $$('.a5-music-track').forEach(button => { button.classList.remove('is-selected'); button.setAttribute('aria-pressed', 'false'); });
  }

  function closeMusicPanel(stopPlayback = true) {
    const widget = $('#a5MusicWidget');
    const panel = $('#a5MusicPanel');
    const toggle = $('#a5MusicToggle');
    if (stopPlayback) {
      activeMusicTrackKey = null;
      resetMusicPlayerContent();
    }
    panel?.classList.add('hidden');
    panel?.classList.remove('is-compact');
    widget?.classList.remove('is-compact');
    const compactButton = $('.a5-music-minimize');
    if (compactButton) {
      compactButton.textContent = '−';
      compactButton.setAttribute('aria-label', 'Thu nhỏ trình phát, nhạc vẫn tiếp tục');
      compactButton.title = 'Thu nhỏ · nhạc vẫn phát';
    }
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.classList.remove('is-open');
  }

  function toggleMusicPanel() {
    const panel = $('#a5MusicPanel');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
      openMusicPanel();
    } else if (panel.classList.contains('is-compact')) {
      openMusicPanel();
    } else if (activeMusicTrackKey) {
      updateMusicCompactControls(true);
    } else {
      closeMusicPanel(false);
    }
  }

  function playMusicTrack(trackKey) {
    const track = A5_MUSIC_TRACKS.find(item => item.key === trackKey);
    if (!track) return;
    const wrap = $('#a5MusicPlayerWrap');
    if (!wrap) return;
    activeMusicTrackKey = track.key;
    openMusicPanel();
    $$('.a5-music-track').forEach(button => {
      const selected = button.dataset.musicTrack === track.key;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      const icon = button.querySelector('.a5-music-track-play');
      if (icon) icon.textContent = selected ? '♫' : '▶';
    });
    $('#a5MusicCurrentTitle').textContent = track.title;
    $('#a5MusicCurrentArtist').textContent = `${track.artist} · phát từ YouTube`;
    $('#a5MusicPlayingBadge').textContent = 'ĐANG MỞ';
    const external = $('#a5MusicOpenYoutube');
    external.href = track.url;
    external.classList.remove('hidden');
    const start = track.start ? `&start=${Math.floor(track.start)}` : '';
    const origin = `&origin=${encodeURIComponent(window.location.origin)}`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(track.videoId)}?autoplay=1&controls=1&playsinline=1&rel=0${start}${origin}`;
    wrap.innerHTML = `<iframe class="a5-music-iframe" src="${escapeAttr(embedUrl)}" title="${escapeAttr(`${track.title} — trình phát YouTube`)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
    // Collapse the playlist, but keep the official YouTube player visible at a compliant size.
    updateMusicCompactControls(true);
  }

  function showAuthScreen() {
    closeMusicPanel(true);
    $('#a5MusicWidget')?.classList.add('hidden');
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
    $('#a5MusicWidget')?.classList.remove('hidden');
    renderMusicTrackList();
  }

  async function initialize() {
    window.setTimeout(() => $('#splash')?.classList.add('done'), 700);
    registerA5ServiceWorker();
    updateA5InstallButtons();
    setupA5LiveLifecycleEvents();
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
            stopA5RealtimeSubscriptions();
            currentUser = null; currentProfile = null; profiles = []; mediaItems = []; reactionItems = []; classroomSeats = []; classroomFeatureAvailable = false; classOfficerAssignments = []; officersFeatureAvailable = false; isA5SiteAdmin = false; seatPromptShownForUserId = null; lastUserId = null;
            yearbookLoadGeneration += 1; yearbookLoading = false; yearbookMediaCache = null; yearbookSignedUrls.clear(); yearbookOpened = false; yearbookSpreadIndex = 0;
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
      setupA5RealtimeSubscriptions();
      return;
    }
    stopA5RealtimeSubscriptions();
    lastUserId = session.user.id;
    await loadData(true);
    await syncLinkedProviders();
    renderAll();
    updateA5PushSettingsUi();
    setupA5RealtimeSubscriptions();
  }

  async function signOut() {
    if (!supabase) return;
    const button = $('#logoutButton');
    if (button) button.disabled = true;
    await clearA5PushOnSignOut();
    const { error } = await supabase.auth.signOut();
    if (button) button.disabled = false;
    if (error) { console.error(error); toast('Chưa đăng xuất được. Thử lại nhé.', 'error'); return; }
    currentUser = null; currentProfile = null; profiles = []; mediaItems = []; reactionItems = []; classroomSeats = []; classroomFeatureAvailable = false; classOfficerAssignments = []; officersFeatureAvailable = false; isA5SiteAdmin = false; seatPromptShownForUserId = null; lastUserId = null;
    yearbookLoadGeneration += 1; yearbookLoading = false; yearbookMediaCache = null; yearbookSignedUrls.clear(); yearbookOpened = false; yearbookSpreadIndex = 0;
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

  // Sign many private media objects in batches instead of making one network request per file.
  // This dramatically reduces initial-load latency on a feed with many photos and avatars.
  async function resolveSignedUrls(bucket, paths) {
    const result = new Map();
    if (!supabase) return result;
    const uniquePaths = [...new Set((paths || []).filter(path => typeof path === 'string' && path.trim()))];
    const missing = [];
    const now = Date.now();
    for (const path of uniquePaths) {
      const cached = signedUrlCache.get(`${bucket}:${path}`);
      if (cached && cached.expiresAt > now && cached.url) result.set(path, cached.url);
      else missing.push(path);
    }
    if (!missing.length) return result;

    const batches = [];
    for (let i = 0; i < missing.length; i += 70) batches.push(missing.slice(i, i + 70));
    const failedPaths = [];
    const batchResults = await Promise.allSettled(batches.map(pathsChunk =>
      supabase.storage.from(bucket).createSignedUrls(pathsChunk, 86400)
    ));

    batchResults.forEach((batchResult, batchIndex) => {
      const requestedPaths = batches[batchIndex];
      if (batchResult.status !== 'fulfilled' || batchResult.value?.error) {
        failedPaths.push(...requestedPaths);
        return;
      }
      const rows = batchResult.value?.data || [];
      const remaining = new Set(requestedPaths);
      rows.forEach((row, rowIndex) => {
        const rawPath = String(row?.path || row?.name || '').replace(/^\/+/, '');
        let path = requestedPaths.includes(rawPath) ? rawPath : requestedPaths.find(candidate => rawPath.endsWith(`/${candidate}`));
        if (!path && rows.length === requestedPaths.length) path = requestedPaths[rowIndex];
        const url = row?.signedUrl || row?.signedURL || '';
        if (!path || !url || row?.error) return;
        remaining.delete(path);
        const key = `${bucket}:${path}`;
        signedUrlCache.set(key, { url, expiresAt: Date.now() + 22 * 60 * 60 * 1000 });
        result.set(path, url);
      });
      failedPaths.push(...remaining);
    });

    // Graceful fallback for storage SDK/server responses that omit an item in the batch result.
    // Limit concurrency so an unusual bucket response cannot flood the server with requests.
    if (failedPaths.length) {
      let cursor = 0;
      const workers = Array.from({ length: Math.min(6, failedPaths.length) }, async () => {
        while (cursor < failedPaths.length) {
          const path = failedPaths[cursor++];
          if (result.has(path)) continue;
          const url = await resolveSignedUrl(bucket, path);
          if (url) result.set(path, url);
        }
      });
      await Promise.all(workers);
    }
    return result;
  }

  async function loadData(showLoading = false) {
    if (!supabase || !currentUser) return;
    const token = ++pageLoadToken;
    yearbookLoadGeneration += 1; yearbookLoading = false; yearbookMediaCache = null; yearbookSignedUrls.clear(); yearbookRenderGeneration += 1;
    if (showLoading) {
      $('#homeMediaGrid').innerHTML = loadingCard('Đang tìm lại những kỷ niệm...');
      $('#galleryMediaGrid').innerHTML = loadingCard('Đang xếp album...');
      $('#peopleGrid').innerHTML = loadingCard('Đang gọi tên những người bạn...');
    }
    try {
      const [profileResult, mediaResult] = await Promise.all([
        supabase.from('profiles').select('id,display_name,nickname,bio,dream_job,hobbies,future_wishes,avatar_path,profile_color,linked_providers,created_at,updated_at').order('created_at', { ascending: true }).order('id', { ascending: true }),
        // Owners are joined in memory from the profiles result below. Avoid embedding
        // the same profile fields into every media row; smaller response = faster startup.
        supabase.from('media_items').select('id,user_id,media_type,storage_path,caption,note_color,note_font,album_name,created_at,updated_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(200)
      ]);
      if (profileResult.error) throw profileResult.error;
      if (mediaResult.error) throw mediaResult.error;
      const rawProfiles = profileResult.data || [];
      const rawMedia = mediaResult.data || [];
      // Sign private avatar and media URLs concurrently; neither request depends on the other.
      const [avatarUrlMap, mediaUrlMap] = await Promise.all([
        resolveSignedUrls(AVATAR_BUCKET, rawProfiles.map(profile => profile.avatar_path)),
        resolveSignedUrls(MEDIA_BUCKET, rawMedia.map(item => item.storage_path))
      ]);
      const profileResolved = rawProfiles.map(profile => ({
        ...profile, avatar_url: profile.avatar_path ? (avatarUrlMap.get(profile.avatar_path) || '') : ''
      }));
      if (token !== pageLoadToken) return;
      profiles = profileResolved;
      currentProfile = profiles.find(profile => profile.id === currentUser.id) || null;
      if (!currentProfile) {
        // A profile trigger should create this row; reload once in case the auth trigger was still running.
        await ensureOwnProfile();
        const retry = await supabase.from('profiles').select('id,display_name,nickname,bio,dream_job,hobbies,future_wishes,avatar_path,profile_color,linked_providers,created_at,updated_at').eq('id', currentUser.id).maybeSingle();
        if (retry.data) {
          const retryAvatarUrls = await resolveSignedUrls(AVATAR_BUCKET, [retry.data.avatar_path]);
          const resolved = { ...retry.data, avatar_url: retry.data.avatar_path ? (retryAvatarUrls.get(retry.data.avatar_path) || '') : '' };
          profiles = [...profiles.filter(p => p.id !== resolved.id), resolved]; currentProfile = resolved;
        }
      }
      mediaItems = rawMedia.map(item => {
        const owner = profiles.find(profile => profile.id === item.user_id) || null;
        const mediaUrl = mediaUrlMap.get(item.storage_path) || '';
        return { ...item, url: mediaUrl, profiles: owner };
      });
      a5RealtimeMediaSignature = a5LiveMediaSignature(rawMedia);
      a5RealtimeProfileSignature = a5LiveProfileSignature(rawProfiles);
      if (token !== pageLoadToken) return;
      // These queries are independent. Run them together to reduce serial network waits.
      await Promise.all([
        loadClassroomSeats(),
        loadClassOfficerAssignments(),
        loadReactions(),
        loadCommentCounts(),
        loadNotifications()
      ]);
      renderAll();
      if (!currentProfile) toast('Chưa tải được hồ sơ tài khoản. Hãy kiểm tra lại schema SQL trong Supabase.', 'error', 6000);
      else {
        const welcomeShown = maybeShowNewMemberWelcome();
        if (!welcomeShown) maybePromptSeatSelection();
      }
    } catch (error) {
      console.error('loadData failed:', error);
      const message = error?.message || 'Không rõ nguyên nhân';
      $('#homeMediaGrid').innerHTML = errorCard('Không tải được album', 'Kiểm tra schema SQL, quyền truy cập và kết nối Supabase.');
      $('#galleryMediaGrid').innerHTML = errorCard('Album chưa sẵn sàng', 'Hãy kiểm tra thiết lập backend theo README.');
      $('#peopleGrid').innerHTML = errorCard('Chưa tải được thành viên', 'Hãy kiểm tra thiết lập backend theo README.');
      toast(`Tải dữ liệu thất bại: ${message.slice(0, 95)}`, 'error', 6500);
    }
  }

  function a5LiveMediaSignature(rows) {
    // Sort by stable primary key before comparing. Equal created_at timestamps can
    // otherwise shuffle rows between snapshots and cause needless DOM work.
    return JSON.stringify((rows || []).map(row => [
      row.id, row.user_id, row.media_type, row.storage_path, row.caption,
      row.note_color, row.note_font, row.album_name, row.created_at, row.updated_at
    ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
  }

  function a5LiveProfileSignature(rows) {
    return JSON.stringify((rows || []).map(row => [
      row.id, row.display_name, row.nickname, row.bio, row.dream_job,
      row.hobbies, row.future_wishes, row.avatar_path, row.profile_color,
      row.linked_providers, row.created_at, row.updated_at
    ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
  }

  function stopA5RealtimeSubscriptions() {
    const oldChannel = a5RealtimeChannel;
    const oldActivityChannel = a5RealtimeActivityChannel;
    a5RealtimeChannel = null;
    a5RealtimeActivityChannel = null;
    a5RealtimeUserId = null;
    a5RealtimeSubscribed = false;
    a5RealtimePendingKinds.clear();
    if (a5RealtimeDebounceTimer) window.clearTimeout(a5RealtimeDebounceTimer);
    a5RealtimeDebounceTimer = null;
    if (a5RealtimeFallbackTimer) window.clearInterval(a5RealtimeFallbackTimer);
    a5RealtimeFallbackTimer = null;
    if (oldChannel && supabase) {
      try { void supabase.removeChannel(oldChannel); }
      catch (error) { console.warn('A5 media live channel cleanup:', error?.message || error); }
    }
    if (oldActivityChannel && supabase) {
      try { void supabase.removeChannel(oldActivityChannel); }
      catch (error) { console.warn('A5 activity live channel cleanup:', error?.message || error); }
    }
  }

  function startA5RealtimeFallback() {
    if (a5RealtimeFallbackTimer) return;
    // Only used when Realtime is disconnected. It synchronizes data, not the page.
    a5RealtimeFallbackTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || !currentUser || !supabase) return;
      queueA5RealtimeUpdate('media');
    }, 90000);
  }

  function setupA5LiveLifecycleEvents() {
    if (a5RealtimeLifecycleBound) return;
    a5RealtimeLifecycleBound = true;
    const catchUp = () => {
      if (!currentUser || !supabase || document.visibilityState === 'hidden') return;
      // Reconcile any events missed while the app/device slept, without refreshing the page.
      ['media', 'profiles', 'reactions', 'comments', 'notifications'].forEach(queueA5RealtimeUpdate);
    };
    document.addEventListener('visibilitychange', catchUp);
    window.addEventListener('online', catchUp);
  }

  function setupA5RealtimeSubscriptions() {
    if (!supabase || !currentUser) return;
    if (a5RealtimeChannel && a5RealtimeUserId === currentUser.id) return;
    stopA5RealtimeSubscriptions();
    a5RealtimeUserId = currentUser.id;
    // Keep the core media channel separate: an optional social table missing from a
    // legacy project must never stop photo/video live updates.
    const channel = supabase.channel(`a5-media-${currentUser.id.slice(0, 8)}-${Date.now().toString(36)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_items' }, () => queueA5RealtimeUpdate('media'));
    a5RealtimeChannel = channel;
    channel.subscribe(status => {
      if (a5RealtimeChannel !== channel) return;
      if (status === 'SUBSCRIBED') {
        a5RealtimeSubscribed = true;
        if (a5RealtimeFallbackTimer) window.clearInterval(a5RealtimeFallbackTimer);
        a5RealtimeFallbackTimer = null;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        a5RealtimeSubscribed = false;
        console.warn('A5 media Realtime is unavailable; temporary in-page sync fallback enabled.', status);
        startA5RealtimeFallback();
      }
    });

    const activityChannel = supabase.channel(`a5-activity-${currentUser.id.slice(0, 8)}-${Date.now().toString(36)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => queueA5RealtimeUpdate('profiles'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => queueA5RealtimeUpdate('reactions'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_comments' }, () => queueA5RealtimeUpdate('comments'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => queueA5RealtimeUpdate('notifications'));
    a5RealtimeActivityChannel = activityChannel;
    activityChannel.subscribe(status => {
      if (a5RealtimeActivityChannel !== activityChannel) return;
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.warn('A5 optional activity updates are unavailable; photo/video live updates remain independent.', status);
      }
    });
  }

  function queueA5RealtimeUpdate(kind) {
    if (!currentUser || !supabase) return;
    a5RealtimePendingKinds.add(kind);
    // Fixed-window coalescing: a burst of simultaneous uploads is reconciled in
    // batches instead of restarting a full-grid render for every Postgres event.
    if (a5RealtimeDebounceTimer) return;
    a5RealtimeDebounceTimer = window.setTimeout(() => {
      a5RealtimeDebounceTimer = null;
      void processA5RealtimeUpdates();
    }, 650);
  }

  async function syncA5LiveSnapshot() {
    const requestedUserId = currentUser?.id;
    if (!requestedUserId || !supabase) return { profilesChanged: false, mediaChanged: false };
    const [profileResult, mediaResult] = await Promise.all([
      supabase.from('profiles')
        .select('id,display_name,nickname,bio,dream_job,hobbies,future_wishes,avatar_path,profile_color,linked_providers,created_at,updated_at')
        .order('created_at', { ascending: true }).order('id', { ascending: true }),
      supabase.from('media_items')
        .select('id,user_id,media_type,storage_path,caption,note_color,note_font,album_name,created_at,updated_at')
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(200)
    ]);
    if (profileResult.error) throw profileResult.error;
    if (mediaResult.error) throw mediaResult.error;
    if (!currentUser || currentUser.id !== requestedUserId) return { profilesChanged: false, mediaChanged: false };

    const rawProfiles = profileResult.data || [];
    const rawMedia = mediaResult.data || [];
    const nextProfileSignature = a5LiveProfileSignature(rawProfiles);
    const nextMediaSignature = a5LiveMediaSignature(rawMedia);
    const profilesChanged = nextProfileSignature !== a5RealtimeProfileSignature;
    const mediaChanged = nextMediaSignature !== a5RealtimeMediaSignature;
    if (!profilesChanged && !mediaChanged) return { profilesChanged: false, mediaChanged: false };

    const oldProfiles = new Map(profiles.map(profile => [profile.id, profile]));
    const oldMedia = new Map(mediaItems.map(item => [item.id, item]));
    const [avatarUrlMap, mediaUrlMap] = await Promise.all([
      resolveSignedUrls(AVATAR_BUCKET, rawProfiles.map(profile => profile.avatar_path)),
      resolveSignedUrls(MEDIA_BUCKET, rawMedia.map(item => item.storage_path))
    ]);
    if (!currentUser || currentUser.id !== requestedUserId) return { profilesChanged: false, mediaChanged: false };

    profiles = rawProfiles.map(profile => {
      const old = oldProfiles.get(profile.id);
      const avatarUrl = profile.avatar_path ? (avatarUrlMap.get(profile.avatar_path) || (old?.avatar_path === profile.avatar_path ? old.avatar_url : '') || '') : '';
      return { ...profile, avatar_url: avatarUrl };
    });
    currentProfile = profiles.find(profile => profile.id === currentUser?.id) || currentProfile;

    mediaItems = rawMedia.map(item => {
      const old = oldMedia.get(item.id);
      const mediaUrl = item.storage_path
        ? (mediaUrlMap.get(item.storage_path) || (old?.storage_path === item.storage_path ? old.url : '') || '')
        : '';
      return {
        ...item,
        url: mediaUrl,
        profiles: profiles.find(profile => profile.id === item.user_id) || null,
        reactions: old?.reactions || []
      };
    });
    a5RealtimeProfileSignature = nextProfileSignature;
    a5RealtimeMediaSignature = nextMediaSignature;
    return { profilesChanged, mediaChanged };
  }

  function captureA5VisibleMediaAnchor() {
    if (!['home', 'gallery'].includes(activeTab)) return null;
    const grid = activeTab === 'gallery' ? $('#galleryMediaGrid') : $('#homeMediaGrid');
    if (!grid) return null;
    const card = [...grid.querySelectorAll('[data-media-card]')].find(element => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    if (!card) return null;
    return { id: card.dataset.mediaCard, top: card.getBoundingClientRect().top };
  }

  function restoreA5VisibleMediaAnchor(anchor) {
    if (!anchor) return;
    window.requestAnimationFrame(() => {
      const grid = activeTab === 'gallery' ? $('#galleryMediaGrid') : (activeTab === 'home' ? $('#homeMediaGrid') : null);
      const card = grid && [...grid.querySelectorAll('[data-media-card]')].find(element => element.dataset.mediaCard === anchor.id);
      if (!card) return;
      const delta = card.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > 2) window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
    });
  }

  function invalidateA5YearbookAfterLiveChange() {
    if (activeTab === 'yearbook' && yearbookOpened) {
      // Don't interrupt someone while they're reading a page; refresh the cache after they leave.
      a5YearbookPendingLiveUpdate = true;
      return;
    }
    yearbookLoadGeneration += 1;
    yearbookLoading = false;
    yearbookMediaCache = null;
    yearbookSignedUrls.clear();
    yearbookRenderGeneration += 1;
  }

  async function processA5RealtimeUpdates() {
    if (a5RealtimeSyncBusy || !supabase || !currentUser) {
      if (a5RealtimePendingKinds.size && currentUser && supabase) {
        a5RealtimeDebounceTimer = window.setTimeout(() => {
          a5RealtimeDebounceTimer = null;
          void processA5RealtimeUpdates();
        }, 500);
      }
      return;
    }
    const kinds = new Set(a5RealtimePendingKinds);
    a5RealtimePendingKinds.clear();
    if (!kinds.size) return;
    const processingUserId = currentUser.id;
    a5RealtimeSyncBusy = true;
    try {
      let snapshot = { profilesChanged: false, mediaChanged: false };
      if (kinds.has('media') || kinds.has('profiles')) snapshot = await syncA5LiveSnapshot();
      if (!currentUser || currentUser.id !== processingUserId) return;
      // A new media row has no reactions/comments yet. Don't refetch both entire
      // derived tables on every upload; their own Realtime events keep them current.
      const reactionsChanged = kinds.has('reactions');
      const commentsChanged = kinds.has('comments');
      let reactionStateApplied = !reactionsChanged;

      if (reactionsChanged) {
        try { reactionStateApplied = (await loadReactions()) !== false; }
        catch (error) { reactionStateApplied = false; console.warn('A5 live reactions sync was skipped:', error?.message || error); }
      }
      if (commentsChanged) {
        try { await loadCommentCounts(); }
        catch (error) { console.warn('A5 live comment counts sync was skipped:', error?.message || error); }
      }
      if (kinds.has('comments') || kinds.has('reactions') || kinds.has('notifications')) {
        await loadNotifications();
        if (!$('#notificationsModal')?.classList.contains('hidden')) renderNotificationsList();
      }

      const mediaOrProfileChanged = snapshot.mediaChanged || snapshot.profilesChanged;
      if (snapshot.mediaChanged) {
        populateMonthFilters();
        renderOnThisDay();
        invalidateA5YearbookAfterLiveChange();
      } else if (kinds.has('media')) {
        // The changed row may be older than the visible 200-item feed but still in the yearbook.
        invalidateA5YearbookAfterLiveChange();
      }
      // Only media/profile mutations are allowed to reconcile the grid order.
      // Reactions and comment counts are patched on existing nodes: replacing a
      // whole reaction row on every event both flashes the UI and can drop a tap.
      if (mediaOrProfileChanged) {
        const anchor = captureA5VisibleMediaAnchor();
        if (activeTab === 'home') renderHomeMedia();
        else if (activeTab === 'gallery') renderGallery();
        if ((snapshot.profilesChanged || snapshot.mediaChanged) && activeTab === 'people') renderPeople();
        if (snapshot.profilesChanged && activeTab === 'profile') renderProfile();
        restoreA5VisibleMediaAnchor(anchor);
      } else if ((reactionsChanged && reactionStateApplied) || commentsChanged) {
        a5PatchVisibleMediaLiveDetails({
          reactions: reactionsChanged && reactionStateApplied,
          comments: commentsChanged
        });
      }
      if (kinds.has('notifications') || kinds.has('comments') || kinds.has('reactions')) renderNotificationBadge();

      if (kinds.has('comments') && activeCommentsMediaId && !$('#commentsModal')?.classList.contains('hidden') &&
          document.activeElement !== $('#commentInput') && !editingCommentId) {
        await refreshComments(activeCommentsMediaId, true);
      }
    } catch (error) {
      // Realtime is an enhancement: never replace the user's screen with an error state.
      console.warn('A5 live update could not be applied. The next event will retry:', error?.message || error);
    } finally {
      a5RealtimeSyncBusy = false;
      if (a5RealtimePendingKinds.size && !a5RealtimeDebounceTimer) {
        a5RealtimeDebounceTimer = window.setTimeout(() => {
          a5RealtimeDebounceTimer = null;
          void processA5RealtimeUpdates();
        }, 220);
      }
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
    const { data, error } = await supabase.from('profiles').update({ linked_providers: providers }).eq('id', currentUser.id).select('id,display_name,nickname,bio,dream_job,hobbies,future_wishes,avatar_path,profile_color,linked_providers,created_at,updated_at').maybeSingle();
    if (error) { console.warn('Could not sync linked providers:', error.message); return; }
    if (data) {
      currentProfile = { ...currentProfile, ...data };
      profiles = profiles.map(profile => profile.id === currentUser.id ? { ...profile, ...data } : profile);
    }
  }

  async function loadReactions() {
    if (!supabase || !currentUser) return;
    const requestSequence = ++a5ReactionLoadSequence;
    const ids = mediaItems.map(item => item.id);
    const idSignature = ids.join('|');
    if (!ids.length) { reactionItems = []; return true; }
    const { data, error } = await supabase.from('reactions')
      .select('id,media_id,user_id,emoji,created_at,profiles(id,display_name,nickname,avatar_path)')
      .in('media_id', ids);
    if (error) throw error;
    // Two near-simultaneous reaction requests may finish out of order. Only the
    // latest request for the current feed may replace the local state.
    if (requestSequence !== a5ReactionLoadSequence) return false;
    if (idSignature !== mediaItems.map(item => item.id).join('|')) {
      queueA5RealtimeUpdate('reactions');
      return false;
    }
    reactionItems = (data || []).map(item => ({ ...item, emoji: normalizeReactionEmoji(item.emoji), profile: profiles.find(profile => profile.id === item.user_id) || item.profiles || null }));
    const byMedia = new Map();
    reactionItems.forEach(reaction => {
      if (!byMedia.has(reaction.media_id)) byMedia.set(reaction.media_id, []);
      byMedia.get(reaction.media_id).push(reaction);
    });
    mediaItems = mediaItems.map(item => ({ ...item, reactions: byMedia.get(item.id) || [] }));
    return true;
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

  async function loadNotifications() {
    notificationItems = [];
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase.from('notifications')
        .select('id,user_id,actor_id,media_id,notification_type,created_at,read_at')
        .eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(40);
      if (error) throw error;
      notificationsEnabled = true;
      notificationItems = (data || []).map(row => ({ ...row, actor: profiles.find(profile => profile.id === row.actor_id) || null }));
    } catch (error) {
      notificationsEnabled = false;
      const message = String(error?.message || '');
      if (!/does not exist|schema cache|relation|column/i.test(message)) console.warn('Notifications need V3 migration or access:', message);
    }
    renderNotificationBadge();
  }
  function renderNotificationBadge() {
    const badge = $('#notificationBadge');
    if (!badge) return;
    const unread = notificationItems.filter(item => !item.read_at).length;
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.classList.toggle('hidden', unread === 0);
    const button = $('#topNotificationButton');
    if (button) button.setAttribute('aria-label', unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo');
  }
  function renderNotificationsList() {
    const container = $('#notificationsList');
    if (!container) return;
    if (!notificationsEnabled) {
      container.innerHTML = '<div class="comments-migration-note"><strong>🔔 Thông báo chưa được bật</strong><p>Quản trị viên cần chạy file <code>supabase/upgrade-v3.sql</code> trước.</p></div>';
      return;
    }
    if (!notificationItems.length) {
      container.innerHTML = '<div class="comments-empty"><span>🌷</span><strong>Chưa có thông báo</strong><p>Khi bạn bè bình luận hoặc thả cảm xúc, lời nhắn sẽ xuất hiện ở đây.</p></div>';
      return;
    }
    container.innerHTML = notificationItems.map(item => {
      const actor = profiles.find(profile => profile.id === item.actor_id) || item.actor || {};
      const verb = item.notification_type === 'comment' ? 'đã để lại bình luận' : 'đã thả cảm xúc vào kỷ niệm';
      return `<button type="button" class="notification-row ${item.read_at ? '' : 'unread'}" data-action="open-notification" data-notification-id="${escapeAttr(item.id)}" data-media-id="${escapeAttr(item.media_id || '')}" data-notification-type="${escapeAttr(item.notification_type)}"><span class="notification-avatar">${actor.avatar_url ? `<img src="${escapeAttr(actor.avatar_url)}" alt="" loading="lazy" decoding="async" fetchpriority="low"/>` : shortInitial(displayName(actor))}</span><span class="notification-copy"><strong>${escapeHTML(displayName(actor))}</strong><span>${verb}</span><small>${escapeHTML(formatDate(item.created_at, true))}</small></span><span class="notification-status">${item.read_at ? 'Đã đọc' : '● Mới'}</span></button>`;
    }).join('');
  }
  async function openNotifications() {
    await loadNotifications();
    renderNotificationsList();
    openModal('notificationsModal');
    updateA5PushSettingsUi();
  }
  async function openNotification(notificationId, mediaId, type) {
    const row = notificationItems.find(item => item.id === notificationId);
    if (!row) return;
    if (!row.read_at && supabase && currentUser) {
      const now = new Date().toISOString();
      const { error } = await supabase.from('notifications').update({ read_at: now }).eq('id', notificationId).eq('user_id', currentUser.id);
      if (!error) row.read_at = now;
    }
    renderNotificationBadge();
    closeModals();
    if (!mediaItems.some(item => item.id === mediaId)) return toast('Kỷ niệm này không còn trong album.', 'info');
    if (type === 'comment') await openComments(mediaId);
    else openMediaViewer(mediaId);
  }

  function loadingCard(text) { return `<div class="loading-card"><span class="loading-flower">✿</span><p>${escapeHTML(text)}</p></div>`; }
  function errorCard(title, message) { return `<div class="loading-card"><span class="loading-flower">♡</span><p><strong>${escapeHTML(title)}</strong></p><p>${escapeHTML(message)}</p></div>`; }
  function avatarHTML(profile, className = 'avatar') {
    const url = profile?.avatar_url;
    const label = displayName(profile);
    return `<span class="${className}" title="${escapeAttr(label)}">${url ? `<img src="${escapeAttr(url)}" alt="Ảnh đại diện ${escapeAttr(label)}" loading="lazy" decoding="async" fetchpriority="low"/>` : shortInitial(label)}</span>`;
  }
  function normalizeReactionEmoji(value) {
    const emoji = String(value || '').normalize('NFC');
    // Some devices/databases persist the heart with or without a variation
    // selector. Treat those as the same ❤️ so it cannot split into two reactions.
    if (emoji === '❤' || emoji === '❤︎' || emoji === '❤️') return '❤️';
    return emoji;
  }

  function userReactionSet(item) {
    const result = new Map();
    (item.reactions || reactionItems.filter(reaction => reaction.media_id === item.id)).forEach(reaction => {
      const emoji = normalizeReactionEmoji(reaction.emoji);
      if (!result.has(emoji)) result.set(emoji, []);
      result.get(emoji).push(reaction);
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
        ? `<div class="media-video-placeholder" aria-hidden="true"><span>▶</span><small>VIDEO KỶ NIỆM</small><i>chạm để xem</i></div>`
        : `<img src="${escapeAttr(item.url)}" alt="Kỷ niệm của ${escapeAttr(displayName(owner))}" loading="lazy" decoding="async"/>`)
      : `<div class="media-visual-fallback">${item.media_type === 'video' ? '▷' : '✿'}</div>`;
    const caption = item.caption ? `<p class="media-note" style="--note-color:${safeColor(item.note_color)};--note-font:'${safeFont(item.note_font)}'">${escapeHTML(item.caption)}</p>` : '';
    const album = item.album_name ? `<button type="button" class="event-album-tag" data-action="filter-album" data-album-name="${escapeAttr(item.album_name)}">✦ ${escapeHTML(item.album_name)}</button>` : '';
    const visibleEmojis = [...new Set([...REACTIONS.slice(0, 3), ...reactions.keys()])].sort((a, b) => {
      const aIndex = REACTIONS.indexOf(a), bIndex = REACTIONS.indexOf(b);
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return String(a).localeCompare(String(b));
    });
    const reactButtons = visibleEmojis.map(emoji => {
      const group = reactions.get(emoji) || [];
      const mine = group.some(reaction => reaction.user_id === currentUser?.id);
      return `<span class="reaction-pill ${mine ? 'mine' : ''}"><button class="reaction-emoji" data-action="toggle-reaction" data-media-id="${escapeAttr(item.id)}" data-emoji="${escapeAttr(emoji)}" aria-label="Thả ${escapeAttr(emoji)}">${escapeHTML(emoji)}</button><button class="reaction-count" data-action="who-reacted" data-media-id="${escapeAttr(item.id)}" data-emoji="${escapeAttr(emoji)}" aria-label="Xem ai đã thả ${escapeAttr(emoji)}">${group.length}</button></span>`;
    }).join('');
    const downloadText = item.media_type === 'video' ? 'Tải video về máy' : 'Tải ảnh về máy';
    return `<article class="memory-card" style="animation-delay:${Math.min(index * 35, 280)}ms" data-media-card="${escapeAttr(item.id)}">
      <div class="media-visual media-visual-open" data-action="open-viewer" data-media-id="${escapeAttr(item.id)}" role="button" tabindex="0" aria-label="Mở ${item.media_type === 'video' ? 'video' : 'ảnh'} của ${escapeAttr(displayName(owner))}">${media}<span class="media-type-tag">${mediaLabel}</span><span class="media-open-hint" aria-hidden="true">⤢</span>${own ? `<div class="media-owner-actions"><button class="tiny-action" data-action="edit-media" data-media-id="${escapeAttr(item.id)}" aria-label="Sửa kỷ niệm" title="Chỉnh sửa">✎</button><button class="tiny-action" data-action="delete-media" data-media-id="${escapeAttr(item.id)}" aria-label="Xóa kỷ niệm" title="Xóa">⌫</button></div>` : ''}</div>
      <div class="media-card-body"><button class="media-download-button" type="button" data-action="download-media" data-media-id="${escapeAttr(item.id)}" ${item.url ? '' : 'disabled'}><span aria-hidden="true">⇩</span> ${downloadText}</button>${album}${caption}<div class="media-meta">${avatarHTML(owner)}<span class="media-owner-name" data-action="view-profile" data-user-id="${escapeAttr(item.user_id)}" role="button" tabindex="0">${escapeHTML(displayName(owner))}</span><time class="media-timestamp" datetime="${escapeAttr(iso)}" title="Thời gian chính xác: ${escapeAttr(iso)}">${timestamp}</time></div><div class="card-divider"></div><div class="reaction-row">${reactButtons}<button class="react-more" data-action="more-reactions" data-media-id="${escapeAttr(item.id)}" aria-label="Chọn thêm cảm xúc" title="Thêm cảm xúc">＋</button><button class="card-react-prompt" data-action="who-reacted" data-media-id="${escapeAttr(item.id)}" title="Xem các cảm xúc">ai thả?</button></div><div class="memory-card-footer"><button class="comment-open-button" data-action="open-comments" data-media-id="${escapeAttr(item.id)}"><span>💬 Bình luận</span><strong>${commentCounts.get(item.id) || 0}</strong></button>${!own ? `<button type="button" class="report-open-button" data-action="report-media" data-media-id="${escapeAttr(item.id)}" title="Báo cáo nội dung" aria-label="Báo cáo nội dung">⚑</button>` : ''}</div></div>
    </article>`;
  }

  function searchable(item) {
    if (!searchTerm) return true;
    const owner = profiles.find(profile => profile.id === item.user_id) || {};
    const haystack = [item.caption, item.album_name, displayName(owner), owner.nickname, owner.bio, item.media_type].join(' ').toLocaleLowerCase('vi');
    return haystack.includes(searchTerm);
  }
  function renderOnThisDay() {
    const grid = $('#onThisDayGrid');
    if (!grid) return;
    const today = new Date();
    const key = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const matches = mediaItems.filter(item => {
      const date = new Date(item.created_at);
      return !Number.isNaN(date.getTime()) && date.getFullYear() < today.getFullYear() && `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === key;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);
    const message = $('#onThisDayMessage');
    if (message) message.textContent = matches.length ? `Hôm nay, mình cùng nhớ lại ${matches.length} kỷ niệm từ những năm trước.` : 'Từ hôm nay, hãy lưu thật nhiều điều — rồi kỷ niệm cũ sẽ trở về vào đúng ngày này.';

    if (!matches.length) {
      const existingEmpty = grid.querySelector(':scope > .on-this-day-empty');
      if (existingEmpty && grid.children.length === 1) return;
      grid.innerHTML = '<div class="on-this-day-empty">💌 Chưa có kỷ niệm từ những năm trước vào ngày hôm nay. Lưu một khoảnh khắc nhé — nó có thể trở lại trong tương lai.</div>';
      return;
    }

    const existing = new Map([...grid.querySelectorAll(':scope > .on-this-day-item[data-on-day-media-card]')]
      .map(node => [node.dataset.onDayMediaCard, node]));
    const desiredNodes = matches.map(item => {
      const owner = profiles.find(profile => profile.id === item.user_id) || {};
      const preview = item.url
        ? (item.media_type === 'video' ? '<span class="media-video-placeholder on-day-video-placeholder" aria-hidden="true"><span>▶</span><small>VIDEO</small></span>' : `<img src="${escapeAttr(item.url)}" alt="" loading="lazy" decoding="async"/>`)
        : '<span>♡</span>';
      const signature = JSON.stringify([item.id, item.caption, item.url, item.media_type, item.user_id, displayName(owner), item.created_at]);
      const template = document.createElement('template');
      template.innerHTML = `<button type="button" class="on-this-day-item" data-action="open-viewer" data-media-id="${escapeAttr(item.id)}" data-on-day-media-card="${escapeAttr(item.id)}"><span class="on-this-day-thumb">${preview}</span><span class="on-this-day-item-copy"><strong>${escapeHTML(item.caption || 'Một ngày đáng nhớ')}</strong><small>${escapeHTML(displayName(owner))} · ${escapeHTML(formatDate(item.created_at, false))}</small></span></button>`;
      const fresh = template.content.firstElementChild;
      let node = existing.get(String(item.id));
      if (node) {
        existing.delete(String(item.id));
        if (node.dataset.a5OnDaySignature !== signature) {
          fresh.dataset.a5OnDaySignature = signature;
          node = fresh;
        }
      } else {
        node = fresh;
        node.dataset.a5OnDaySignature = signature;
      }
      return node;
    });
    desiredNodes.forEach((node, index) => {
      const atIndex = grid.children[index] || null;
      if (atIndex !== node) grid.insertBefore(node, atIndex);
    });
    const keep = new Set(desiredNodes);
    [...grid.children].forEach(node => { if (!keep.has(node)) node.remove(); });
  }

  // Keep existing media-card DOM nodes when realtime data changes.
  // This prevents every card's intro animation from restarting for each database event.
  function a5MediaCardContentSignature(item) {
    const owner = profiles.find(profile => profile.id === item.user_id) || item.profiles || {};
    return JSON.stringify([
      item.id, item.user_id, item.media_type, item.storage_path, item.url,
      item.caption, item.note_color, item.note_font, item.album_name, item.created_at,
      Boolean(currentUser && item.user_id === currentUser.id),
      displayName(owner), owner.nickname || '', owner.avatar_url || '', owner.profile_color || ''
    ]);
  }

  function a5BuildMediaCardNode(item, index) {
    const template = document.createElement('template');
    template.innerHTML = renderMediaCard(item, index).trim();
    return template.content.firstElementChild;
  }

  function a5PatchReactionRowInPlace(existingRow, desiredRow) {
    if (!existingRow || !desiredRow) return;
    const existingPills = [...existingRow.querySelectorAll(':scope > .reaction-pill')];
    const existingByEmoji = new Map(existingPills.map(pill => [pill.querySelector('.reaction-emoji')?.dataset.emoji || '', pill]));
    const desiredPills = [...desiredRow.querySelectorAll(':scope > .reaction-pill')];
    const nextPills = [];

    desiredPills.forEach(desiredPill => {
      const desiredEmojiButton = desiredPill.querySelector('.reaction-emoji');
      const emoji = desiredEmojiButton?.dataset.emoji || '';
      let pill = existingByEmoji.get(emoji);
      if (pill) {
        existingByEmoji.delete(emoji);
        pill.className = desiredPill.className;
        const emojiButton = pill.querySelector('.reaction-emoji');
        const countButton = pill.querySelector('.reaction-count');
        const nextEmojiButton = desiredPill.querySelector('.reaction-emoji');
        const nextCountButton = desiredPill.querySelector('.reaction-count');
        if (emojiButton && nextEmojiButton) {
          emojiButton.setAttribute('aria-label', nextEmojiButton.getAttribute('aria-label') || 'Thả cảm xúc');
          emojiButton.setAttribute('data-emoji', nextEmojiButton.dataset.emoji || '');
          if (emojiButton.textContent !== nextEmojiButton.textContent) emojiButton.textContent = nextEmojiButton.textContent;
        }
        if (countButton && nextCountButton) {
          countButton.setAttribute('aria-label', nextCountButton.getAttribute('aria-label') || 'Xem ai đã thả cảm xúc');
          if (countButton.textContent !== nextCountButton.textContent) countButton.textContent = nextCountButton.textContent;
        }
      } else {
        pill = desiredPill.cloneNode(true);
      }
      nextPills.push(pill);
    });

    // Remove only emojis that no longer exist; keep the existing buttons/listeners
    // for every unchanged emoji (especially the red heart ❤️).
    existingByEmoji.forEach(pill => pill.remove());
    const firstNonPill = existingRow.querySelector(':scope > .react-more, :scope > .card-react-prompt');
    nextPills.forEach((pill, index) => {
      const currentPills = [...existingRow.querySelectorAll(':scope > .reaction-pill')];
      const currentAtIndex = currentPills[index] || null;
      const anchor = currentAtIndex || firstNonPill;
      if (anchor !== pill) existingRow.insertBefore(pill, anchor || null);
    });
  }

  function a5PatchMediaCardLiveDetails(existing, desired, options = {}) {
    if (options.reactions !== false) {
      const oldReactionRow = existing.querySelector('.reaction-row');
      const newReactionRow = desired.querySelector('.reaction-row');
      a5PatchReactionRowInPlace(oldReactionRow, newReactionRow);
    }
    if (options.comments !== false) {
      const oldCommentCount = existing.querySelector('.memory-card-footer .comment-open-button strong');
      const newCommentCount = desired.querySelector('.memory-card-footer .comment-open-button strong');
      if (oldCommentCount && newCommentCount && oldCommentCount.textContent !== newCommentCount.textContent) {
        oldCommentCount.textContent = newCommentCount.textContent;
      }
    }
  }

  function a5PatchVisibleMediaLiveDetails(options = {}) {
    const grids = ['#homeMediaGrid', '#galleryMediaGrid', '#profileMediaGrid']
      .map(selector => $(selector)).filter(Boolean);
    const itemsById = new Map(mediaItems.map(item => [String(item.id), item]));
    grids.forEach(grid => {
      [...grid.querySelectorAll('.memory-card[data-media-card]')].forEach((existing, index) => {
        const item = itemsById.get(String(existing.dataset.mediaCard));
        if (!item) return;
        const desired = a5BuildMediaCardNode(item, index);
        a5PatchMediaCardLiveDetails(existing, desired, options);
      });
    });
  }

  function renderMediaGridInPlace(container, items) {
    if (!container) return;
    const wasRendered = container.dataset.a5GridHasRendered === 'true';
    const oldCards = [...container.children].filter(node => node.matches?.('.memory-card[data-media-card]'));
    const oldById = new Map(oldCards.map(node => [node.dataset.mediaCard, node]));
    const nextNodes = [];

    (items || []).forEach((item, index) => {
      const id = String(item.id);
      const signature = a5MediaCardContentSignature(item);
      const desired = a5BuildMediaCardNode(item, index);
      let node = oldById.get(id);

      if (node) {
        oldById.delete(id);
        if (node.dataset.a5CardContentSignature !== signature) {
          // Only the changed card is replaced (e.g. caption/photo was edited).
          // Keep its location and suppress a replay of the entrance animation.
          desired.dataset.a5CardContentSignature = signature;
          desired.classList.add('a5-card-stable');
          desired.style.animationDelay = '';
          node = desired;
        } else {
          a5PatchMediaCardLiveDetails(node, desired);
          node.classList.remove('a5-live-new-card');
          node.classList.add('a5-card-stable');
          node.dataset.a5CardContentSignature = signature;
        }
      } else {
        desired.dataset.a5CardContentSignature = signature;
        if (wasRendered) {
          // A newly arrived post may animate softly; old cards remain untouched.
          desired.classList.add('a5-live-new-card');
          desired.style.animationDelay = '';
        }
        node = desired;
      }
      nextNodes.push(node);
    });

    // Reorder existing DOM nodes rather than rebuilding the entire grid.
    nextNodes.forEach((node, index) => {
      const currentAtIndex = container.children[index] || null;
      if (currentAtIndex !== node) container.insertBefore(node, currentAtIndex);
    });
    // Remove only cards no longer in the current filtered result, plus any old
    // loading/empty child that is still inside this grid container.
    const keep = new Set(nextNodes);
    [...container.children].forEach(node => { if (!keep.has(node)) node.remove(); });
    container.dataset.a5GridHasRendered = 'true';
  }

  function renderHomeMedia() {
    let items = mediaItems.filter(searchable);
    if (homeFilter !== 'all') items = items.filter(item => item.media_type === homeFilter);
    if (homeMonthFilter !== 'all') items = items.filter(item => monthKey(item.created_at) === homeMonthFilter);
    if (homeAlbumFilter !== 'all') items = items.filter(item => item.album_name === homeAlbumFilter);
    const matchedCount = items.length;
    items = items.slice(0, 6);
    renderMediaGridInPlace($('#homeMediaGrid'), items);
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
    if (galleryAlbumFilter !== 'all') items = items.filter(item => item.album_name === galleryAlbumFilter);
    if ($('#gallerySort')?.value === 'oldest') items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderMediaGridInPlace($('#galleryMediaGrid'), items);
    $('#galleryEmpty').classList.toggle('hidden', items.length !== 0);
    $('#galleryMediaGrid').classList.toggle('hidden', items.length === 0);
    $$('[data-gallery-filter]').forEach(button => button.classList.toggle('active', button.dataset.galleryFilter === galleryFilter));
  }
  function renderPeople() {
    const query = searchTerm;
    const people = profiles.filter(profile => {
      if (!query) return true;
      return [displayName(profile), profile.nickname, profile.bio, profile.dream_job, profile.hobbies, profile.future_wishes]
        .join(' ').toLocaleLowerCase('vi').includes(query);
    });
    const tint = ['#fde9ed', '#eee8ff', '#fff2d4', '#e5f3e8', '#fce9e0'];
    $('#peopleCount').textContent = profiles.length;
    $('#heroPeopleCount').textContent = `${profiles.length} thành viên`;
    $('#heroAvatarStack').innerHTML = profiles.slice(0, 3).map((profile, index) => profile.avatar_url
      ? `<span style="padding:0;overflow:hidden;background:${tint[index % tint.length]}"><img src="${escapeAttr(profile.avatar_url)}" alt="" loading="lazy" decoding="async" fetchpriority="low" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/></span>`
      : `<span style="background:${tint[index % tint.length]}">${shortInitial(displayName(profile))}</span>`).join('') || '<span>✿</span><span>♡</span><span>☼</span>';
    $('#peopleGrid').innerHTML = people.map((profile, index) => {
      const ownMedia = mediaItems.filter(item => item.user_id === profile.id);
      const bio = profile.bio || 'đang viết tiếp câu chuyện thanh xuân...';
      const dream = profile.dream_job ? `<p class="person-dream-teaser">✨ Mơ ước: ${escapeHTML(profile.dream_job)}</p>` : '';
      const seat = classroomSeats.find(entry => entry.user_id === profile.id);
      return `<article class="person-card" data-action="view-profile" data-user-id="${escapeAttr(profile.id)}" tabindex="0" role="button" style="--person-tint:${tint[index % tint.length]};animation-delay:${Math.min(index * 30, 240)}ms"><div class="person-avatar">${profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện ${escapeAttr(displayName(profile))}" loading="lazy" decoding="async" fetchpriority="low"/>` : shortInitial(displayName(profile))}</div><h3>${escapeHTML(displayName(profile))}</h3>${officerBadgeHTML(profile.id)}<p class="person-nickname">${escapeHTML(profile.nickname ? `“${profile.nickname}”` : 'một mảnh ghép của A5')}</p><p class="person-bio">${escapeHTML(bio)}</p>${dream}${seat ? `<span class="person-seat-tag">🪑 Khu ${escapeHTML(seat.row_code)} · Bàn ${String(seat.desk_number).padStart(2, '0')} · Chỗ ${seat.seat_number}</span>` : ''}<div class="person-statline"><span>▧ <b>${ownMedia.filter(item => item.media_type === 'photo').length}</b> ảnh</span><span>▷ <b>${ownMedia.filter(item => item.media_type === 'video').length}</b> video</span></div><span class="person-view-button">Ghé thăm góc nhỏ ↗</span></article>`;
    }).join('');
    $('#peopleEmpty').classList.toggle('hidden', people.length !== 0);
    $('#peopleGrid').classList.toggle('hidden', people.length === 0);
    $('#classroomPanel')?.classList.toggle('hidden', peopleMode !== 'classroom');
    $('#peopleDirectoryPanel')?.classList.toggle('hidden', peopleMode !== 'directory');
    $$('[data-action="switch-people-mode"]').forEach(button => {
      const active = button.dataset.mode === peopleMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    renderClassroom();
    renderOfficerPanel();
  }

  const A5_OFFICER_ROLES = [
    { key: 'class_leader', label: 'Lớp trưởng', shortLabel: 'LỚP TRƯỞNG', icon: '👑', note: 'Đại diện và kết nối tập thể lớp' },
    { key: 'academic_vice', label: 'Lớp phó học tập', shortLabel: 'LP HỌC TẬP', icon: '📚', note: 'Đồng hành cùng việc học của lớp' },
    { key: 'labor_vice', label: 'Lớp phó lao động', shortLabel: 'LP LAO ĐỘNG', icon: '🌱', note: 'Phối hợp hoạt động và nề nếp' },
    { key: 'group_leader_1', label: 'Tổ trưởng tổ 1', shortLabel: 'TỔ TRƯỞNG 1', icon: '✿', note: 'Phụ trách kết nối tổ 1' },
    { key: 'group_leader_2', label: 'Tổ trưởng tổ 2', shortLabel: 'TỔ TRƯỞNG 2', icon: '✿', note: 'Phụ trách kết nối tổ 2' },
    { key: 'group_leader_3', label: 'Tổ trưởng tổ 3', shortLabel: 'TỔ TRƯỞNG 3', icon: '✿', note: 'Phụ trách kết nối tổ 3' },
    { key: 'group_leader_4', label: 'Tổ trưởng tổ 4', shortLabel: 'TỔ TRƯỞNG 4', icon: '✿', note: 'Phụ trách kết nối tổ 4' }
  ];

  function officerRoleForUser(userId) {
    if (!userId) return null;
    const assignment = classOfficerAssignments.find(item => item.user_id === userId);
    return assignment ? A5_OFFICER_ROLES.find(role => role.key === assignment.role_key) || null : null;
  }

  function officerBadgeHTML(userId, compact = false) {
    const role = officerRoleForUser(userId);
    if (!role) return '';
    return `<span class="officer-badge${compact ? ' officer-badge-compact' : ''}" title="${escapeAttr(role.label)}">${role.icon} ${escapeHTML(compact ? role.shortLabel : role.label)}</span>`;
  }

  async function loadClassOfficerAssignments() {
    officersFeatureAvailable = false;
    classOfficerAssignments = [];
    isA5SiteAdmin = false;
    if (!supabase || !currentUser) return;
    try {
      const [rowsResult, adminResult] = await Promise.all([
        supabase.from('a5_class_officers').select('role_key,user_id,assigned_at'),
        supabase.rpc('a5_is_site_admin')
      ]);
      if (rowsResult.error) throw rowsResult.error;
      if (adminResult.error) throw adminResult.error;
      classOfficerAssignments = rowsResult.data || [];
      isA5SiteAdmin = adminResult.data === true;
      officersFeatureAvailable = true;
    } catch (error) {
      // Until the separate SQL migration and owner bootstrap are completed, the rest of A5 remains usable.
      classOfficerAssignments = [];
      isA5SiteAdmin = false;
      officersFeatureAvailable = false;
      console.info('A5 officers feature is not enabled yet:', error?.message || error);
    }
    renderOfficerPanel();
  }

  function renderOfficerPanel() {
    const roster = $('#officersRoster');
    const notice = $('#officersSetupNotice');
    const adminPanel = $('#officerAdminPanel');
    if (!roster || !notice || !adminPanel) return;

    if (!officersFeatureAvailable) {
      notice.classList.remove('hidden');
      roster.innerHTML = '<div class="officers-loading">Bảng ban cán sự sẽ xuất hiện sau khi quản trị viên bật tính năng ♡</div>';
      adminPanel.classList.add('hidden');
      return;
    }

    notice.classList.add('hidden');
    roster.innerHTML = A5_OFFICER_ROLES.map(role => {
      const assignment = classOfficerAssignments.find(item => item.role_key === role.key);
      const profile = assignment?.user_id ? profiles.find(person => person.id === assignment.user_id) : null;
      const memberName = profile ? displayName(profile) : 'Chưa phân công';
      const avatar = profile?.avatar_url
        ? `<img src="${escapeAttr(profile.avatar_url)}" alt="" loading="lazy" decoding="async" fetchpriority="low"/>`
        : `<span>${profile ? shortInitial(memberName) : '♡'}</span>`;
      return `<article class="officer-roster-card"><span class="officer-role-icon" aria-hidden="true">${role.icon}</span><div class="officer-roster-copy"><small>${escapeHTML(role.label)}</small><strong>${escapeHTML(memberName)}</strong><p>${escapeHTML(role.note)}</p></div><div class="officer-roster-avatar${profile ? '' : ' is-empty'}">${avatar}</div></article>`;
    }).join('');

    adminPanel.classList.toggle('hidden', !isA5SiteAdmin);
    if (!isA5SiteAdmin) return;
    const assignmentGrid = $('#officerAssignmentGrid');
    if (!assignmentGrid) return;
    assignmentGrid.innerHTML = A5_OFFICER_ROLES.map(role => {
      const currentId = classOfficerAssignments.find(item => item.role_key === role.key)?.user_id || '';
      const options = profiles.map(profile => {
        const assignedElsewhere = classOfficerAssignments.some(item => item.role_key !== role.key && item.user_id === profile.id);
        const disabled = assignedElsewhere && profile.id !== currentId ? ' disabled' : '';
        const selected = currentId === profile.id ? ' selected' : '';
        return `<option value="${escapeAttr(profile.id)}"${selected}${disabled}>${escapeHTML(displayName(profile))}</option>`;
      }).join('');
      return `<label class="officer-assignment-row"><span><b>${role.icon} ${escapeHTML(role.label)}</b><small>${escapeHTML(role.note)}</small></span><select class="officer-role-select" data-officer-role-select="${escapeAttr(role.key)}" aria-label="Chọn ${escapeAttr(role.label)}"><option value="">— Chưa phân công —</option>${options}</select></label>`;
    }).join('');
  }

  async function saveOfficerAssignments(button) {
    if (!supabase || !currentUser) return toast('Cậu hãy đăng nhập trước nhé.', 'info');
    if (!isA5SiteAdmin) return toast('Tài khoản này không có quyền phân công ban cán sự.', 'error');
    const selects = $$('[data-officer-role-select]');
    if (selects.length !== A5_OFFICER_ROLES.length) return toast('Chưa tải đủ các vị trí. Hãy tải lại trang rồi thử lại.', 'error');
    const assignments = selects.map(select => ({ role_key: select.dataset.officerRoleSelect, user_id: select.value || null }));
    const selectedUsers = assignments.map(item => item.user_id).filter(Boolean);
    if (new Set(selectedUsers).size !== selectedUsers.length) {
      return toast('Mỗi bạn chỉ nên được phân công một chức vụ. Hãy kiểm tra lựa chọn bị trùng nha.', 'error', 5000);
    }
    if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = 'Đang lưu…'; }
    try {
      const { error } = await supabase.rpc('a5_save_class_officers', { p_assignments: assignments });
      if (error) throw error;
      await loadClassOfficerAssignments();
      renderPeople();
      toast('Đã lưu ban cán sự A5 thành công ♡', 'success');
    } catch (error) {
      console.error('Could not save class officers:', error);
      const message = error?.code === '42501'
        ? 'Tài khoản chưa được cấp quyền quản trị trong Supabase.'
        : `Chưa lưu được: ${String(error?.message || 'lỗi kết nối').slice(0, 110)}`;
      toast(message, 'error', 6000);
    } finally {
      if (button) { button.disabled = false; button.textContent = button.dataset.originalText || 'Lưu phân công ♡'; delete button.dataset.originalText; }
    }
  }

  async function loadClassroomSeats() {
    classroomFeatureAvailable = false;
    classroomSeats = [];
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase.from('classroom_seats')
        .select('seat_code,row_code,desk_number,seat_number,user_id,assigned_at')
        .order('row_code', { ascending: true }).order('desk_number', { ascending: true }).order('seat_number', { ascending: true });
      if (error) throw error;
      classroomSeats = data || [];
      classroomFeatureAvailable = classroomSeats.length > 0;
    } catch (error) {
      classroomSeats = [];
      classroomFeatureAvailable = false;
      console.warn('Classroom seats are not configured yet. Run the V3.4 migration when ready:', error?.message || error);
    }
  }

  function currentClassroomSeat() {
    return classroomSeats.find(seat => seat.user_id === currentUser?.id) || null;
  }

  function classroomSeatMarkup(seat, context = 'room') {
    const profile = seat.user_id ? profiles.find(person => person.id === seat.user_id) : null;
    const own = seat.user_id && seat.user_id === currentUser?.id;
    const occupied = Boolean(seat.user_id && !own);
    const action = context === 'picker'
      ? (occupied ? '' : (own ? 'current-seat' : 'choose-seat'))
      : (occupied ? 'view-profile' : (own ? 'current-seat' : 'choose-seat'));
    const name = profile ? displayName(profile) : (own ? 'Chỗ của cậu' : 'Còn trống');
    const avatar = profile?.avatar_url
      ? `<img src="${escapeAttr(profile.avatar_url)}" alt="" loading="lazy" decoding="async" fetchpriority="low"/>`
      : (profile ? shortInitial(name) : (own ? '♡' : '+'));
    const seatClass = `classroom-seat ${occupied ? 'is-occupied' : ''} ${own ? 'is-own-seat' : ''} ${!seat.user_id ? 'is-empty-seat' : ''} ${context === 'picker' ? 'seat-picker-choice' : ''}`;
    const label = `Khu ${seat.row_code}, bàn ${seat.desk_number}, chỗ ${seat.seat_number}: ${name}`;
    const disabled = context === 'picker' && occupied ? 'disabled' : '';
    const userData = occupied ? `data-user-id="${escapeAttr(seat.user_id)}"` : '';
    const seatData = action === 'choose-seat' || action === 'current-seat' ? `data-seat-code="${escapeAttr(seat.seat_code)}"` : '';
    return `<button type="button" class="${seatClass}" data-action="${action || 'seat-occupied'}" ${seatData} ${userData} ${disabled} aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}"><span class="classroom-seat-avatar">${avatar}</span><span class="classroom-seat-name">${escapeHTML(name)}</span><small>Chỗ ${seat.seat_number}</small></button>`;
  }

  function classroomDeskMarkup(rowCode, deskNumber, context = 'room') {
    const seats = [1, 2, 3, 4].map(number => classroomSeats.find(seat => seat.row_code === rowCode && seat.desk_number === deskNumber && seat.seat_number === number)).filter(Boolean);
    // One long horizontal table = one desk; all four students sit beside one another,
    // not as two pairs on opposite sides of a table.
    return `<article class="classroom-desk"><div class="classroom-seat-row">${seats.map(seat => classroomSeatMarkup(seat, context)).join('')}</div><div class="classroom-desk-surface"><span>✿ BÀN ${String(deskNumber).padStart(2, '0')}</span><i aria-hidden="true"></i></div></article>`;
  }

  function renderClassroom() {
    const target = $('#classroomRows');
    if (!target) return;
    if (!classroomFeatureAvailable) {
      target.innerHTML = `<div class="classroom-not-ready"><span>🛠️</span><div><strong>Sơ đồ lớp đang chờ được mở</strong><p>Cần chạy file <code>supabase/upgrade-v3.4-dream-classroom.sql</code> một lần trong Supabase SQL Editor. Việc này bổ sung các trường ước mơ và 56 chỗ ngồi; không xóa bài đăng cũ.</p></div></div>`;
      $('#classroomSeatCount').textContent = '—/56';
      return;
    }
    const occupiedCount = classroomSeats.filter(seat => seat.user_id).length;
    $('#classroomSeatCount').textContent = `${occupiedCount}/56`;
    const own = currentClassroomSeat();
    const bottomNote = $('.classroom-bottom-note p');
    if (bottomNote) bottomNote.textContent = own
      ? `Cậu đang ngồi ở Khu ${own.row_code} · Bàn ${String(own.desk_number).padStart(2, '0')} · Chỗ ${own.seat_number}. Muốn đổi chỗ thì bấm nút bên cạnh nhé ♡`
      : 'Chọn một chỗ còn trống để đặt chỗ của mình. Cậu có thể đổi chỗ sau này ♡';
    target.innerHTML = ['A', 'B'].map(rowCode => {
      const rowSeats = classroomSeats.filter(seat => seat.row_code === rowCode);
      const deskNumbers = [...new Set(rowSeats.map(seat => seat.desk_number))].sort((a, b) => a - b);
      return `<section class="classroom-aisle"><div class="classroom-aisle-heading"><span class="aisle-letter">${rowCode}</span><div><strong>Khu ${rowCode}</strong><small>7 bàn dài · 4 chỗ cùng hàng</small></div></div><div class="classroom-desk-grid">${deskNumbers.map(deskNumber => classroomDeskMarkup(rowCode, deskNumber, 'room')).join('')}</div></section>`;
    }).join('');
  }

  function renderSeatPicker() {
    const target = $('#seatPickerRows');
    if (!target) return;
    if (!classroomFeatureAvailable) {
      target.innerHTML = '<div class="classroom-not-ready"><strong>Chưa tải được sơ đồ lớp.</strong><p>Hãy thử tải lại trang hoặc liên hệ người quản lý website.</p></div>';
      return;
    }
    target.innerHTML = ['A', 'B'].map(rowCode => {
      const deskNumbers = [...new Set(classroomSeats.filter(seat => seat.row_code === rowCode).map(seat => seat.desk_number))].sort((a, b) => a - b);
      return `<section class="seat-picker-aisle"><h3>Khu ${rowCode}</h3><div class="seat-picker-desk-grid">${deskNumbers.map(deskNumber => classroomDeskMarkup(rowCode, deskNumber, 'picker')).join('')}</div></section>`;
    }).join('');
    const own = currentClassroomSeat();
    const description = $('#seatSelectionDescription');
    if (description) description.textContent = own
      ? `Cậu đang ở Khu ${own.row_code}, bàn ${own.desk_number}, chỗ ${own.seat_number}. Chọn chỗ trống khác nếu muốn đổi chỗ. Chỗ đã có bạn sẽ bị khóa.`
      : 'Chọn một chỗ còn trống trong phòng học. Mỗi chỗ chỉ dành cho một tài khoản; cậu có thể đổi chỗ sau này.';
  }

  function openSeatSelection() {
    if (!classroomFeatureAvailable) return toast('Sơ đồ phòng học chưa được thiết lập. Hãy cập nhật database V3.4 trước nhé.', 'info', 5000);
    renderSeatPicker();
    openModal('seatSelectionModal');
  }

  const NEW_MEMBER_WELCOME_PREFIX = 'a5-welcome-v35:';
  const NEW_MEMBER_WELCOME_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  function welcomeStorageKey(userId) { return `${NEW_MEMBER_WELCOME_PREFIX}${userId}`; }
  function hasSeenNewMemberWelcome(userId) {
    try { return window.localStorage.getItem(welcomeStorageKey(userId)) === '1'; }
    catch { return false; }
  }
  function markNewMemberWelcomeSeen(userId) {
    try { window.localStorage.setItem(welcomeStorageKey(userId), '1'); }
    catch (error) { console.warn('Could not save welcome-screen preference:', error?.message || error); }
  }
  function maybeShowNewMemberWelcome() {
    if (!currentUser || !currentProfile) return false;
    const createdAt = Date.parse(currentProfile.created_at || '');
    if (!Number.isFinite(createdAt)) return false;
    const profileAge = Date.now() - createdAt;
    // Existing classmates keep their familiar flow; only newly created profiles get the welcome card.
    if (profileAge < -5 * 60 * 1000 || profileAge > NEW_MEMBER_WELCOME_MAX_AGE_MS) return false;
    if (hasSeenNewMemberWelcome(currentUser.id)) return false;
    const greeting = $('#newMemberWelcomeName');
    if (greeting) greeting.textContent = displayName(currentProfile);
    markNewMemberWelcomeSeen(currentUser.id);
    openModal('newMemberWelcomeModal');
    return true;
  }
  function handleNewMemberWelcome(action) {
    closeModals();
    if (action === 'welcome-upload') {
      openUpload('photo');
      return;
    }
    if (action === 'welcome-classroom') {
      switchTab('people');
      if (!currentClassroomSeat()) window.setTimeout(openSeatSelection, 180);
      else toast('Chỗ ngồi A5 của cậu vẫn đang chờ cậu ghé thăm ♡', 'success', 3500);
      return;
    }
    if (action === 'welcome-yearbook') {
      yearbookOpened = true; yearbookSpreadIndex = 0;
      switchTab('yearbook'); renderYearbook();
      return;
    }
    if (action === 'welcome-dismiss' && !currentClassroomSeat()) {
      window.setTimeout(() => maybePromptSeatSelection(), 280);
    }
  }

  function maybePromptSeatSelection() {
    if (!classroomFeatureAvailable || !currentUser || currentClassroomSeat() || seatPromptShownForUserId === currentUser.id) return;
    seatPromptShownForUserId = currentUser.id;
    window.setTimeout(() => {
      if (currentUser && !currentClassroomSeat() && !$('#appShell').classList.contains('hidden')) openSeatSelection();
    }, 650);
  }

  function switchPeopleMode(mode) {
    peopleMode = mode === 'directory' ? 'directory' : 'classroom';
    renderPeople();
  }

  async function chooseClassroomSeat(seatCode) {
    if (!supabase || !currentUser || !classroomFeatureAvailable || seatSaving) return;
    const seat = classroomSeats.find(item => item.seat_code === seatCode);
    if (!seat) return toast('Không tìm thấy chỗ ngồi đó.', 'error');
    if (seat.user_id && seat.user_id !== currentUser.id) return toast('Chỗ này đã có bạn chọn rồi. Cậu chọn chỗ trống khác nhé.', 'info');
    const previous = currentClassroomSeat();
    if (previous?.seat_code === seatCode) { closeModals(); return toast('Đây đang là chỗ ngồi của cậu rồi ♡', 'info'); }
    if (previous && !window.confirm(`Cậu đang ngồi Khu ${previous.row_code}, bàn ${previous.desk_number}, chỗ ${previous.seat_number}. Chuyển sang chỗ mới nhé?`)) return;
    seatSaving = true;
    try {
      const { error } = await supabase.rpc('choose_classroom_seat', { p_seat_code: seatCode });
      if (error) throw error;
      await loadClassroomSeats();
      renderPeople();
      closeModals();
      toast('Đã giữ chỗ cho cậu trong phòng học A5 ♡', 'success', 4200);
    } catch (error) {
      console.error('Could not select classroom seat:', error);
      const message = String(error?.message || 'Không rõ nguyên nhân');
      if (/occupied|chosen|đã có bạn|chỗ ngồi/i.test(message)) toast('Có bạn vừa chọn chỗ đó mất rồi. Cậu thử chọn chỗ trống khác nhé.', 'info', 5000);
      else toast(`Chưa giữ được chỗ ngồi: ${message.slice(0, 110)}`, 'error', 6000);
      await loadClassroomSeats(); renderPeople(); renderSeatPicker();
    } finally { seatSaving = false; }
  }

  function renderProfile() {
    if (!currentProfile || !currentUser) return;
    const profile = currentProfile;
    const name = displayName(profile);
    $('#sidebarUser').innerHTML = `${avatarHTML(profile)}<div class="sidebar-user-info"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(profile.nickname || 'Thành viên A5')}</small></div>`;
    $('#topAvatarButton').innerHTML = profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện" loading="lazy" decoding="async" fetchpriority="low"/>` : shortInitial(name);
    $('#helloName').textContent = profile.nickname || name.split(/\s+/)[0] || 'người bạn A5';
    $('#profileLargeAvatar').innerHTML = profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện" loading="lazy" decoding="async" fetchpriority="low"/>` : shortInitial(name);
    $('#profileDisplayName').textContent = name;
    $('#profileNickname').textContent = profile.nickname ? `“${profile.nickname}”` : 'chưa có biệt danh';
    $('#profileBio').textContent = profile.bio || 'Mỗi ngày đi học là một trang trong cuốn lưu bút.';
    $('#myDreamJob').textContent = profile.dream_job || 'Chưa chia sẻ';
    $('#myDreamHobbies').textContent = profile.hobbies || 'Chưa chia sẻ';
    $('#myDreamWishes').textContent = profile.future_wishes || 'Chưa chia sẻ';
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
    renderMediaGridInPlace($('#profileMediaGrid'), mine.slice(0, 6));
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
  function yearbookIsMobile() {
    return window.matchMedia ? window.matchMedia('(max-width: 760px)').matches : window.innerWidth <= 680;
  }

  function yearbookItemsPerSpread() { return yearbookIsMobile() ? 2 : 4; }

  function renderYearbookCover() {
    const count = $('#yearbookCoverCount');
    if (count) {
      const n = Array.isArray(yearbookMediaCache) ? yearbookMediaCache.length : mediaItems.length;
      count.textContent = n
        ? `${n} kỷ niệm gần đây đang chờ được lật xem ♡`
        : 'Trang giấy đầu tiên đang chờ kỷ niệm của A5 ♡';
    }
    $('#yearbookCover')?.classList.toggle('hidden', yearbookOpened);
    $('#yearbookReading')?.classList.toggle('hidden', !yearbookOpened);
  }

  function renderYearbookPage(items, side, pageNumber, isMobile, baseIndex) {
    const pageItems = items || [];
    const content = pageItems.length ? pageItems.map((item, index) => {
      const owner = profiles.find(profile => profile.id === item.user_id) || item.profiles || {};
      const absoluteIndex = baseIndex + index;
      const tilt = [-1.6, 1.1, -0.8, 1.8, -1.2, 0.6][absoluteIndex % 6];
      const accent = ['#e9a8b9', '#eecb86', '#a8cbb5', '#b8b4e0', '#e4a78a'][absoluteIndex % 5];
      const date = formatDate(item.created_at, false);
      const event = String(item.album_name || '').trim() || 'Những ngày bình thường';
      const caption = String(item.caption || '').trim() || 'Một khoảnh khắc nhỏ, để sau này còn nhớ ♡';
      const visual = item.media_type === 'video' && item.url
        ? `<div class="yearbook-video-visual"><video src="${escapeAttr(item.url)}" muted playsinline preload="none" tabindex="-1" aria-hidden="true"></video><span class="yearbook-video-play">▶</span><span class="yearbook-video-label">VIDEO KỶ NIỆM</span></div>`
        : item.media_type !== 'video' && item.url
          ? `<img src="${escapeAttr(item.url)}" alt="Kỷ niệm của ${escapeAttr(displayName(owner))}" loading="lazy" decoding="async" fetchpriority="low"/>`
          : `<span class="yearbook-missing-visual">${item.media_type === 'video' ? '🎞️' : '📷'}<small>Không tải được bản xem trước</small></span>`;
      return `<article class="yearbook-polaroid" style="--tilt:${tilt}deg;--paper-accent:${accent}"><span class="yearbook-tape" aria-hidden="true"></span><button type="button" class="yearbook-media-button" data-action="yearbook-view-media" data-media-id="${escapeAttr(item.id)}" aria-label="Mở ${item.media_type === 'video' ? 'video' : 'ảnh'}: ${escapeAttr(caption)}">${visual}<span class="yearbook-zoom-hint" aria-hidden="true">↗</span></button><div class="yearbook-polaroid-copy"><span class="yearbook-date-note">${escapeHTML(date)}</span><strong class="yearbook-event-note">${escapeHTML(event)}</strong><p>${escapeHTML(caption)}</p><small class="yearbook-signed">— ${escapeHTML(displayName(owner))}</small></div></article>`;
    }).join('') : `<div class="yearbook-page-empty"><span>✿</span><strong>Chỗ này còn để trống nè</strong><p>Khi A5 đăng thêm kỷ niệm, những tấm ảnh mới sẽ được dán vào đây.</p></div>`;
    return `<section class="yearbook-page yearbook-page-${side}${isMobile ? ' yearbook-page-single' : ''}" aria-label="Trang ${pageNumber}"><div class="yearbook-page-topline"><span>✿ A5 · NHỮNG ĐIỀU MÌNH MUỐN NHỚ</span><span>${String(pageNumber).padStart(2, '0')}</span></div><div class="yearbook-page-items">${content}</div><div class="yearbook-page-footer"><span>ghi lại để một ngày mỉm cười ♡</span><span>${pageNumber}</span></div></section>`;
  }

  function renderYearbook() {
    const renderGeneration = ++yearbookRenderGeneration;
    renderYearbookCover();
    if (!yearbookOpened) return;
    const spread = $('#yearbookSpread');
    if (!Array.isArray(yearbookMediaCache)) {
      if (spread) spread.innerHTML = `<div class="yearbook-loading-page"><span>✿</span><strong>${yearbookLoading ? 'Đang gom kỷ niệm của cả lớp...' : 'Sắp mở cuốn lưu bút...'}</strong><p>Ảnh/video không bị sao chép hay di chuyển; cuốn sổ chỉ sắp xếp lại những kỷ niệm đã đăng.</p></div>`;
      $('#yearbookSpreadTitle').textContent = 'Đang chuẩn bị cuốn sổ';
      $('#yearbookPageInfo').textContent = '✿';
      if ($('#yearbookPrev')) $('#yearbookPrev').disabled = true;
      if ($('#yearbookNext')) $('#yearbookNext').disabled = true;
      return;
    }
    const isMobile = yearbookIsMobile();
    const perSpread = yearbookItemsPerSpread();
    // Read like a printed book: older memories appear first, recent ones toward the back.
    const chronological = [...yearbookMediaCache].sort((a, b) => {
      const dateDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return dateDiff || String(a.id).localeCompare(String(b.id));
    });
    const totalSpreads = Math.max(1, Math.ceil(chronological.length / perSpread));
    yearbookSpreadIndex = Math.max(0, Math.min(yearbookSpreadIndex, totalSpreads - 1));
    const start = yearbookSpreadIndex * perSpread;
    const leftRaw = chronological.slice(start, start + 2);
    const rightRaw = isMobile ? [] : chronological.slice(start + 2, start + 4);
    const visibleRaw = [...leftRaw, ...rightRaw];
    const itemsWithUrls = visibleRaw.map(item => ({ ...item, url: yearbookSignedUrls.has(item.id) ? (yearbookSignedUrls.get(item.id) || '') : (item.url || '') }));
    const leftItems = itemsWithUrls.slice(0, 2);
    const rightItems = isMobile ? [] : itemsWithUrls.slice(2, 4);
    const pageLeft = isMobile ? yearbookSpreadIndex + 1 : yearbookSpreadIndex * 2 + 1;
    const pageRight = pageLeft + 1;
    if (spread) {
      spread.className = `yearbook-spread${isMobile ? ' is-mobile' : ''}`;
      spread.innerHTML = renderYearbookPage(leftItems, 'left', pageLeft, isMobile, start) + (isMobile ? '' : renderYearbookPage(rightItems, 'right', pageRight, false, start + 2));
    }
    const countText = chronological.length ? `${chronological.length} kỷ niệm · xếp từ cũ đến mới` : 'Chưa có kỷ niệm để dán vào sổ';
    $('#yearbookSpreadTitle').textContent = yearbookSpreadIndex === 0 ? 'Những ngày đầu tiên' : `Những trang tiếp theo · ${countText}`;
    $('#yearbookPageInfo').textContent = isMobile
      ? `Trang ${yearbookSpreadIndex + 1} / ${totalSpreads}`
      : `Trang ${pageLeft}–${pageRight} / ${Math.max(2, totalSpreads * 2)}`;
    const prev = $('#yearbookPrev'), next = $('#yearbookNext');
    if (prev) prev.disabled = yearbookTurning || yearbookSpreadIndex <= 0;
    if (next) next.disabled = yearbookTurning || yearbookSpreadIndex >= totalSpreads - 1;
    const footer = $('.yearbook-reading-footer');
    if (footer) footer.innerHTML = `<span>✿ ${escapeHTML(countText)}</span><span>${isMobile ? 'Chạm ảnh để xem lớn · dùng mũi tên để lật trang' : 'Nhấp ảnh để xem lớn · dùng mũi tên để lật trang'} ♡</span>`;

    // Make signed URLs only for the visible spread, rather than downloading/signing every file at once.
    const unresolved = visibleRaw.filter(item => item.storage_path && !yearbookSignedUrls.has(item.id));
    if (unresolved.length && supabase) {
      Promise.all(unresolved.map(async item => [item.id, await resolveSignedUrl(MEDIA_BUCKET, item.storage_path)]))
        .then(results => {
          if (renderGeneration !== yearbookRenderGeneration || !yearbookOpened) return;
          results.forEach(([id, url]) => yearbookSignedUrls.set(id, url || ''));
          if (!yearbookTurning) renderYearbook();
        })
        .catch(error => console.warn('Yearbook media URLs could not be prepared:', error));
    }
  }

  async function loadYearbookData() {
    if (!supabase || !currentUser || yearbookLoading || Array.isArray(yearbookMediaCache)) return;
    yearbookLoading = true;
    const requestGeneration = ++yearbookLoadGeneration;
    renderYearbook();
    const pageSize = 200;
    const maxItems = 5000;
    let offset = 0;
    const allItems = [];
    try {
      while (offset < maxItems) {
        const end = Math.min(offset + pageSize - 1, maxItems - 1);
        const { data, error } = await supabase.from('media_items')
          .select('id,user_id,media_type,storage_path,caption,note_color,note_font,album_name,created_at,updated_at')
          .order('created_at', { ascending: false }).order('id', { ascending: false })
          .range(offset, end);
        if (error) throw error;
        const rows = data || [];
        allItems.push(...rows);
        if (rows.length < pageSize) break;
        offset += rows.length;
      }
      if (requestGeneration !== yearbookLoadGeneration) return;
      yearbookMediaCache = allItems;
      if (allItems.length >= maxItems) toast('Cuốn kỷ yếu đang hiển thị 5.000 kỷ niệm gần đây nhất để giữ trang chạy mượt.', 'info', 6000);
    } catch (error) {
      if (requestGeneration !== yearbookLoadGeneration) return;
      console.error('Yearbook load failed:', error);
      yearbookMediaCache = [...mediaItems];
      toast('Chưa tải được toàn bộ cuốn kỷ yếu; tạm dùng những kỷ niệm đã có trong album.', 'error', 6000);
    } finally {
      if (requestGeneration === yearbookLoadGeneration) {
        yearbookLoading = false;
        renderYearbook();
      }
    }
  }

  function turnYearbookPage(direction) {
    if (!yearbookOpened || yearbookTurning) return;
    const totalSpreads = Math.max(1, Math.ceil(mediaItems.length / yearbookItemsPerSpread()));
    const nextIndex = yearbookSpreadIndex + direction;
    if (nextIndex < 0 || nextIndex >= totalSpreads) return;
    yearbookTurning = true;
    const spread = $('#yearbookSpread');
    const animationClass = direction > 0 ? 'turn-forward' : 'turn-backward';
    spread?.classList.remove('turn-forward', 'turn-backward');
    spread?.classList.add(animationClass);
    window.setTimeout(() => {
      yearbookSpreadIndex = nextIndex;
      renderYearbook();
      const currentSpread = $('#yearbookSpread');
      if (currentSpread) {
        currentSpread.classList.remove('turn-forward', 'turn-backward');
        void currentSpread.offsetWidth;
        currentSpread.classList.add(animationClass);
      }
      window.setTimeout(() => {
        $('#yearbookSpread')?.classList.remove('turn-forward', 'turn-backward');
        yearbookTurning = false;
        renderYearbook();
      }, 650);
    }, 170);
  }

  function renderAll() {
    populateMonthFilters();
    // The home view is the first screen. Avoid building up to 200 gallery cards and
    // every member card before the user opens those sections; switchTab renders them on demand.
    renderProfile();
    renderHomeMedia();
    if (activeTab === 'gallery') renderGallery();
    if (activeTab === 'people') renderPeople();
    renderOnThisDay();
    renderNotificationBadge();
    renderYearbook();
    updateActiveTab();
    if (activeTab === 'yearbook' && yearbookOpened && !Array.isArray(yearbookMediaCache) && !yearbookLoading) void loadYearbookData();
  }
  function switchTab(tab) {
    if (!['home', 'gallery', 'yearbook', 'people', 'profile'].includes(tab)) return;
    if (activeTab === 'yearbook' && tab !== 'yearbook' && a5YearbookPendingLiveUpdate) {
      yearbookLoadGeneration += 1; yearbookLoading = false; yearbookMediaCache = null; yearbookSignedUrls.clear(); yearbookRenderGeneration += 1;
      a5YearbookPendingLiveUpdate = false;
    }
    activeTab = tab;
    updateActiveTab();
    if (tab === 'gallery') renderGallery();
    if (tab === 'yearbook') { renderYearbook(); if (yearbookOpened) void loadYearbookData(); }
    if (tab === 'people') renderPeople();
    if (tab === 'profile') renderProfile();
    const reduceMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function updateActiveTab() {
    const names = { home: 'Trang chủ', gallery: 'Album kỷ niệm', yearbook: 'Cuốn kỷ yếu', people: 'Thành viên A5', profile: 'Góc của tớ' };
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
    const viewerVideo = $('#viewerMediaContent video'); if (viewerVideo) { viewerVideo.pause(); viewerVideo.removeAttribute('src'); viewerVideo.load(); }
    if ($('#viewerMediaContent')) $('#viewerMediaContent').innerHTML = '';
    activeViewerMediaId = null;
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
    $('#uploadAlbumName').value = '';
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
    const item = findMediaItem(mediaId);
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
    const albumName = String($('#uploadAlbumName')?.value || '').trim().slice(0, 60);
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
          caption, note_color: noteColor, note_font: noteFont, album_name: albumName || null
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

  async function exportPersonalBackup() {
    if (!supabase || !currentUser) return toast('Đăng nhập để sao lưu kỷ niệm nhé.', 'info');
    if (backupBusy) return;
    backupBusy = true;
    const button = $('#exportBackupButton');
    const status = $('#backupStatus');
    if (button) { button.disabled = true; button.textContent = 'Đang chuẩn bị ZIP…'; }
    if (status) status.textContent = 'Đang gom bài đăng và tải tệp vào bản sao lưu. Giữ trang mở nhé.';
    try {
      const JSZip = await ensureJSZip();
      let allMedia = [];
      for (let start = 0; ; start += 300) {
        const { data, error } = await supabase.from('media_items')
          .select('id,media_type,storage_path,caption,note_color,note_font,album_name,created_at,updated_at')
          .eq('user_id', currentUser.id).order('created_at', { ascending: true }).range(start, start + 299);
        if (error) throw error;
        const page = data || [];
        allMedia.push(...page);
        if (page.length < 300) break;
        if (allMedia.length >= 2000) throw new Error('Có quá nhiều bài để gom vào một ZIP trên trình duyệt. Hãy sao lưu theo đợt nhỏ hơn.');
      }
      const zip = new JSZip();
      const manifest = {
        format: 'a5-personal-backup', version: 1, created_at: new Date().toISOString(),
        profile: { display_name: currentProfile?.display_name || '', nickname: currentProfile?.nickname || '', bio: currentProfile?.bio || '', dream_job: currentProfile?.dream_job || '', hobbies: currentProfile?.hobbies || '', future_wishes: currentProfile?.future_wishes || '', profile_color: safeColor(currentProfile?.profile_color) },
        avatar_archive_path: null, media: []
      };
      const backupFolder = zip.folder('media');
      let totalBytes = 0;
      for (let i = 0; i < allMedia.length; i++) {
        const item = allMedia[i];
        if (status) status.textContent = `Đang sao lưu tệp ${i + 1}/${allMedia.length}…`;
        const { data: signed, error: signedError } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(item.storage_path, 300);
        if (signedError || !signed?.signedUrl) throw signedError || new Error('Không tạo được liên kết tải tệp.');
        const response = await fetch(signed.signedUrl);
        if (!response.ok) throw new Error(`Không tải được tệp số ${i + 1} (${response.status}).`);
        const blob = await response.blob();
        totalBytes += blob.size;
        if (totalBytes > 250 * 1024 * 1024) throw new Error('Bản sao lưu vượt 250 MB; hãy sao lưu từng đợt hoặc tải riêng các tệp lớn.');
        const originalFilename = safeFileName(item.storage_path.split('/').pop() || `memory-${i + 1}`);
        const archivePath = `media/${String(i + 1).padStart(4, '0')}-${originalFilename}`;
        backupFolder.file(archivePath.split('/').slice(1).join('/'), blob, { compression: 'STORE' });
        manifest.media.push({ source_id: item.id, media_type: item.media_type, caption: item.caption || '', note_color: safeColor(item.note_color), note_font: safeFont(item.note_font), album_name: item.album_name || '', created_at: item.created_at, filename: originalFilename, mime_type: blob.type || (item.media_type === 'video' ? 'video/mp4' : 'image/jpeg'), archive_path: archivePath });
      }
      if (currentProfile?.avatar_path) {
        const { data: signedAvatar, error: avatarError } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(currentProfile.avatar_path, 300);
        if (!avatarError && signedAvatar?.signedUrl) {
          const avatarResponse = await fetch(signedAvatar.signedUrl);
          if (avatarResponse.ok) {
            const avatarBlob = await avatarResponse.blob();
            if (totalBytes + avatarBlob.size <= 250 * 1024 * 1024) {
              zip.file('profile/avatar', avatarBlob, { compression: 'STORE' });
              manifest.avatar_archive_path = 'profile/avatar'; manifest.avatar_mime_type = avatarBlob.type || 'image/jpeg';
            }
          }
        }
      }
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('README.txt', `A5 personal memory backup v1\nIncludes the owner profile fields and the media posts/assets owned by the account that created this backup. Comments/reactions and other members' posts are not part of this personal backup. Restore only when you intend to add copies of your own missing media. Keep this ZIP private.`);
      if (status) status.textContent = 'Đang nén ZIP…';
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, meta => {
        if (status) status.textContent = `Đang tạo ZIP: ${Math.round(meta.percent)}%`;
      });
      saveBlob(blob, `A5-sao-luu-ca-nhan-${new Date().toISOString().slice(0, 10)}.zip`);
      if (status) status.textContent = `Đã tạo bản sao lưu gồm ${allMedia.length} bài đăng. Hãy cất ZIP ở nơi an toàn.`;
      toast(`Đã tạo bản sao lưu ${allMedia.length} bài đăng ♡`, 'success', 5000);
    } catch (error) {
      console.error('Personal backup failed:', error);
      if (status) status.textContent = `Chưa tạo được bản sao lưu: ${error?.message || 'Lỗi không xác định'}`;
      toast(`Sao lưu chưa thành công: ${(error?.message || '').slice(0, 130)}`, 'error', 6500);
    } finally {
      backupBusy = false;
      if (button) { button.disabled = false; button.textContent = '⬇ Tải bản sao lưu'; }
    }
  }

  async function restorePersonalBackup(file) {
    if (!supabase || !currentUser || !file) return;
    if (backupBusy) return;
    backupBusy = true;
    const button = $('#chooseRestoreBackupButton');
    const status = $('#backupStatus');
    if (button) { button.disabled = true; button.textContent = 'Đang kiểm tra ZIP…'; }
    try {
      const JSZip = await ensureJSZip();
      const zip = await JSZip.loadAsync(file);
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) throw new Error('ZIP không có manifest.json nên không phải bản sao lưu A5 hợp lệ.');
      const manifest = JSON.parse(await manifestFile.async('string'));
      if (manifest.format !== 'a5-personal-backup' || manifest.version !== 1 || !Array.isArray(manifest.media)) throw new Error('Định dạng bản sao lưu không được hỗ trợ.');
      if (manifest.media.length > 500) throw new Error('Bản này có quá nhiều bài đăng để khôi phục an toàn trong một lần.');
      if (!window.confirm(`Bản ZIP có ${manifest.media.length} bài đăng thuộc bản sao lưu cá nhân. Khôi phục sẽ TẠO CÁC BẢN SAO MỚI, không dò tìm trùng lặp; chỉ tiếp tục nếu cậu muốn phục hồi những bài bị mất. Tiếp tục?`)) return;
      let restored = 0; const errors = [];
      for (let i = 0; i < manifest.media.length; i++) {
        const entry = manifest.media[i];
        const fileEntry = typeof entry.archive_path === 'string' ? zip.file(entry.archive_path) : null;
        if (!fileEntry || !['photo', 'video'].includes(entry.media_type)) { errors.push(`${i + 1}: tệp trong ZIP không hợp lệ`); continue; }
        try {
          if (!String(entry.archive_path).startsWith('media/') || String(entry.archive_path).includes('..')) throw new Error('Đường dẫn tệp trong ZIP không hợp lệ.');
          const blob = await fileEntry.async('blob');
          const mime = String(entry.mime_type || blob.type || (entry.media_type === 'video' ? 'video/mp4' : 'image/jpeg'));
          const allowedTypes = entry.media_type === 'video' ? VIDEO_TYPES : PHOTO_TYPES;
          const maxBytes = entry.media_type === 'video' ? VIDEO_MAX : PHOTO_MAX;
          if (!allowedTypes.includes(mime)) throw new Error('Loại tệp không được hỗ trợ trong bản sao lưu.');
          if (blob.size <= 0 || blob.size > maxBytes) throw new Error(`Tệp vượt giới hạn ${humanBytes(maxBytes)} hoặc bị trống.`);
          const filename = safeFileName(entry.filename || `restore-${i + 1}`);
          const path = `${currentUser.id}/restore-${Date.now()}-${uniqueId()}-${filename}`;
          const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { cacheControl: '3600', upsert: false, contentType: mime });
          if (uploadError) throw uploadError;
          const payload = { user_id: currentUser.id, media_type: entry.media_type, storage_path: path, caption: String(entry.caption || '').slice(0, 500), note_color: safeColor(entry.note_color), note_font: safeFont(entry.note_font), album_name: String(entry.album_name || '').slice(0, 60) || null };
          if (entry.created_at && !Number.isNaN(new Date(entry.created_at).getTime())) payload.created_at = new Date(entry.created_at).toISOString();
          const { error: insertError } = await supabase.from('media_items').insert(payload);
          if (insertError) { await supabase.storage.from(MEDIA_BUCKET).remove([path]); throw insertError; }
          restored++;
        } catch (error) { errors.push(`${i + 1}: ${String(error?.message || 'khôi phục thất bại').slice(0, 90)}`); }
        if (status) status.textContent = `Đã khôi phục ${restored}/${manifest.media.length} bài…`;
      }
      if (manifest.profile && currentProfile) {
        const patch = { display_name: String(manifest.profile.display_name || currentProfile.display_name).slice(0, 40), nickname: String(manifest.profile.nickname || '').slice(0, 32), bio: String(manifest.profile.bio || '').slice(0, 180), dream_job: String(manifest.profile.dream_job || '').slice(0, 100), hobbies: String(manifest.profile.hobbies || '').slice(0, 160), future_wishes: String(manifest.profile.future_wishes || '').slice(0, 200), profile_color: safeColor(manifest.profile.profile_color) };
        if (manifest.avatar_archive_path && zip.file(manifest.avatar_archive_path)) {
          try {
            const avatarBlob = await zip.file(manifest.avatar_archive_path).async('blob');
            if (avatarBlob.size <= AVATAR_MAX) {
              const avatarPath = `${currentUser.id}/restore-${Date.now()}-${uniqueId()}-avatar`;
              const { error: avatarUploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(avatarPath, avatarBlob, { upsert: false, contentType: manifest.avatar_mime_type || avatarBlob.type || 'image/jpeg' });
              if (!avatarUploadError) patch.avatar_path = avatarPath;
            }
          } catch (error) { console.warn('Could not restore profile avatar:', error); }
        }
        const { error: profileError } = await supabase.from('profiles').update(patch).eq('id', currentUser.id);
        if (profileError) errors.push(`Hồ sơ: ${profileError.message}`);
      }
      signedUrlCache.clear(); await loadData(false);
      if (status) status.textContent = `Khôi phục xong ${restored}/${manifest.media.length} bài.${errors.length ? ` Có ${errors.length} mục cần kiểm tra.` : ''}`;
      toast(`Khôi phục ${restored}/${manifest.media.length} bài đăng. ${errors.length ? 'Một số mục gặp lỗi; xem phần trạng thái trong hồ sơ.' : 'Hoàn tất ♡'}`, errors.length ? 'info' : 'success', 6500);
    } catch (error) {
      console.error('Restore personal backup failed:', error);
      if (status) status.textContent = `Không khôi phục được ZIP: ${error?.message || 'Lỗi không xác định'}`;
      toast(`Không khôi phục được ZIP: ${(error?.message || '').slice(0, 130)}`, 'error', 6500);
    } finally {
      backupBusy = false;
      if (button) { button.disabled = false; button.textContent = '↻ Khôi phục từ ZIP'; }
      if ($('#restoreBackupFile')) $('#restoreBackupFile').value = '';
    }
  }

  function openProfileEditor() {
    if (!currentProfile) return;
    selectedAvatarFile = null;
    $('#displayNameInput').value = currentProfile.display_name || '';
    $('#nicknameInput').value = currentProfile.nickname || '';
    $('#bioInput').value = currentProfile.bio || '';
    $('#dreamJobInput').value = currentProfile.dream_job || '';
    $('#dreamHobbiesInput').value = currentProfile.hobbies || '';
    $('#futureWishesInput').value = currentProfile.future_wishes || '';
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
    const dream_job = $('#dreamJobInput').value.trim();
    const hobbies = $('#dreamHobbiesInput').value.trim();
    const future_wishes = $('#futureWishesInput').value.trim();
    const profile_color = safeColor($('#profileColorInput').value);
    if (display_name.length < 1) return toast('Tên hiển thị không được để trống.', 'error');
    if (display_name.length > 40 || nickname.length > 32 || bio.length > 180 || dream_job.length > 100 || hobbies.length > 160 || future_wishes.length > 200) return toast('Một trong các mục đã vượt quá số ký tự cho phép.', 'error');
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
      const { data, error } = await supabase.from('profiles').update({ display_name, nickname, bio, dream_job, hobbies, future_wishes, profile_color, avatar_path: avatarPath }).eq('id', currentUser.id).select('id,display_name,nickname,bio,dream_job,hobbies,future_wishes,avatar_path,profile_color,linked_providers,created_at,updated_at').single();
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
    $('#editMediaAlbum').value = item.album_name || '';
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
      caption: $('#editMediaCaption').value.trim(), album_name: String($('#editMediaAlbum').value || '').trim().slice(0, 60) || null, note_color: safeColor($('#editMediaColor').value), note_font: safeFont($('#editMediaFont').value)
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
    const item = findMediaItem(mediaId);
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

  async function refreshComments(mediaId, fromRealtime = false) {
    if (!supabase || !currentUser || !commentsEnabled) return;
    try {
      const { data, error } = await supabase.from('media_comments')
        .select('id,media_id,user_id,body,created_at,updated_at,profiles(id,display_name,nickname,avatar_path)')
        .eq('media_id', mediaId).order('created_at', { ascending: true }).limit(300);
      if (error) throw error;
      const item = findMediaItem(mediaId);
      const canModerate = item?.user_id === currentUser.id;
      const rows = data || [];
      commentCounts.set(mediaId, rows.length);
      $('#commentsList').innerHTML = rows.length ? rows.map(comment => {
        const profile = profiles.find(person => person.id === comment.user_id) || comment.profiles || {};
        const ownComment = comment.user_id === currentUser.id;
        const canDelete = ownComment || canModerate;
        return `<article class="comment-row" data-comment-row="${escapeAttr(comment.id)}"><div class="comment-avatar">${avatarHTML(profile, 'avatar')}</div><div class="comment-bubble"><div class="comment-topline"><strong>${escapeHTML(displayName(profile))}${ownComment ? ' <span class="comment-me">· cậu</span>' : ''}</strong><time title="${escapeAttr(new Date(comment.created_at).toISOString())}">${escapeHTML(formatDate(comment.created_at, true))}</time></div><p>${escapeHTML(comment.body)}</p>${ownComment || canDelete ? `<div class="comment-actions">${ownComment ? `<button type="button" data-action="edit-comment" data-comment-id="${escapeAttr(comment.id)}">Sửa</button>` : ''}${canDelete ? `<button type="button" data-action="delete-comment" data-comment-id="${escapeAttr(comment.id)}">Xóa</button>` : ''}</div>` : ''}</div></article>`;
      }).join('') : '<div class="comments-empty"><span>💌</span><strong>Chưa có bình luận nào</strong><p>Hãy để lại lời nhắn đầu tiên cho kỷ niệm này nhé.</p></div>';
      if (!fromRealtime) { renderHomeMedia(); renderGallery(); renderProfile(); }
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
      if (!editingId) void dispatchA5ActivityPush(mediaId, 'comment');
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

  function openMediaViewer(mediaId) {
    const item = findMediaItem(mediaId);
    if (!item) return toast('Không tìm thấy kỷ niệm này.', 'error');
    if (!item.url) return toast('Chưa tải được tệp xem trước. Hãy tải lại album rồi thử lại.', 'error');
    activeViewerMediaId = mediaId;
    const owner = profiles.find(profile => profile.id === item.user_id) || item.profiles || {};
    const content = $('#viewerMediaContent');
    content.innerHTML = item.media_type === 'video'
      ? `<video src="${escapeAttr(item.url)}" controls autoplay playsinline preload="metadata" aria-label="Video kỷ niệm"></video>`
      : `<img src="${escapeAttr(item.url)}" alt="Kỷ niệm của ${escapeAttr(displayName(owner))}" decoding="async" fetchpriority="high"/>`;
    $('#viewerTitle').textContent = item.album_name || (item.media_type === 'video' ? 'Một đoạn video của A5' : 'Một mảnh thanh xuân');
    $('#viewerCaption').textContent = item.caption || 'Một khoảnh khắc được lưu lại ♡';
    $('#viewerMeta').textContent = `${displayName(owner)} · ${formatDate(item.created_at, true)}${item.album_name ? ` · Album: ${item.album_name}` : ''}`;
    $('#viewerDownloadButton').dataset.mediaId = item.id;
    $('#viewerDownloadButton').disabled = !item.url;
    $('#viewerCommentsButton').dataset.mediaId = item.id;
    openModal('mediaViewerModal');
    const video = content.querySelector('video');
    if (video) video.play().catch(() => {});
  }
  function openReportModal(mediaId) {
    const item = findMediaItem(mediaId);
    if (!item) return toast('Không tìm thấy nội dung cần báo cáo.', 'error');
    if (item.user_id === currentUser?.id) return toast('Cậu không cần báo cáo bài đăng của chính mình.', 'info');
    $('#reportMediaId').value = mediaId;
    $('#reportReason').value = '';
    $('#reportDetails').value = '';
    openModal('reportMediaModal');
  }
  async function submitMediaReport(event) {
    event.preventDefault();
    if (!supabase || !currentUser) return toast('Đăng nhập để gửi báo cáo nhé.', 'info');
    const mediaId = $('#reportMediaId').value;
    const item = mediaItems.find(entry => entry.id === mediaId);
    if (!item || item.user_id === currentUser.id) return toast('Nội dung báo cáo không hợp lệ.', 'error');
    const reason = $('#reportReason').value;
    if (!reason) return toast('Chọn lý do báo cáo trước nhé.', 'error');
    const button = $('#submitReportButton'); button.disabled = true;
    try {
      const { error } = await supabase.from('media_reports').insert({ media_id: mediaId, reporter_id: currentUser.id, reason, details: $('#reportDetails').value.trim().slice(0, 500) || null });
      if (error) throw error;
      closeModals(); toast('Đã gửi báo cáo để quản trị viên xem xét. Bài đăng chưa tự động bị xóa.', 'success', 5000);
    } catch (error) {
      console.error('Media report failed:', error);
      toast(`Chưa gửi được báo cáo. Quản trị viên cần chạy migration V3: ${(error?.message || '').slice(0, 90)}`, 'error', 6000);
    } finally { button.disabled = false; }
  }
  async function markAllNotificationsRead() {
    if (!supabase || !currentUser || !notificationsEnabled) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from('notifications').update({ read_at: now }).eq('user_id', currentUser.id).is('read_at', null);
    if (error) return toast('Chưa đánh dấu được thông báo đã đọc.', 'error');
    notificationItems = notificationItems.map(item => ({ ...item, read_at: item.read_at || now }));
    renderNotificationBadge(); renderNotificationsList(); toast('Đã đánh dấu tất cả thông báo đã đọc.', 'success');
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
    const lockKey = `${mediaId}::${emoji}`;
    if (a5ReactionMutationLocks.has(lockKey)) return;
    a5ReactionMutationLocks.add(lockKey);
    const normalizedEmoji = normalizeReactionEmoji(emoji);
    const foundRows = reactionItems.filter(reaction => reaction.media_id === mediaId && reaction.user_id === currentUser.id && normalizeReactionEmoji(reaction.emoji) === normalizedEmoji);
    const addingReaction = foundRows.length === 0;
    try {
      if (foundRows.length) {
        const foundIds = foundRows.map(reaction => reaction.id).filter(Boolean);
        const { error } = await supabase.from('reactions').delete().eq('user_id', currentUser.id).in('id', foundIds);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({ media_id: mediaId, user_id: currentUser.id, emoji: normalizedEmoji });
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      }
      // Refresh reaction data only, then patch the counts/selected state in place.
      // Never call renderAll() here: it causes unrelated sections to rebuild and
      // was racing the Realtime listener, making the ❤️ state appear to revert.
      let reactionStateApplied = false;
      try { reactionStateApplied = await loadReactions(); }
      catch (syncError) { console.warn('Reaction saved; display will reconcile on next live event:', syncError?.message || syncError); }
      // If this query lost a race to a newer refresh, let that refresh patch the UI
      // instead of briefly applying stale ❤️ state.
      if (reactionStateApplied) a5PatchVisibleMediaLiveDetails({ reactions: true, comments: false });
      if (addingReaction) void dispatchA5ActivityPush(mediaId, 'reaction');
    } catch (error) {
      console.error('Reaction error:', error);
      toast('Chưa gửi được cảm xúc. Cậu thử lại nhé.', 'error');
    } finally {
      a5ReactionMutationLocks.delete(lockKey);
    }
  }
  function openReactions(mediaId, emojiFilter = '') {
    const item = findMediaItem(mediaId);
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
    $('#publicProfileAvatar').innerHTML = profile.avatar_url ? `<img src="${escapeAttr(profile.avatar_url)}" alt="Ảnh đại diện" loading="lazy" decoding="async" fetchpriority="low"/>` : shortInitial(displayName(profile));
    $('#publicProfileCover').style.background = `linear-gradient(115deg, ${safeColor(profile.profile_color || '#f6dce5')}, #fff0de 70%, #ece5ff)`;
    $('#publicProfileName').textContent = displayName(profile);
    $('#publicProfileNickname').textContent = profile.nickname ? `“${profile.nickname}”` : 'một mảnh ghép của A5';
    $('#publicProfileBio').textContent = profile.bio || 'đang viết tiếp câu chuyện thanh xuân...';
    $('#publicDreamJob').textContent = profile.dream_job || 'Chưa chia sẻ';
    $('#publicDreamHobbies').textContent = profile.hobbies || 'Chưa chia sẻ';
    $('#publicFutureWishes').textContent = profile.future_wishes || 'Chưa chia sẻ';
    $('#publicDreamCard').classList.toggle('public-dream-empty', !profile.dream_job && !profile.hobbies && !profile.future_wishes);
    $('#publicPhotoCount').textContent = own.filter(item => item.media_type === 'photo').length;
    $('#publicVideoCount').textContent = own.filter(item => item.media_type === 'video').length;
    $('#publicMemberSince').textContent = formatMonth(profile.created_at);
    const providers = new Set(profile.linked_providers || []);
    $('#publicProviders').innerHTML = `<span class="provider-chip ${providers.has('google') ? 'connected' : ''}">${providers.has('google') ? '✓ ' : ''}Google ${providers.has('google') ? 'đã liên kết' : 'chưa liên kết'}</span><span class="provider-chip ${providers.has('facebook') ? 'connected' : ''}">${providers.has('facebook') ? '✓ ' : ''}Facebook ${providers.has('facebook') ? 'đã liên kết' : 'chưa liên kết'}</span>`;
    const photos = own.slice(0, 8);
    $('#publicProfilePhotos').innerHTML = photos.map(item => item.url ? (item.media_type === 'video' ? `<button type="button" class="public-profile-photo video-thumb" data-action="open-viewer" data-media-id="${escapeAttr(item.id)}" aria-label="Mở video kỷ niệm"><span class="media-video-placeholder" aria-hidden="true"><span>▶</span><small>VIDEO</small></span></button>` : `<button type="button" class="public-profile-photo" data-action="open-viewer" data-media-id="${escapeAttr(item.id)}" aria-label="Mở ảnh kỷ niệm"><img src="${escapeAttr(item.url)}" alt="Kỷ niệm" loading="lazy" decoding="async"/></button>`) : '<div class="public-profile-photo">✿</div>').join('');
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
    renderMusicTrackList();
    if (window.matchMedia) {
      const bookBreakpoint = window.matchMedia('(max-width: 760px)');
      const handleBookBreakpoint = () => { if (activeTab === 'yearbook' && yearbookOpened) renderYearbook(); };
      if (typeof bookBreakpoint.addEventListener === 'function') bookBreakpoint.addEventListener('change', handleBookBreakpoint);
      else if (typeof bookBreakpoint.addListener === 'function') bookBreakpoint.addListener(handleBookBreakpoint);
    }
    $('#yearbookSpread')?.addEventListener('touchstart', event => {
      if (!yearbookOpened || event.touches.length !== 1) return;
      const touch = event.touches[0];
      yearbookTouchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    $('#yearbookSpread')?.addEventListener('touchend', event => {
      if (!yearbookTouchStart || !yearbookOpened) { yearbookTouchStart = null; return; }
      const touch = event.changedTouches?.[0];
      if (!touch) { yearbookTouchStart = null; return; }
      const dx = touch.clientX - yearbookTouchStart.x;
      const dy = touch.clientY - yearbookTouchStart.y;
      yearbookTouchStart = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) turnYearbookPage(dx < 0 ? 1 : -1);
    }, { passive: true });
    $('#googleLogin')?.addEventListener('click', () => signIn('google'));
    $('#facebookLogin')?.addEventListener('click', () => signIn('facebook'));
    $('#logoutButton')?.addEventListener('click', signOut);
    $('#topAvatarButton')?.addEventListener('click', () => switchTab('profile'));
    $('#topUploadButton')?.addEventListener('click', () => openUpload('photo'));
    $('#reportMediaForm')?.addEventListener('submit', submitMediaReport);
    $('#restoreBackupFile')?.addEventListener('change', event => { const file = event.target.files?.[0]; if (file) restorePersonalBackup(file); });
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
    $('#homeAlbumFilter')?.addEventListener('change', event => { homeAlbumFilter = event.target.value || 'all'; renderHomeMedia(); });
    $('#galleryAlbumFilter')?.addEventListener('change', event => { galleryAlbumFilter = event.target.value || 'all'; renderGallery(); });
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
      if (action === 'install-app') await installA5App();
      else if (action === 'enable-push-notifications') await enableA5PushNotifications();
      else if (action === 'disable-push-notifications') await disableA5PushNotifications(false);
      else if (action === 'test-push-notification') await testA5PushNotification();
      else if (action === 'toggle-music-panel') toggleMusicPanel();
      else if (action === 'toggle-music-compact') toggleMusicCompact();
      else if (action === 'close-music-player') closeMusicPanel(true);
      else if (action === 'select-music-track') playMusicTrack(actionButton.dataset.musicTrack);
      else if (action === 'welcome-upload' || action === 'welcome-classroom' || action === 'welcome-yearbook' || action === 'welcome-dismiss') handleNewMemberWelcome(action);
      else if (action === 'switch-people-mode') switchPeopleMode(actionButton.dataset.mode);
      else if (action === 'save-officer-assignments') await saveOfficerAssignments(actionButton);
      else if (action === 'open-seat-picker') openSeatSelection();
      else if (action === 'dismiss-seat-selection') { seatPromptShownForUserId = currentUser?.id || seatPromptShownForUserId; closeModals(); }
      else if (action === 'choose-seat') await chooseClassroomSeat(actionButton.dataset.seatCode);
      else if (action === 'current-seat') toast('Cậu đang ngồi ở chỗ này rồi nè ♡', 'info');
      else if (action === 'seat-occupied') toast('Chỗ này đã có bạn ngồi rồi nha.', 'info');
      else if (action === 'upload-photo') openUpload('photo');
      else if (action === 'upload-video') openUpload('video');
      else if (action === 'open-yearbook') { yearbookOpened = true; yearbookSpreadIndex = 0; switchTab('yearbook'); renderYearbook(); }
      else if (action === 'close-yearbook') { yearbookOpened = false; yearbookTurning = false; renderYearbook(); }
      else if (action === 'yearbook-next') turnYearbookPage(1);
      else if (action === 'yearbook-prev') turnYearbookPage(-1);
      else if (action === 'yearbook-view-media') openMediaViewer(actionButton.dataset.mediaId);
      else if (action === 'edit-profile') openProfileEditor();
      else if (action === 'close-modal') closeModals();
      else if (action === 'edit-media') openEditMedia(actionButton.dataset.mediaId);
      else if (action === 'delete-media') askDeleteMedia(actionButton.dataset.mediaId);
      else if (action === 'toggle-reaction') await toggleReaction(actionButton.dataset.mediaId, actionButton.dataset.emoji);
      else if (action === 'more-reactions') openReactionPicker(actionButton.dataset.mediaId);
      else if (action === 'pick-reaction') { await toggleReaction(actionButton.dataset.mediaId, actionButton.dataset.emoji); closeModals(); }
      else if (action === 'who-reacted') openReactions(actionButton.dataset.mediaId, actionButton.dataset.emoji || '');
      else if (action === 'download-media') await downloadMedia(actionButton.dataset.mediaId, actionButton);
      else if (action === 'open-viewer') openMediaViewer(actionButton.dataset.mediaId);
      else if (action === 'report-media') openReportModal(actionButton.dataset.mediaId);
      else if (action === 'open-notifications') await openNotifications();
      else if (action === 'open-notification') await openNotification(actionButton.dataset.notificationId, actionButton.dataset.mediaId, actionButton.dataset.notificationType);
      else if (action === 'mark-all-notifications-read') await markAllNotificationsRead();
      else if (action === 'export-backup') await exportPersonalBackup();
      else if (action === 'choose-restore-backup') $('#restoreBackupFile')?.click();
      else if (action === 'open-report-info') openModal('reportInfoModal');
      else if (action === 'filter-album') { const album = actionButton.dataset.albumName || 'all'; homeAlbumFilter = album; galleryAlbumFilter = album; $('#homeAlbumFilter').value = [...mediaItems].some(item => item.album_name === album) ? album : 'all'; $('#galleryAlbumFilter').value = [...mediaItems].some(item => item.album_name === album) ? album : 'all'; closeModals(); switchTab('gallery'); renderGallery(); }
      else if (action === 'open-comments') { if (actionButton.id === 'viewerCommentsButton') closeModals(); await openComments(actionButton.dataset.mediaId); }
      else if (action === 'edit-comment') beginEditComment(actionButton.dataset.commentId);
      else if (action === 'delete-comment') await deleteComment(actionButton.dataset.commentId);
      else if (action === 'preview-profile') openPublicProfile(currentUser?.id);
      else if (action === 'view-profile') openPublicProfile(actionButton.dataset.userId);
      else if (action === 'link-google') await linkProvider('google');
      else if (action === 'link-facebook') await linkProvider('facebook');
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModals();
        if (!$('#a5MusicPanel')?.classList.contains('hidden')) closeMusicPanel(true);
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action="view-profile"][role="button"]')) {
        event.preventDefault(); openPublicProfile(event.target.dataset.userId);
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action="open-viewer"][role="button"]')) {
        event.preventDefault(); openMediaViewer(event.target.dataset.mediaId);
      }
      if (activeTab === 'yearbook' && yearbookOpened && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const tag = event.target?.tagName;
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
          if (event.key === 'ArrowRight') { event.preventDefault(); turnYearbookPage(1); }
          else if (event.key === 'ArrowLeft') { event.preventDefault(); turnYearbookPage(-1); }
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); $('#globalSearch')?.focus();
      }
    });
    $$('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      if (modal.id === 'newMemberWelcomeModal') handleNewMemberWelcome('welcome-dismiss');
      else closeModals();
    }));
    $('#confirmModal')?.addEventListener('click', event => { if (event.target.id === 'confirmModal') closeModals(); });
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
