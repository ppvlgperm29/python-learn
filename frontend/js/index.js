function getSolvedCount(slug) {
  try { return JSON.parse(localStorage.getItem(`solved_${slug}`) || '[]').length; }
  catch { return 0; }
}

function renderSidebarNav(topics, activeSlug) {
  renderSidebar(topics, activeSlug);
}

function renderTopicsGrid(topics) {
  const totalTasks = topics.reduce((sum, t) => sum + t.task_count, 0);
  const totalSolved = topics.reduce((sum, t) => sum + getSolvedCount(t.slug), 0);

  const overallHtml = totalTasks > 0 ? `
    <div class="overall-progress">
      <div class="overall-progress__bar">
        <div class="overall-progress__fill" style="width:${Math.round(totalSolved/totalTasks*100)}%"></div>
      </div>
      <span class="overall-progress__label">Выполнено задач: ${totalSolved} из ${totalTasks}</span>
    </div>` : '';

  const container = document.getElementById('topics-container');
  container.innerHTML = overallHtml + `<div class="topics-grid">${topics.map((t, i) => {
    const solved = getSolvedCount(t.slug);
    const total = t.task_count;
    const pct = total > 0 ? Math.round(solved / total * 100) : 0;
    const done = total > 0 && solved === total;

    const progressHtml = total > 0 ? `
      <div class="topic-card__progress">
        <div class="topic-card__progress-bar">
          <div class="topic-card__progress-fill${done ? ' topic-card__progress-fill--done' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="topic-card__progress-text${done ? ' topic-card__progress-text--done' : ''}">${done ? '✓ Выполнено' : solved > 0 ? `${solved} / ${total}` : `${total} задач`}</span>
      </div>` : '';

    return `
      <a class="topic-card${done ? ' topic-card--done' : ''}" href="/topic.html?slug=${t.slug}">
        <div class="topic-card__number">${String(i + 1).padStart(2, '0')}</div>
        <div class="topic-card__body">
          <div class="topic-card__title">${t.title}</div>
          <div class="topic-card__desc">${t.description}</div>
          ${progressHtml}
        </div>
      </a>`;
  }).join('')}</div>`;
}

function updatePracticeBadge() {
  try {
    const solved = JSON.parse(localStorage.getItem('practice_solved') || '[]');
    const badge = document.getElementById('practice-nav-badge');
    if (!badge || solved.length === 0) { if (badge) badge.textContent = ''; return; }
    badge.textContent = solved.length;
    badge.className = 'nav-item__badge nav-item__badge--progress';
  } catch { /* ignore */ }
}

async function init() {
  renderAuthWidget();
  await loadServerProgress();
  try {
    const topics = await API.getTopics();
    renderSidebarNav(topics, null);
    renderTopicsGrid(topics);
    updatePracticeBadge();
  } catch (e) {
    document.getElementById('topics-container').innerHTML =
      `<div class="loading">Не удалось загрузить темы.<br>Убедитесь, что сервер запущен:<br><code>uvicorn backend.app:app --port 8000</code></div>`;
  }
}

init();
