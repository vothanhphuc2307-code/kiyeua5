/* A5 Class Reunion — 45 names from the supplied 12A05 roster.
   No birth dates, photos, or profile data are stored in this static class portrait. */
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

  const outfitColors = ['#e8a4b9', '#a7a0d8', '#e3bd84', '#91b9b3', '#d9a0d2', '#83a9cf', '#e5a78e', '#9cbf8e', '#c49dc2'];
  const hairColors = ['#4b3540', '#5c3c35', '#3d354b', '#6b4c42', '#473b36'];
  const hairCuts = {
    boy: [
      '<path d="M29 49C27 28 39 16 52 16c15 0 23 11 20 31-5-5-8-11-8-16-7 8-17 12-31 13z" fill="url(#hair)"/><path d="M31 42c5-10 14-13 24-13" fill="none" stroke="#fff" stroke-opacity=".17" stroke-width="2" stroke-linecap="round"/>',
      '<path d="M29 49c-3-18 8-34 24-34 14 0 22 10 19 31-5-2-8-6-10-12-5 8-16 13-33 15z" fill="url(#hair)"/><path d="m34 31 9-8 8 2" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2" stroke-linecap="round"/>',
      '<path d="M28 49c-1-22 10-34 24-34 16 0 24 13 19 34-4-4-7-8-8-14-9 8-19 11-35 14z" fill="url(#hair)"/><path d="M34 29c5-7 12-10 20-9" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2" stroke-linecap="round"/>',
      '<path d="M28 49c-2-20 8-34 24-34 14 0 23 12 20 33-6-4-10-9-12-17-5 7-15 13-32 18z" fill="url(#hair)"/><path d="m30 38 6-13 6 2" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2" stroke-linecap="round"/>'
    ],
    girl: [
      '<path d="M30 44c-1-17 8-27 21-28 14-1 23 10 20 28-7-8-13-12-20-12-7 0-13 5-21 12z" fill="url(#hair)"/>',
      '<path d="M29 45c0-18 9-29 23-29 15 0 23 12 19 29-5-8-13-13-21-12-8 0-14 5-21 12z" fill="url(#hair)"/>',
      '<path d="M30 44c-1-16 8-28 21-28 15 0 23 11 20 28-7-7-12-11-19-11-8 0-15 5-22 11z" fill="url(#hair)"/><path d="M66 18q13-6 14 8-8 3-14-8" fill="url(#hair)"/>',
      '<path d="M30 45c-2-17 8-29 22-29 15 0 23 12 19 29-8-8-13-12-21-12-7 0-13 5-20 12z" fill="url(#hair)"/>'
    ]
  };

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalise = (value) => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  let activeGender = 'all';
  let selectedIndex = -1;

  function avatarSVG(member, index) {
    const outfit = outfitColors[index % outfitColors.length];
    const hair = hairColors[(index * 3 + 1) % hairColors.length];
    const girl = member.gender === 'Nữ';
    const hairMarkup = hairCuts[girl ? 'girl' : 'boy'][index % 4];
    const skinId = `skin-${index}`;
    const shirtId = `shirt-${index}`;
    const hairId = `hair-${index}`;
    const girlBackHair = girl ? '<path d="M32 39C25 33 27 23 33 19 29 34 34 43 37 47L38 78Q35 88 30 80 26 58 32 39Z" fill="url(#HAIR)"/><path d="M68 39C75 33 73 23 67 19 71 34 66 43 63 47L62 78Q65 88 70 80 74 58 68 39Z" fill="url(#HAIR)"/>' : '';
    const backHair = girlBackHair.replace(/url\(#HAIR\)/g, `url(#${hairId})`);
    return `<svg class="a5-avatar-model" viewBox="0 0 100 132" role="img" aria-label="Nhân vật minh hoạ ${girl ? 'nữ' : 'nam'}">
      <defs>
        <linearGradient id="${skinId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffdfc8"/><stop offset=".58" stop-color="#efbd9d"/><stop offset="1" stop-color="#d99b7f"/></linearGradient>
        <linearGradient id="${shirtId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".3" stop-color="${outfit}"/><stop offset="1" stop-color="#715b83" stop-opacity=".25"/></linearGradient>
        <linearGradient id="${hairId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#806052"/><stop offset=".45" stop-color="${hair}"/><stop offset="1" stop-color="#2e2735"/></linearGradient>
      </defs>
      <ellipse cx="50" cy="125" rx="25" ry="5" fill="#55445c" opacity=".15"/>
      <path d="M35 108h13l-1 17H35zM52 108h13l-1 17H52z" fill="#65566b"/>
      <path d="M34 122h15v4H32q0-3 2-4zM51 122h15q2 1 2 4H51z" fill="#f6e6dc" stroke="#d7b6b7" stroke-width=".8"/>
      <path d="M26 87c3-7 10-10 17-11h14c8 1 14 4 17 11l2 23c-8 4-17 6-26 6s-18-2-26-6z" fill="url(#${shirtId})" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>
      <path d="M43 78h14l-1 9-6 6-7-6z" fill="url(#${skinId})"/>
      <path d="M28 89 21 103q-1 4 3 5l8-12M72 89l7 14q1 4-3 5l-8-12" fill="none" stroke="url(#${skinId})" stroke-width="5" stroke-linecap="round"/>
      <path d="M34 91c4-7 9-10 16-10s13 3 17 10" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="2"/>
      <ellipse cx="30" cy="52" rx="4.7" ry="7" fill="#e6ad8e"/><ellipse cx="70" cy="52" rx="4.7" ry="7" fill="#d99e80"/>
      <g>${backHair}</g>
      <ellipse cx="50" cy="49" rx="19" ry="25" fill="url(#${skinId})"/>
      <ellipse cx="44" cy="48" rx="1.5" ry="2.1" fill="#493844"/><ellipse cx="57" cy="48" rx="1.5" ry="2.1" fill="#493844"/>
      <path d="M46 59q4 4 8 0" fill="none" stroke="#9d5f64" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M39 42q4-3 8 0M54 40q4-2 8 1" fill="none" stroke="#684b48" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M39 55q2 1 4 0M58 55q2 1 4 0" fill="none" stroke="#dc8d87" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
      <g style="--hair-fill:url(#${hairId})">${hairMarkup.replace(/url\(#hair\)/g, `url(#${hairId})`)}</g>
      <path d="M43 84q7 5 14 0" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="25" cy="92" r="2" fill="#fff" opacity=".55"/><circle cx="75" cy="94" r="2" fill="#fff" opacity=".55"/>
    </svg>`;
  }

  function render() {
    const panel = document.getElementById('classGatheringPanel');
    const grid = document.getElementById('a5ClassmateGrid');
    if (!panel || !grid || panel.classList.contains('hidden')) return;
    const search = normalise(document.getElementById('a5ClassmateSearch')?.value || '');
    const members = roster.map((member, index) => ({ ...member, index })).filter((member) => {
      const matchesSearch = !search || normalise(member.name).includes(search);
      const matchesGender = activeGender === 'all' || member.gender === activeGender;
      return matchesSearch && matchesGender;
    });

    grid.innerHTML = members.map((member, viewIndex) => {
      const tint = outfitColors[member.index % outfitColors.length];
      const firstName = member.name.split(' ').slice(-1)[0];
      const isSelected = member.index === selectedIndex;
      return `<button type="button" class="a5-classmate-card${isSelected ? ' is-focused' : ''}" data-a5-classmate="${member.index}" aria-pressed="${isSelected}" style="--friend-accent:${tint};--friend-delay:${Math.min(viewIndex * 17, 560)}ms" aria-label="${escapeHTML(member.name)}, ${member.gender}. Chạm để xem thông tin">
        <span class="a5-classmate-number">${String(member.index + 1).padStart(2, '0')}</span>
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

    if (selectedIndex >= 0) {
      const chosen = roster[selectedIndex];
      const spotlightName = document.getElementById('a5SpotlightName');
      const spotlightNote = document.getElementById('a5SpotlightNote');
      if (spotlightName) spotlightName.textContent = chosen.name;
      if (spotlightNote) spotlightNote.textContent = `Một mảnh ghép ${chosen.gender.toLocaleLowerCase('vi')} của tập thể 12A5. ♡`;
    }
  }

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'a5ClassmateSearch') render();
  });
  document.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-a5-gender-filter]');
    if (filter) {
      activeGender = filter.dataset.a5GenderFilter || 'all';
      render();
      return;
    }
    const card = event.target.closest('[data-a5-classmate]');
    if (card) {
      const nextIndex = Number(card.dataset.a5Classmate);
      selectedIndex = selectedIndex === nextIndex ? -1 : nextIndex;
      document.querySelectorAll('[data-a5-classmate]').forEach((item) => {
        const active = Number(item.dataset.a5Classmate) === selectedIndex;
        item.classList.toggle('is-focused', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const spotlight = document.getElementById('a5ClassmateSpotlight');
      spotlight?.classList.toggle('has-selection', selectedIndex >= 0);
      const spotlightName = document.getElementById('a5SpotlightName');
      const spotlightNote = document.getElementById('a5SpotlightNote');
      if (selectedIndex >= 0) {
        const chosen = roster[selectedIndex];
        if (spotlightName) spotlightName.textContent = chosen.name;
        if (spotlightNote) spotlightNote.textContent = `Một mảnh ghép ${chosen.gender.toLocaleLowerCase('vi')} của tập thể 12A5. ♡`;
      } else {
        if (spotlightName) spotlightName.textContent = '45 người · một mái nhà';
        if (spotlightNote) spotlightNote.textContent = 'Chọn một nhân vật để nhìn gần hơn nhé.';
      }
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
    render
  });
})(window, document);
