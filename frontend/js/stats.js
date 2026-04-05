// ── Helpers ───────────────────────────────────────────────
function getSolvedPracticeIds() {
  try { return new Set(JSON.parse(localStorage.getItem('practice_solved') || '[]')); }
  catch { return new Set(); }
}

function getSolvedTopicIds(slug) {
  try { return new Set(JSON.parse(localStorage.getItem(`solved_${slug}`) || '[]')); }
  catch { return new Set(); }
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Streak calculation ────────────────────────────────────
function getStreak() {
  try {
    const history = JSON.parse(localStorage.getItem('solve_history') || '[]');
    if (!history.length) return 0;
    const days = new Set(history.map(d => new Date(d).toDateString()));
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (!days.has(today) && !days.has(yesterday)) return 0;
    let streak = 0;
    let check = days.has(today) ? new Date() : new Date(Date.now() - 86400000);
    while (days.has(check.toDateString())) {
      streak++;
      check = new Date(check.getTime() - 86400000);
    }
    return streak;
  } catch { return 0; }
}

// ── Sidebar ───────────────────────────────────────────────
function renderSidebar(topics) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = topics.map((t, i) => {
    const solved = getSolvedTopicIds(t.slug).size;
    const total = t.task_count;
    const done = total > 0 && solved === total;
    const badge = total === 0 ? '' : done ? '✓' : solved > 0 ? `${solved}/${total}` : `${total}`;
    const badgeClass = done ? ' nav-item__badge--done' : solved > 0 ? ' nav-item__badge--progress' : '';
    return `
      <a class="nav-item" href="/topic.html?slug=${t.slug}">
        <span class="nav-item__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="nav-item__title">${escHtml(t.title)}</span>
        ${badge ? `<span class="nav-item__badge${badgeClass}">${badge}</span>` : ''}
      </a>`;
  }).join('');
}

// ── Render ────────────────────────────────────────────────
function render(challenges, topics) {
  const solvedIds = getSolvedPracticeIds();

  // Overall stats
  const total = challenges.length;
  const solved = solvedIds.size;
  const pct = total > 0 ? Math.round(solved / total * 100) : 0;
  const streak = getStreak();

  // By difficulty
  const byDiff = { easy: {total:0,solved:0}, medium: {total:0,solved:0}, hard: {total:0,solved:0} };
  challenges.forEach(c => {
    if (byDiff[c.difficulty]) {
      byDiff[c.difficulty].total++;
      if (solvedIds.has(String(c.id))) byDiff[c.difficulty].solved++;
    }
  });

  // By category
  const byCategory = {};
  challenges.forEach(c => {
    if (!byCategory[c.category]) byCategory[c.category] = { total: 0, solved: 0 };
    byCategory[c.category].total++;
    if (solvedIds.has(String(c.id))) byCategory[c.category].solved++;
  });

  // Topics progress
  const topicsProgress = topics.map(t => {
    const solvedSet = getSolvedTopicIds(t.slug);
    return { title: t.title, solved: solvedSet.size, total: t.task_count };
  });

  const diffLabel = { easy: 'Лёгкие', medium: 'Средние', hard: 'Сложные' };
  const diffColor = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' };
  const diffBg = { easy: 'var(--easy-bg)', medium: 'var(--medium-bg)', hard: 'var(--hard-bg)' };

  document.getElementById('stats-container').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Статистика</h1>
      <p class="page-subtitle">Ваш прогресс по курсу</p>
    </div>

    <!-- Карточки -->
    <div class="stats-cards">
      <div class="stats-card">
        <div class="stats-card__value">${solved}</div>
        <div class="stats-card__label">Задач решено</div>
      </div>
      <div class="stats-card">
        <div class="stats-card__value">${total}</div>
        <div class="stats-card__label">Всего задач</div>
      </div>
      <div class="stats-card">
        <div class="stats-card__value">${pct}%</div>
        <div class="stats-card__label">Выполнено</div>
      </div>
      <div class="stats-card stats-card--streak">
        <div class="stats-card__value">${streak}</div>
        <div class="stats-card__label">Дней подряд</div>
      </div>
    </div>

    <!-- Общий прогресс -->
    <div class="stats-section">
      <div class="stats-section__title">Общий прогресс</div>
      <div class="stats-progress-bar">
        <div class="stats-progress-bar__fill" style="width:${pct}%"></div>
      </div>
      <div class="stats-progress-label">${solved} из ${total} задач</div>
    </div>

    <!-- По сложности -->
    <div class="stats-section">
      <div class="stats-section__title">По сложности</div>
      <div class="stats-diff-grid">
        ${Object.entries(byDiff).map(([diff, data]) => {
          const p = data.total > 0 ? Math.round(data.solved / data.total * 100) : 0;
          return `
            <div class="stats-diff-card">
              <div class="stats-diff-card__header">
                <span class="stats-diff-card__label" style="color:${diffColor[diff]}">${diffLabel[diff]}</span>
                <span class="stats-diff-card__count">${data.solved}/${data.total}</span>
              </div>
              <div class="stats-progress-bar stats-progress-bar--sm">
                <div class="stats-progress-bar__fill" style="width:${p}%;background:${diffColor[diff]}"></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- По категориям -->
    <div class="stats-section">
      <div class="stats-section__title">По категориям</div>
      <div class="stats-cat-list">
        ${Object.entries(byCategory).sort((a,b) => b[1].solved - a[1].solved).map(([cat, data]) => {
          const p = data.total > 0 ? Math.round(data.solved / data.total * 100) : 0;
          return `
            <div class="stats-cat-row">
              <span class="stats-cat-row__name">${escHtml(cat)}</span>
              <div class="stats-progress-bar stats-progress-bar--sm" style="flex:1">
                <div class="stats-progress-bar__fill" style="width:${p}%"></div>
              </div>
              <span class="stats-cat-row__count">${data.solved}/${data.total}</span>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- По темам курса -->
    ${topicsProgress.some(t => t.total > 0) ? `
    <div class="stats-section">
      <div class="stats-section__title">Темы курса</div>
      <div class="stats-cat-list">
        ${topicsProgress.filter(t => t.total > 0).map(t => {
          const p = Math.round(t.solved / t.total * 100);
          return `
            <div class="stats-cat-row">
              <span class="stats-cat-row__name">${escHtml(t.title)}</span>
              <div class="stats-progress-bar stats-progress-bar--sm" style="flex:1">
                <div class="stats-progress-bar__fill" style="width:${p}%"></div>
              </div>
              <span class="stats-cat-row__count">${t.solved}/${t.total}</span>
            </div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  if (typeof renderAuthWidget === 'function') renderAuthWidget();

  try {
    const [challenges, topics] = await Promise.all([
      API.getChallenges(),
      API.getTopics()
    ]);
    renderSidebar(topics);
    render(challenges, topics);

    const badge = document.getElementById('practice-nav-badge');
    if (badge) {
      const solved = new Set(JSON.parse(localStorage.getItem('practice_solved') || '[]')).size;
      if (solved > 0) {
        badge.textContent = solved === challenges.length ? '✓' : `${solved}/${challenges.length}`;
        badge.className = `nav-item__badge ${solved === challenges.length ? 'nav-item__badge--done' : 'nav-item__badge--progress'}`;
      }
    }
  } catch (e) {
    document.getElementById('stats-container').innerHTML =
      `<div class="loading">Ошибка загрузки. Убедитесь, что сервер запущен.</div>`;
  }
}

init();
