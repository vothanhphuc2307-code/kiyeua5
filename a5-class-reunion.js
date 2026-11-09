/* A5 Class Reunion 3D Studio v2.0 — 45 names from the supplied 12A05 roster.
   Interactive 3D Chibi Figurines, 3D Turntable Showcase, 3D Orbit/Riser stage modes,
   and 3D Companion Badges for the Friends directory.
   No birth dates, photos, or private data are stored in this static class portrait. */
(function (window, document) {
  'use strict';
  if (window.A5ClassReunion) return;

  const roster = [
    { name: 'Phạm Gia Anh', gender: 'Nam' },
    { name: 'Phạm Gia Bảo', gender: 'Nam' },
    { name: 'Trần Lê Gia Bảo', gender: 'Nam' },
    { name: 'Nguyễn Bảo Châu', gender: 'Nữ' },
    { name: 'Phạm Mỹ Duyên', gender: 'Nữ' },
    { name: 'Nguyễn Hải Dương', gender: 'Nam' },
    { name: 'Vũ Thùy Dương', gender: 'Nữ' },
    { name: 'Bùi Bá Đại', gender: 'Nam' },
    { name: 'Trần Nguyễn Linh Đan', gender: 'Nữ' },
    { name: 'Lê Huy Đạt', gender: 'Nam' },
    { name: 'Trịnh Minh Đăng', gender: 'Nam' },
    { name: 'Hoàng Minh Đức', gender: 'Nam' },
    { name: 'Nguyễn Việt Đức', gender: 'Nam' },
    { name: 'Nguyễn Lê Duy Hải', gender: 'Nam' },
    { name: 'Vũ Trọng Hiếu', gender: 'Nam' },
    { name: 'Đỗ Mạnh Hoàng', gender: 'Nam' },
    { name: 'Hồ Minh Hoàng', gender: 'Nam' },
    { name: 'Nguyễn Văn Tuấn Hùng', gender: 'Nam' },
    { name: 'Dũ Quang Huy', gender: 'Nam' },
    { name: 'Nguyễn Thị Huyền', gender: 'Nữ' },
    { name: 'Nguyễn Phùng Khánh Hưng', gender: 'Nam' },
    { name: 'Trần Gia Hưng', gender: 'Nam' },
    { name: 'Dương Hiền Long', gender: 'Nam' },
    { name: 'Nguyễn Hoàng Long', gender: 'Nam' },
    { name: 'Đỗ Bảo Ngân', gender: 'Nữ' },
    { name: 'Nguyễn Thanh Ngân', gender: 'Nữ' },
    { name: 'Nguyễn Xuân Nghi', gender: 'Nữ' },
    { name: 'Ngô Thị Yến Nhi', gender: 'Nữ' },
    { name: 'Nguyễn Ngọc Yến Nhi', gender: 'Nữ' },
    { name: 'Lê Hoàng Phú', gender: 'Nam' },
    { name: 'Nguyễn Gia Phúc', gender: 'Nam' },
    { name: 'Võ Thành Phúc', gender: 'Nam' },
    { name: 'Trương Khắc Quân', gender: 'Nam' },
    { name: 'Võ Thị Như Quỳnh', gender: 'Nữ' },
    { name: 'Đỗ Phương Thảo', gender: 'Nữ' },
    { name: 'Nguyễn Đình Bảo Thiên', gender: 'Nam' },
    { name: 'Lê Anh Thư', gender: 'Nữ' },
    { name: 'Lê Minh Trang', gender: 'Nữ' },
    { name: 'Võ Văn Tráng', gender: 'Nam' },
    { name: 'Phạm Đình Tùng', gender: 'Nam' },
    { name: 'Nguyễn Đỗ Hạ Vân', gender: 'Nữ' },
    { name: 'Nguyễn Lê Tường Vi', gender: 'Nữ' },
    { name: 'Hoàng Văn Vũ', gender: 'Nam' },
    { name: 'Đặng Nguyên Hải Yến', gender: 'Nữ' },
    { name: 'Nguyễn Hải Yến', gender: 'Nữ' }
  ];

  const outfitPalettes = [
    { main: '#eb9eb8', deep: '#b85d80', trim: '#fff4f7', badge: '#ffdbe7' },
    { main: '#9b96d9', deep: '#645ca8', trim: '#f4f2ff', badge: '#e3dfff' },
    { main: '#e6ba7e', deep: '#af7c3d', trim: '#fffaf0', badge: '#ffefd2' },
    { main: '#82b8b0', deep: '#49827a', trim: '#f0fbf9', badge: '#d6f2ee' },
    { main: '#d896cf', deep: '#9c5493', trim: '#fdf4fc', badge: '#f5dcf2' },
    { main: '#7ea5d4', deep: '#496fa1', trim: '#f2f7ff', badge: '#dbeaff' },
    { main: '#e69f87', deep: '#b0644b', trim: '#fff6f2', badge: '#ffe2d8' },
    { main: '#93bd86', deep: '#5a874d', trim: '#f4fbf2', badge: '#dff2d8' },
    { main: '#c293c7', deep: '#86568b', trim: '#fbf4fc', badge: '#f0ddf2' }
  ];

  const hairPalettes = [
    { top: '#6d4c41', mid: '#3e2723', dark: '#241614' },
    { top: '#5d4754', mid: '#362730', dark: '#1f161c' },
    { top: '#7a5244', mid: '#4a2f26', dark: '#2a1a15' },
    { top: '#4f435a', mid: '#2d2536', dark: '#191420' },
    { top: '#685044', mid: '#3d2e27', dark: '#221915' }
  ];

  const greetings = [
    '“Cảm ơn vì đã cùng tớ đi qua những năm tháng rực rỡ nhất của 12A5!” ♡',
    '“Sau này họp lớp nhớ gọi tên tớ đầu tiên nha!” ✨',
    '“Chúc cậu luôn mỉm cười thật tươi như nắng sân trường mình!” 🌸',
    '“Thanh xuân đẹp nhất là vì có 45 mảnh ghép của A5 ở đây.” 🌷',
    '“Mãi nhớ những giờ ra chơi đầy ắp tiếng cười của lớp mình!” 🎶',
    '“Dù đi đâu thật xa, 12A5 vẫn luôn là nhà của chúng mình nhé!” 💌'
  ];

  const accessoryLabels = [
    'Huy hiệu Sao A5 ✦',
    'Kính tròn thư sinh 👓',
    'Tai nghe Giai điệu 🎧',
    'Kẹp hoa Anh đào 🌸',
    'Mầm cây Thanh xuân 🌱',
    'Máy ảnh Kỷ niệm 📸'
  ];

  const hairCuts = {
    boy: [
      // 0: Fluffy Korean two-block curtain bangs
      '<path d="M27 50C25 27 37 14 50 14c15 0 25 12 23 35-4-6-8-11-11-15-3 6-8 10-13 11 1-4 1-7 0-10-6 7-13 11-22 15z" fill="url(#HAIR)"/><path d="M33 27c6-7 16-9 25-6" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.2" stroke-linecap="round"/>',
      // 1: Sporty tousled spikes
      '<path d="M27 49c-3-19 7-35 23-36 3-3 7-3 9 1 12 2 20 13 18 35-5-4-8-8-10-13-4 7-13 11-22 12 2-3 2-6 1-8-6 5-12 7-19 9z" fill="url(#HAIR)"/><path d="m35 28 9-7 9 2" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2.1" stroke-linecap="round"/>',
      // 2: Soft side-swept fringe
      '<path d="M26 50c-1-22 10-36 24-36 16 0 25 13 22 36-4-5-7-9-9-15-8 8-19 12-37 15z" fill="url(#HAIR)"/><path d="M33 26c6-7 14-10 23-8" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.2" stroke-linecap="round"/>',
      // 3: Warm wavy bangs with ahoge
      '<path d="M49 15c2-6 8-8 11-4-4 1-6 3-7 6z" fill="url(#HAIR)"/><path d="M27 50c-2-20 8-35 23-35 15 0 24 12 22 34-6-4-10-9-12-16-5 7-15 13-33 17z" fill="url(#HAIR)"/><path d="m31 35 7-11 8 2" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2" stroke-linecap="round"/>',
      // 4: Neat scholar part
      '<path d="M27 49C26 27 37 15 51 15c15 0 24 12 22 34-6-7-11-14-14-19-5 9-16 15-32 19z" fill="url(#HAIR)"/><path d="M35 25c7-5 15-6 22-3" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>'
    ],
    girl: [
      // 0: Sweet airy bangs + side locks
      '<path d="M28 46c-2-18 8-31 22-31s24 13 22 31c-6-8-13-13-22-13s-16 5-22 13z" fill="url(#HAIR)"/><path d="M28 42c-2 12-1 24 3 32 2-7 2-17 1-27zM72 42c2 12 1 24-3 32-2-7-2-17-1-27z" fill="url(#HAIR)"/><path d="M35 26c6-6 15-8 24-5" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="2.2" stroke-linecap="round"/>',
      // 1: Side-parted idol bangs with ribbon bow
      '<path d="M28 46c-1-19 9-31 23-31 15 0 24 12 21 31-5-8-13-13-21-13-8 0-15 5-23 13z" fill="url(#HAIR)"/><circle cx="67" cy="27" r="4.2" fill="#ff8fab"/><path d="M63 24q-5-3-4 3 4 2 4-3zM71 24q5-3 4 3-4 2-4-3z" fill="#ffb3c6"/><path d="M35 25c6-5 14-7 22-5" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>',
      // 2: High ponytail + soft hime cut
      '<path d="M64 18q15-7 17 9-9 4-17-9z" fill="url(#HAIR)"/><path d="M28 45c-1-17 8-30 22-30 15 0 24 12 22 30-7-7-13-11-21-11-8 0-15 4-23 11z" fill="url(#HAIR)"/><circle cx="64" cy="20" r="3.6" fill="#ffd166"/><path d="M34 26c7-6 16-7 24-4" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>',
      // 3: Twin-bun / space-bun cute silhouette
      '<circle cx="31" cy="21" r="7.5" fill="url(#HAIR)"/><circle cx="69" cy="21" r="7.5" fill="url(#HAIR)"/><circle cx="33" cy="23" r="2.2" fill="#ffc2d1"/><circle cx="67" cy="23" r="2.2" fill="#ffc2d1"/><path d="M28 46c-2-18 8-30 22-30s24 12 22 30c-7-8-14-12-22-12s-15 4-22 12z" fill="url(#HAIR)"/><path d="M36 26c6-5 14-6 22-4" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>',
      // 4: Wavy bob with pearl clip
      '<path d="M28 46c-2-18 8-31 22-31 15 0 24 13 22 31-6-8-13-12-22-12-8 0-15 4-22 12z" fill="url(#HAIR)"/><rect x="61" y="31" width="8" height="3.2" rx="1.6" transform="rotate(-14 61 31)" fill="#fff5d6" stroke="#e2b96b" stroke-width=".6"/><path d="M35 25c6-5 15-7 23-4" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>'
    ]
  };

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalise = (value) => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

  let activeGender = 'all';
  let activeStageView = 'grid'; // 'grid' | 'orbit' | 'risers'
  let selectedIndex = 0;
  let activePose = 'wave'; // 'wave' | 'jump' | 'photo'
  let turntableAngle = 0;
  let autoSpin = false;
  let spinFrame = 0;
  let syncedProfiles = [];
  let openProfileCallback = null;

  function matchProfileForMember(member) {
    if (!syncedProfiles.length || !member) return null;
    const target = normalise(member.name);
    const lastToken = target.split(/\s+/).slice(-2).join(' ');
    return syncedProfiles.find((p) => {
      const disp = normalise(p.display_name || '');
      const nick = normalise(p.nickname || '');
      if (!disp && !nick) return false;
      if (disp === target || nick === target) return true;
      if (disp.length >= 5 && (target.endsWith(disp) || disp.endsWith(target))) return true;
      return lastToken.length >= 5 && disp.endsWith(lastToken);
    }) || null;
  }

  function matchRosterIndexForProfile(profile, fallbackIndex = 0) {
    if (!profile) return fallbackIndex % roster.length;
    const disp = normalise(profile.display_name || '');
    const nick = normalise(profile.nickname || '');
    if (disp || nick) {
      const idx = roster.findIndex((m) => {
        const rName = normalise(m.name);
        return (disp && (rName === disp || rName.endsWith(disp) || disp.endsWith(rName))) ||
               (nick && rName === nick);
      });
      if (idx >= 0) return idx;
    }
    return fallbackIndex % roster.length;
  }

  function accessoryMarkup(index, girl) {
    const kind = index % 6;
    if (kind === 1) {
      // Cute round glasses
      return `<g class="a5-fig-glasses" stroke="#7c5669" stroke-width="1.45" fill="rgba(255,255,255,.22)">
        <circle cx="42.5" cy="48.5" r="5.6"/>
        <circle cx="57.5" cy="48.5" r="5.6"/>
        <path d="M48.1 48.5h3.8M31 47l5.9 1M69 47l-5.9 1" fill="none" stroke-linecap="round"/>
      </g>`;
    }
    if (kind === 2) {
      // Pastel neck headphones
      return `<g class="a5-fig-headphones">
        <path d="M34 74c3 5 29 5 32 0" fill="none" stroke="#8a7bc8" stroke-width="3.2" stroke-linecap="round"/>
        <ellipse cx="36" cy="76" rx="5.2" ry="3.8" transform="rotate(-14 36 76)" fill="#b8aef0" stroke="#fff" stroke-width="1"/>
        <ellipse cx="64" cy="76" rx="5.2" ry="3.8" transform="rotate(14 64 76)" fill="#b8aef0" stroke="#fff" stroke-width="1"/>
      </g>`;
    }
    if (kind === 3) {
      // Sakura flower hairpin
      return `<g class="a5-fig-sakura" transform="translate(${girl ? 33 : 64}, 27)">
        <circle cx="0" cy="-3.2" r="2.5" fill="#ffb3c6"/>
        <circle cx="3.1" cy="-1" r="2.5" fill="#ffc2d1"/>
        <circle cx="1.9" cy="2.6" r="2.5" fill="#ffb3c6"/>
        <circle cx="-1.9" cy="2.6" r="2.5" fill="#ffc2d1"/>
        <circle cx="-3.1" cy="-1" r="2.5" fill="#ffb3c6"/>
        <circle cx="0" cy="0" r="1.7" fill="#ffe066"/>
      </g>`;
    }
    if (kind === 4) {
      // Cute youth clover sprout on top
      return `<g class="a5-fig-sprout" transform="translate(50, 13)">
        <path d="M0 4V-3" stroke="#5da36b" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="-3.5" cy="-4" rx="3.8" ry="2.2" transform="rotate(-24 -3.5 -4)" fill="#80ed99"/>
        <ellipse cx="3.5" cy="-4" rx="3.8" ry="2.2" transform="rotate(24 3.5 -4)" fill="#57cc99"/>
      </g>`;
    }
    if (kind === 5) {
      // Mini keepsake camera strap
      return `<g class="a5-fig-camera">
        <path d="M36 78 55 99M64 78 49 99" stroke="#6c5868" stroke-width="1.5" stroke-opacity=".65"/>
        <rect x="44" y="94" width="13" height="9.5" rx="2.5" fill="#4f4356" stroke="#fff" stroke-width="1"/>
        <circle cx="50.5" cy="98.8" r="3" fill="#9ad1d4" stroke="#fff" stroke-width=".9"/>
        <circle cx="54.8" cy="96.2" r=".9" fill="#ff8fab"/>
      </g>`;
    }
    // Default 0: Star crest pin
    return `<g class="a5-fig-starpin" transform="translate(61, 88)">
      <circle cx="0" cy="0" r="4.2" fill="#fff3b0" stroke="#e09f3e" stroke-width=".9"/>
      <text x="0" y="1.8" text-anchor="middle" font-size="5.6" font-weight="900" fill="#b56576">★</text>
    </g>`;
  }

  function avatarSVG(member, index, opts = {}) {
    const palette = outfitPalettes[index % outfitPalettes.length];
    const hair = hairPalettes[(index * 3 + 1) % hairPalettes.length];
    const girl = member.gender === 'Nữ';
    const hairList = hairCuts[girl ? 'girl' : 'boy'];
    const hairMarkup = hairList[index % hairList.length];
    const uid = `${opts.prefix || 'm'}-${index}`;
    const skinId = `skin-${uid}`;
    const shirtId = `shirt-${uid}`;
    const hairId = `hair-${uid}`;
    const baseId = `base-${uid}`;
    const numLabel = String(index + 1).padStart(2, '0');

    const girlBackHair = girl
      ? `<path d="M30 39C23 33 25 22 32 18c-4 15 1 26 4 31l2 32q-4 9-9 1c-5-19-4-32 1-43z" fill="url(#${hairId})"/>
         <path d="M70 39c7-6 5-17-2-21 4 15-1 26-4 31l-2 32q4 9 9 1c5-19 4-32-1-43z" fill="url(#${hairId})"/>`
      : '';

    const collarAndTie = girl
      ? `<path d="M38 78 50 87 62 78" fill="none" stroke="${palette.trim}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="M46 86l-4 7 8-3 8 3-4-7z" fill="#ff758f"/>
         <circle cx="50" cy="86" r="2.6" fill="#ffb3c6"/>`
      : `<path d="M39 78 50 87 61 78" fill="none" stroke="${palette.trim}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="M48.2 86h3.6l1.2 13-3 3.4-3-3.4z" fill="${palette.deep}"/>`;

    const bottomWear = girl
      ? `<path d="M31 105h38l3 9c-13 3-29 3-44 0z" fill="#5e4b66"/>
         <path d="M37 105v9M46 105v10M54 105v10M63 105v9" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>`
      : `<path d="M35 107h13l-1 15H35zM52 107h13l-1 15H52z" fill="#53465c"/>`;

    const legsForGirl = girl
      ? `<path d="M38 113h7v9h-7zM55 113h7v9h-7z" fill="url(#${skinId})"/>
         <path d="M38 117h7v5h-7zM55 117h7v5h-7z" fill="#fff5f8"/>`
      : '';

    return `<svg class="a5-avatar-model" viewBox="0 0 100 136" role="img" aria-label="Mô hình 3D ${escapeHTML(member.name)} (${girl ? 'nữ' : 'nam'})">
      <defs>
        <linearGradient id="${skinId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffe6d4"/>
          <stop offset=".55" stop-color="#f5c4a8"/>
          <stop offset="1" stop-color="#df9f82"/>
        </linearGradient>
        <linearGradient id="${shirtId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette.trim}"/>
          <stop offset=".28" stop-color="${palette.main}"/>
          <stop offset="1" stop-color="${palette.deep}"/>
        </linearGradient>
        <linearGradient id="${hairId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${hair.top}"/>
          <stop offset=".5" stop-color="${hair.mid}"/>
          <stop offset="1" stop-color="${hair.dark}"/>
        </linearGradient>
        <linearGradient id="${baseId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
          <stop offset=".55" stop-color="${palette.badge}" stop-opacity=".9"/>
          <stop offset="1" stop-color="#d8bfd4" stop-opacity=".85"/>
        </linearGradient>
      </defs>

      <!-- 3D Acrylic Standee Pedestal -->
      <g class="a5-fig-pedestal">
        <ellipse cx="50" cy="129" rx="31" ry="5.5" fill="#4a3548" opacity=".18"/>
        <ellipse cx="50" cy="126.5" rx="28" ry="5.2" fill="${palette.deep}" opacity=".35"/>
        <ellipse cx="50" cy="124.8" rx="28" ry="5" fill="url(#${baseId})" stroke="#ffffff" stroke-width="1.2"/>
        <ellipse cx="50" cy="124.2" rx="22" ry="3.2" fill="none" stroke="${palette.main}" stroke-opacity=".45" stroke-dasharray="3 2" stroke-width=".9"/>
      </g>

      <!-- Full Chibi Body Group -->
      <g class="a5-fig-body">
        ${legsForGirl}
        ${bottomWear}
        <!-- Sneakers / Mary Janes -->
        <path d="M33 121h14v4.2H31q0-3.2 2-4.2zM53 121h14q2 1 2 4.2H53z" fill="#fff8f6" stroke="${palette.deep}" stroke-opacity=".45" stroke-width=".9"/>
        <!-- Arms (left & waving right arm) -->
        <g class="a5-fig-arm-left">
          <path d="M28 86 20 101q-1 4 3 5l8-12" fill="none" stroke="url(#${skinId})" stroke-width="5.4" stroke-linecap="round"/>
          <circle cx="20.5" cy="102.5" r="3.2" fill="url(#${skinId})"/>
        </g>
        <g class="a5-fig-arm-right">
          <path d="M72 86 80 99q1 4-3 5l-8-12" fill="none" stroke="url(#${skinId})" stroke-width="5.4" stroke-linecap="round"/>
          <circle cx="79.5" cy="100.5" r="3.2" fill="url(#${skinId})"/>
        </g>
        <!-- Uniform Jacket / Cardigan -->
        <path d="M26 86c3-7 10-10 17-11h14c8 1 14 4 17 11l2 21c-8 4-17 5.5-26 5.5S32 111 24 107z" fill="url(#${shirtId})" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>
        <!-- Neck -->
        <path d="M44 76h12l-1 8-5 5-5-5z" fill="url(#${skinId})"/>
        ${collarAndTie}
        <!-- A5 Pocket Badge -->
        <rect x="34" y="90" width="9" height="6.5" rx="2" fill="#fff" fill-opacity=".86"/>
        <text x="38.5" y="95" text-anchor="middle" font-size="4.6" font-weight="900" fill="${palette.deep}">A5</text>
      </g>

      <!-- Chibi Head Group (with 3D shading & expressive eyes) -->
      <g class="a5-fig-head">
        <ellipse cx="29.5" cy="52" rx="4.6" ry="6.8" fill="#ebb496"/>
        <ellipse cx="70.5" cy="52" rx="4.6" ry="6.8" fill="#dfa485"/>
        <g>${girlBackHair}</g>
        <!-- Head Sphere -->
        <ellipse cx="50" cy="48.5" rx="20.2" ry="24.5" fill="url(#${skinId})"/>
        <!-- 3D Specular Cheek/Forehead Highlight -->
        <ellipse cx="42" cy="34" rx="9" ry="4.5" transform="rotate(-12 42 34)" fill="#fff" opacity=".28"/>
        <!-- Expressive Anime/Chibi Eyes -->
        <g class="a5-fig-eyes">
          <ellipse cx="41.8" cy="49" rx="3.1" ry="3.7" fill="#3a2834"/>
          <ellipse cx="58.2" cy="49" rx="3.1" ry="3.7" fill="#3a2834"/>
          <circle cx="40.8" cy="47.6" r="1.25" fill="#fff"/>
          <circle cx="57.2" cy="47.6" r="1.25" fill="#fff"/>
          <circle cx="42.9" cy="50.4" r=".65" fill="#fff" opacity=".85"/>
          <circle cx="59.3" cy="50.4" r=".65" fill="#fff" opacity=".85"/>
        </g>
        <!-- Eyebrows -->
        <path d="M37.5 42.2q4-2.8 8.2 0M54.3 42.2q4.2-2.8 8.2 0" fill="none" stroke="#5d4037" stroke-width="1.4" stroke-linecap="round"/>
        <!-- Rosy Blush Cheeks -->
        <ellipse cx="36.2" cy="54.8" rx="3.8" ry="2" fill="#ff8fab" opacity=".52"/>
        <ellipse cx="63.8" cy="54.8" rx="3.8" ry="2" fill="#ff8fab" opacity=".52"/>
        <!-- Tiny Nose & Cheerful Smile -->
        <path d="M49.5 52.2q.8 1.2 1.6 0" fill="none" stroke="#c98a74" stroke-width="1.2" stroke-linecap="round"/>
        <path class="a5-fig-mouth" d="M45.8 58.2q4.2 4.4 8.4 0" fill="none" stroke="#a85763" stroke-width="1.75" stroke-linecap="round"/>
        <!-- Layered Hair + Specular Shine -->
        <g>${hairMarkup.replace(/url\(#HAIR\)/g, `url(#${hairId})`)}</g>
        ${accessoryMarkup(index, girl)}
      </g>

      <!-- Floating Sparkles & Pedestal Number Plate -->
      <circle class="a5-fig-spark-a" cx="22" cy="36" r="1.8" fill="#fff" opacity=".75"/>
      <circle class="a5-fig-spark-b" cx="79" cy="40" r="1.5" fill="#ffe5ec" opacity=".8"/>
      <g transform="translate(50, 126.5)">
        <rect x="-10" y="-4.5" width="20" height="7.5" rx="3.7" fill="#fff" stroke="${palette.main}" stroke-width=".9"/>
        <text x="0" y="1.2" text-anchor="middle" font-size="5.2" font-weight="900" fill="${palette.deep}">#${numLabel}</text>
      </g>
    </svg>`;
  }

  function miniFigurineForProfile(profile, fallbackIndex = 0) {
    const rosterIdx = matchRosterIndexForProfile(profile, fallbackIndex);
    const member = roster[rosterIdx] || { name: profile?.display_name || 'Bạn A5', gender: 'Nữ' };
    const palette = outfitPalettes[rosterIdx % outfitPalettes.length];
    return `<div class="a5-person-3d-companion" style="--companion-tint:${palette.main}" title="Mô hình 3D của ${escapeHTML(member.name)} · nhấn nút bên dưới để ngắm trong phòng 3D">
      <div class="a5-person-3d-mini-stage">${avatarSVG(member, rosterIdx, { prefix: 'dir' })}</div>
      <span class="a5-person-3d-tag" data-action="open-3d-friend" data-classmate-index="${rosterIdx}" role="button" tabindex="0" aria-label="Xem mô hình 3D của ${escapeHTML(member.name)}">✨ 3D #${String(rosterIdx + 1).padStart(2, '0')}</span>
    </div>`;
  }

  function ensureStudioControls(panel) {
    const toolbar = panel.querySelector('.a5-gathering-toolbar');
    if (toolbar && !toolbar.querySelector('.a5-stage-view-modes')) {
      const viewSwitch = document.createElement('div');
      viewSwitch.className = 'a5-stage-view-modes';
      viewSwitch.setAttribute('role', 'group');
      viewSwitch.setAttribute('aria-label', 'Chế độ sân khấu 3D');
      viewSwitch.innerHTML = `
        <button type="button" class="a5-stage-view-btn active" data-a5-stage-view="grid" title="Lưới Standee 3D">🧊 Standee 3D</button>
        <button type="button" class="a5-stage-view-btn" data-a5-stage-view="orbit" title="Vòng xoay Vũ trụ 3D">🎠 Vũ trụ 3D</button>
        <button type="button" class="a5-stage-view-btn" data-a5-stage-view="risers" title="Bậc thang Kỷ yếu 3D">📸 Bậc thang</button>
        <button type="button" class="a5-stage-view-btn a5-stage-random-btn" data-a5-action="random-classmate" title="Chọn ngẫu nhiên 1 người bạn">🎲 Ngẫu nhiên</button>
      `;
      toolbar.appendChild(viewSwitch);
    }

    const spotlight = document.getElementById('a5ClassmateSpotlight');
    if (spotlight && !spotlight.dataset.a5StudioUpgraded) {
      spotlight.dataset.a5StudioUpgraded = 'true';
      spotlight.className = 'a5-classmate-spotlight a5-3d-turntable-studio has-selection';
      spotlight.innerHTML = `
        <div class="a5-turntable-stage-wrap">
          <div class="a5-turntable-viewport" id="a5TurntableViewport" title="Kéo trái/phải để xoay mô hình 3D">
            <div class="a5-turntable-halo" aria-hidden="true"></div>
            <div class="a5-turntable-speech" id="a5TurntableSpeech">Chào cậu nha! ♡</div>
            <div class="a5-turntable-figure pose-wave" id="a5TurntableFigure"></div>
            <div class="a5-turntable-ring" aria-hidden="true"><span>⟲ KÉO ĐỂ XOAY 3D ⟳</span></div>
          </div>
        </div>
        <div class="a5-turntable-info">
          <div class="a5-turntable-topline">
            <span class="a5-turntable-badge" id="a5SpotlightBadge">MẢNH GHÉP #01 · NAM</span>
            <span class="a5-turntable-accessory" id="a5SpotlightAccessory">✦ Huy hiệu Sao A5</span>
          </div>
          <h4 id="a5SpotlightName">Phạm Gia Anh</h4>
          <p id="a5SpotlightNote" class="a5-turntable-quote">“Cảm ơn vì đã cùng tớ đi qua những năm tháng rực rỡ nhất của 12A5!” ♡</p>
          <div class="a5-turntable-actions" role="group" aria-label="Tương tác với mô hình 3D">
            <button type="button" class="a5-pose-btn active" data-a5-pose="wave">👋 Vẫy chào</button>
            <button type="button" class="a5-pose-btn" data-a5-pose="jump">✨ Nhảy vui</button>
            <button type="button" class="a5-pose-btn" data-a5-pose="photo">📸 Tạo dáng</button>
            <button type="button" class="a5-pose-btn" data-a5-action="spin-toggle" id="a5AutoSpinBtn">🔄 Tự xoay 360°</button>
            <button type="button" class="a5-pose-btn a5-open-profile-btn hidden" id="a5OpenMatchedProfileBtn" data-a5-action="open-matched-profile">💌 Ghé hồ sơ lưu bút ↗</button>
          </div>
        </div>
      `;
      bindTurntableDrag();
    }
  }

  function updateSpotlight() {
    const idx = selectedIndex >= 0 && selectedIndex < roster.length ? selectedIndex : 0;
    const chosen = roster[idx];
    if (!chosen) return;
    const palette = outfitPalettes[idx % outfitPalettes.length];
    const spotlight = document.getElementById('a5ClassmateSpotlight');
    if (spotlight) spotlight.style.setProperty('--spotlight-accent', palette.main);

    const figure = document.getElementById('a5TurntableFigure');
    if (figure) {
      figure.className = `a5-turntable-figure pose-${activePose}`;
      figure.innerHTML = avatarSVG(chosen, idx, { prefix: 'stage' });
      figure.style.setProperty('--a5-turn-deg', `${turntableAngle}deg`);
    }
    const badge = document.getElementById('a5SpotlightBadge');
    if (badge) badge.textContent = `MẢNH GHÉP #${String(idx + 1).padStart(2, '0')} · ${chosen.gender.toUpperCase()}`;
    const acc = document.getElementById('a5SpotlightAccessory');
    if (acc) acc.textContent = accessoryLabels[idx % accessoryLabels.length];
    const nameEl = document.getElementById('a5SpotlightName');
    if (nameEl) nameEl.textContent = chosen.name;
    const noteEl = document.getElementById('a5SpotlightNote');
    if (noteEl) noteEl.textContent = greetings[idx % greetings.length];
    const speech = document.getElementById('a5TurntableSpeech');
    if (speech) {
      const firstName = chosen.name.split(' ').slice(-1)[0];
      speech.textContent = activePose === 'jump'
        ? `Yeah! 12A5 mãi đỉnh! ✨`
        : activePose === 'photo'
          ? `1, 2, 3… Cười lên nào! 📸`
          : `${firstName} chào cậu nha! 👋`;
    }
    const matched = matchProfileForMember(chosen);
    const profileBtn = document.getElementById('a5OpenMatchedProfileBtn');
    if (profileBtn) {
      if (matched) {
        profileBtn.classList.remove('hidden');
        profileBtn.dataset.userId = matched.id;
      } else {
        profileBtn.classList.add('hidden');
        delete profileBtn.dataset.userId;
      }
    }
    document.querySelectorAll('[data-a5-pose]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.a5Pose === activePose);
    });
  }

  function bindTurntableDrag() {
    const viewport = document.getElementById('a5TurntableViewport');
    if (!viewport || viewport.dataset.dragBound) return;
    viewport.dataset.dragBound = 'true';
    let dragging = false;
    let startX = 0;
    let startAngle = 0;

    viewport.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startAngle = turntableAngle;
      viewport.setPointerCapture?.(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      turntableAngle = Math.max(-45, Math.min(45, startAngle + dx * 0.45));
      const fig = document.getElementById('a5TurntableFigure');
      if (fig) fig.style.setProperty('--a5-turn-deg', `${turntableAngle.toFixed(1)}deg`);
    });
    const endDrag = () => { dragging = false; };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
  }

  function toggleAutoSpin() {
    autoSpin = !autoSpin;
    const btn = document.getElementById('a5AutoSpinBtn');
    btn?.classList.toggle('active', autoSpin);
    if (spinFrame) {
      cancelAnimationFrame(spinFrame);
      spinFrame = 0;
    }
    if (!autoSpin) {
      turntableAngle = 0;
      const fig = document.getElementById('a5TurntableFigure');
      if (fig) fig.style.setProperty('--a5-turn-deg', '0deg');
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      if (!autoSpin) return;
      const t = (now - start) / 1000;
      turntableAngle = Math.sin(t * 2.1) * 32;
      const fig = document.getElementById('a5TurntableFigure');
      if (fig) fig.style.setProperty('--a5-turn-deg', `${turntableAngle.toFixed(1)}deg`);
      spinFrame = requestAnimationFrame(tick);
    };
    spinFrame = requestAnimationFrame(tick);
  }

  function render() {
    const panel = document.getElementById('classGatheringPanel');
    const grid = document.getElementById('a5ClassmateGrid');
    if (!panel || !grid || panel.classList.contains('hidden')) return;
    ensureStudioControls(panel);

    const search = normalise(document.getElementById('a5ClassmateSearch')?.value || '');
    const members = roster.map((member, index) => ({ ...member, index })).filter((member) => {
      const matchesSearch = !search || normalise(member.name).includes(search);
      const matchesGender = activeGender === 'all' || member.gender === activeGender;
      return matchesSearch && matchesGender;
    });

    if (selectedIndex < 0 || selectedIndex >= roster.length) selectedIndex = 0;
    grid.dataset.stageView = activeStageView;
    const total = Math.max(1, members.length);

    grid.innerHTML = members.map((member, viewIndex) => {
      const palette = outfitPalettes[member.index % outfitPalettes.length];
      const firstName = member.name.split(' ').slice(-1)[0];
      const isSelected = member.index === selectedIndex;
      const matched = matchProfileForMember(member);
      const angle = Math.round((viewIndex / total) * 360);
      const riserRow = viewIndex % 3;
      return `<button type="button" class="a5-classmate-card${isSelected ? ' is-focused' : ''}${matched ? ' has-profile' : ''}" data-a5-classmate="${member.index}" aria-pressed="${isSelected}" style="--friend-accent:${palette.main};--friend-deep:${palette.deep};--friend-delay:${Math.min(viewIndex * 16, 480)}ms;--orbit-angle:${angle}deg;--riser-row:${riserRow}" aria-label="${escapeHTML(member.name)}, ${member.gender}. Chạm để tương tác 3D">
        <span class="a5-classmate-glare" aria-hidden="true"></span>
        <span class="a5-classmate-number">#${String(member.index + 1).padStart(2, '0')}</span>
        ${matched ? '<span class="a5-classmate-joined-dot" title="Đã tham gia lưu bút">✓</span>' : ''}
        <span class="a5-3d-avatar ${member.gender === 'Nữ' ? 'is-girl' : 'is-boy'}">${avatarSVG(member, member.index)}</span>
        <strong class="a5-classmate-name">${escapeHTML(member.name)}</strong>
        <span class="a5-classmate-meta"><i aria-hidden="true">${member.gender === 'Nữ' ? '✿' : '✦'}</i>${member.gender}</span>
        <span class="a5-classmate-first-name">${escapeHTML(firstName)}</span>
      </button>`;
    }).join('');

    const empty = document.getElementById('a5ClassmateEmpty');
    if (empty) empty.classList.toggle('hidden', members.length > 0);
    const count = document.getElementById('a5RosterCount');
    if (count) count.textContent = String(roster.length);

    document.querySelectorAll('[data-a5-gender-filter]').forEach((button) => {
      const active = button.dataset.a5GenderFilter === activeGender;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-a5-stage-view]').forEach((button) => {
      const active = button.dataset.a5StageView === activeStageView;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    updateSpotlight();
  }

  function focusMember(index) {
    const safeIdx = Math.max(0, Math.min(roster.length - 1, Number(index) || 0));
    selectedIndex = safeIdx;
    turntableAngle = 0;
    render();
    const spotlight = document.getElementById('a5ClassmateSpotlight');
    spotlight?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }

  // Interactive 3D Pointer Tilt for desktop cards (.a5-classmate-card and .person-card.a5-3d-tilt-card)
  let tiltFrame = 0;
  let activeTiltEl = null;
  let lastPointer = { x: 0, y: 0 };

  function updateCardTilt() {
    tiltFrame = 0;
    if (!activeTiltEl || !activeTiltEl.isConnected) return;
    const rect = activeTiltEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const px = Math.max(0, Math.min(1, (lastPointer.x - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (lastPointer.y - rect.top) / rect.height));
    const ry = ((px - 0.5) * 18).toFixed(2);
    const rx = ((0.5 - py) * 15).toFixed(2);
    activeTiltEl.style.setProperty('--a5-rx', `${rx}deg`);
    activeTiltEl.style.setProperty('--a5-ry', `${ry}deg`);
    activeTiltEl.style.setProperty('--a5-gx', `${Math.round(px * 100)}%`);
    activeTiltEl.style.setProperty('--a5-gy', `${Math.round(py * 100)}%`);
  }

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const target = event.target instanceof Element
      ? event.target.closest('.a5-classmate-card, .person-card.a5-3d-tilt-card')
      : null;
    if (activeTiltEl && activeTiltEl !== target) {
      activeTiltEl.style.removeProperty('--a5-rx');
      activeTiltEl.style.removeProperty('--a5-ry');
      activeTiltEl = null;
    }
    if (!target) return;
    activeTiltEl = target;
    lastPointer.x = event.clientX;
    lastPointer.y = event.clientY;
    if (!tiltFrame) tiltFrame = requestAnimationFrame(updateCardTilt);
  }, { passive: true });

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'a5ClassmateSearch') render();
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    // Companion badge inside Friends Directory -> jump to 3D Studio & focus that classmate!
    const open3dFriend = target.closest('[data-action="open-3d-friend"]');
    if (open3dFriend) {
      event.preventDefault();
      event.stopPropagation();
      const idx = Number(open3dFriend.dataset.classmateIndex) || 0;
      if (typeof window.A5SwitchPeopleMode === 'function') {
        window.A5SwitchPeopleMode('gathering', { focusClassmateIndex: idx });
      }
      return;
    }

    const filter = target.closest('[data-a5-gender-filter]');
    if (filter) {
      activeGender = filter.dataset.a5GenderFilter || 'all';
      render();
      return;
    }

    const stageBtn = target.closest('[data-a5-stage-view]');
    if (stageBtn) {
      activeStageView = stageBtn.dataset.a5StageView || 'grid';
      render();
      return;
    }

    const poseBtn = target.closest('[data-a5-pose]');
    if (poseBtn) {
      activePose = poseBtn.dataset.a5Pose || 'wave';
      updateSpotlight();
      return;
    }

    const studioAction = target.closest('[data-a5-action]');
    if (studioAction) {
      const act = studioAction.dataset.a5Action;
      if (act === 'spin-toggle') {
        toggleAutoSpin();
      } else if (act === 'random-classmate') {
        const nextIdx = Math.floor(Math.random() * roster.length);
        activePose = ['wave', 'jump', 'photo'][nextIdx % 3];
        focusMember(nextIdx);
      } else if (act === 'open-matched-profile') {
        const uid = studioAction.dataset.userId;
        if (uid && typeof openProfileCallback === 'function') {
          openProfileCallback(uid);
        }
      }
      return;
    }

    const card = target.closest('[data-a5-classmate]');
    if (card) {
      const nextIndex = Number(card.dataset.a5Classmate);
      selectedIndex = nextIndex;
      turntableAngle = 0;
      document.querySelectorAll('[data-a5-classmate]').forEach((item) => {
        const active = Number(item.dataset.a5Classmate) === selectedIndex;
        item.classList.toggle('is-focused', active);
        item.setAttribute('aria-pressed', String(active));
      });
      updateSpotlight();
    }
  });

  /* A real cover-flip transition, followed by the existing page-spread renderer. */
  let yearbookOpeningTimer = 0;
  const yearbookBookMotion = {
    open(onComplete) {
      const cover = document.getElementById('yearbookCover');
      const openButton = cover?.querySelector('.yearbook-open-button');
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const lite = document.documentElement.classList.contains('a5-perf-lite') || document.documentElement.classList.contains('a5-auto-lite');
      const finish = () => {
        yearbookOpeningTimer = 0;
        cover?.classList.remove('is-opening');
        if (openButton) openButton.disabled = false;
        if (typeof onComplete === 'function') onComplete();
        window.requestAnimationFrame(() => {
          const reading = document.getElementById('yearbookReading');
          if (!reading || reading.classList.contains('hidden')) return;
          reading.classList.remove('a5-book-reveal');
          void reading.offsetWidth;
          reading.classList.add('a5-book-reveal');
          window.setTimeout(() => reading.classList.remove('a5-book-reveal'), 820);
        });
      };
      if (!cover || cover.classList.contains('hidden') || reduced || lite) {
        finish();
        return;
      }
      if (yearbookOpeningTimer) return;
      if (openButton) openButton.disabled = true;
      cover.classList.remove('is-opening');
      void cover.offsetWidth;
      cover.classList.add('is-opening');
      yearbookOpeningTimer = window.setTimeout(finish, 850);
    }
  };

  window.A5YearbookBookMotion = yearbookBookMotion;

  window.A5ClassReunion = Object.freeze({
    count: roster.length,
    boys: roster.filter((member) => member.gender === 'Nam').length,
    girls: roster.filter((member) => member.gender === 'Nữ').length,
    render,
    focusMember,
    miniFigurineForProfile,
    syncProfiles(profilesList, onOpenProfile) {
      if (Array.isArray(profilesList)) syncedProfiles = profilesList;
      if (typeof onOpenProfile === 'function') openProfileCallback = onOpenProfile;
    }
  });
})(window, document);
